// `just mobile` runs this: it opens the built room as a phone would (390×844 CSS pixels, a
// pixel ratio of 3, touch, Chrome's CPU slowed 4×) and as a laptop would (1280×720, ratio 2),
// and prints for each what the visitor pays: the bytes and the requests before the room shows,
// the time until it shows, the time until every model has arrived, everything transferred by
// then, the size of the picture drawn (the drawing buffer), and the time one frame of the room
// takes, the GPU's work included (a pixel is read back after each frame).
//
//   just mobile --device phone --bytes     the 12 biggest files before the room shows
//   just mobile --runs 3                   each device three times: the median, and the spread
//   just mobile --net 4g                   on a 4G line (9 Mbit/s down, 60 ms); `slow4g`: 1.6 Mbit/s, 150 ms
//   just mobile --load                     only the load: no frame is timed (much faster in software)
//   just mobile --dist /tmp/before         another build's folder
//   just mobile --json out.json            the numbers, for `just load-budget` and for a table
//   just mobile --url https://room.piabrota.art/   a running site
//
// The build is served here as the host serves it (scripts/serve.mjs): a `.br` or `.gz` file that
// lies beside a file is sent in its place, text is gzipped otherwise, on HTTP/1.1.
//
// In this container Chrome draws in software (SwiftShader), so the times are not a phone's; they
// compare one build with another, on the same machine. Trust the bytes, the requests and their order.
import { existsSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';
import { serve } from './serve.mjs';

const root = new URL('..', import.meta.url).pathname;
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
function chrome() {
  if (process.env.CHROME) return process.env.CHROME;
  const mac = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  if (existsSync(mac)) return mac;
  for (const d of existsSync('/opt/pw-browsers') ? readdirSync('/opt/pw-browsers') : []) {
    const p = `/opt/pw-browsers/${d}/chrome-linux64/chrome`;
    if (existsSync(p)) return p;
  }
  return undefined;
}
const server = arg('--url') ? null : await serve(resolve(arg('--dist') ?? `${root}dist`), { plain: process.argv.includes('--plain') });
const url = arg('--url') ?? server.url;
const gpu = process.platform === 'darwin';
const browser = await chromium.launch({ executablePath: chrome(), args: gpu ? [] : ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });

const devices = {
  phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, cpu: 4 },
  laptop: { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2, isMobile: false, hasTouch: false, cpu: 1 },
};
// Chrome DevTools' own presets: bytes a second down and up, and the delay of each request
const nets = { '4g': [9e6 / 8, 1.5e6 / 8, 60], slow4g: [1.6e6 / 8, 750e3 / 8, 150] };
const net = arg('--net'), runs = Number(arg('--runs') ?? 1);
if (net && !nets[net]) { console.error(`--net is one of ${Object.keys(nets).join(', ')}`); process.exit(1); }
const only = arg('--device');
const query = arg('--query') ?? '';
const median = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
const spread = (a, digits = 1) => (a.length > 1 ? ` (${Math.min(...a).toFixed(digits)} to ${Math.max(...a).toFixed(digits)})` : '');
const report = {};

async function visit(d) {
  const { cpu, ...ctxOpts } = d;
  const ctx = await browser.newContext(ctxOpts);
  const page = await ctx.newPage();
  page.setDefaultTimeout(600000);
  const urls = new Map(), files = [];
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  if (net) await cdp.send('Network.emulateNetworkConditions', { offline: false, downloadThroughput: nets[net][0], uploadThroughput: nets[net][1], latency: nets[net][2] });
  cdp.on('Network.requestWillBeSent', (e) => urls.set(e.requestId, e.request.url));
  cdp.on('Network.loadingFinished', (e) => { files.push([e.encodedDataLength, urls.get(e.requestId)]); });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
  // when #loading gets `done`, for a build older than the `room:shown` mark
  await page.addInitScript(() => new MutationObserver((_, obs) => {
    if (document.getElementById('loading')?.classList.contains('done')) { window.__shownAt = performance.now(); obs.disconnect(); }
  }).observe(document, { subtree: true, attributes: true, attributeFilter: ['class'] }));
  await page.goto(`${url}?hifi&night${query}`);
  await page.waitForSelector('#loading.done');
  // every file that had arrived when the room showed (performance.mark in src/app.js), and when it showed
  const { before, shownAt } = await page.evaluate(() => {
    const at = performance.getEntriesByName('room:shown')[0]?.startTime ?? window.__shownAt ?? Infinity;
    return { shownAt: at, before: performance.getEntriesByType('resource').filter((e) => e.responseEnd <= at).map((e) => [e.transferSize || e.encodedBodySize, e.name]) };
  });
  const html = files.find(([, u]) => u === page.url())?.[0] ?? 0;
  const shown = before.reduce((a, [b]) => a + b, 0) + html;
  // every model in its place (room.ready), then a moment for what follows it
  const modelsAt = await page.evaluate(async () => { await window.__room.room.ready; return performance.now(); });
  await page.waitForTimeout(net ? 3000 : 1500);
  const total = files.reduce((a, [b]) => a + b, 0);
  const r = await page.evaluate(async (frames) => {
    const { renderer, step, post } = window.__room;
    const gl = renderer.getContext(), px = new Uint8Array(4);
    const one = () => { const t = performance.now(); step(1 / 30); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); return performance.now() - t; };
    const ts = [0];
    if (frames) { for (let i = 0; i < 5; i++) one(); ts.length = 0; for (let i = 0; i < 20; i++) ts.push(one()); } // five to warm up
    ts.sort((a, b) => a - b);
    const paint = performance.getEntriesByType('paint').find((e) => e.name === 'first-contentful-paint')?.startTime ?? null;
    return { w: gl.drawingBufferWidth, h: gl.drawingBufferHeight, ratio: renderer.getPixelRatio(), median: ts[ts.length >> 1], profile: post.profile ?? 'full', files: window.__room.quality.files ?? window.__room.quality.name, paint, textures: renderer.info.memory.textures };
  }, !process.argv.includes('--load'));
  await ctx.close();
  return { ...r, shown, requests: before.length + 1, shownAt: shownAt / 1000, modelsAt: modelsAt / 1000, total, totalRequests: files.length, before, all: files };
}

for (const [name, d] of Object.entries(devices)) {
  if (only && only !== name) continue;
  const all = []; for (let i = 0; i < runs; i++) all.push(await visit(d));
  const r = all[0], of = (k) => all.map((x) => x[k]);
  console.log(`${name.padEnd(6)} ${r.profile.padEnd(5)} ${r.files.padEnd(4)} files${net ? `, on ${net}` : ''}, downloaded ${(median(of('shown')) / 1e6).toFixed(2)} MB in ${median(of('requests'))} requests before the room shows, shown in ${median(of('shownAt')).toFixed(1)} s${spread(of('shownAt'))}, every model in at ${median(of('modelsAt')).toFixed(1)} s${spread(of('modelsAt'))}, ${(median(of('total')) / 1e6).toFixed(2)} MB in ${median(of('totalRequests'))} requests in all, drawn at ${r.w}×${r.h} (ratio ${r.ratio}), ${process.argv.includes('--load') ? 'frames not timed' : `a frame ${median(of('median')).toFixed(0)} ms`}`);
  if (process.argv.includes('--bytes')) for (const [b, u] of r.before.sort((a, z) => z[0] - a[0]).slice(0, 12)) console.log(`  ${(b / 1e3).toFixed(0).padStart(6)} kB  ${new URL(u).pathname}`);
  report[name] = { look: r.profile, files: r.files, net: net ?? 'local', bytesBefore: median(of('shown')), requestsBefore: median(of('requests')), shown: of('shownAt'), models: of('modelsAt'), paint: of('paint'), bytes: median(of('total')), requests: median(of('totalRequests')), frame: median(of('median')), before: r.before.map(([b, u]) => [b, new URL(u).pathname]), all: r.all.map(([b, u]) => [b, new URL(u).pathname]) };
}
if (arg('--json')) writeFileSync(arg('--json'), JSON.stringify(report, null, 1));
await browser.close();
await server?.close();
