// `just mobile` runs this: it opens the built room as a phone would (390×844 CSS pixels, a
// pixel ratio of 3, touch, Chrome's CPU slowed 4×) and as a laptop would (1280×720, ratio 2),
// and prints for each what the visitor pays: the bytes and the requests before the room shows,
// the time until it shows and until its first frame is drawn, the time until every model has
// arrived, everything transferred by then, the size of the picture drawn (the drawing buffer), and the time one frame of the room
// takes, the GPU's work included (a pixel is read back after each frame).
//
//   just mobile --device phone --bytes     the 12 biggest files before the room shows
//   just mobile --runs 3                   each device three times: the median, and the spread
//   just mobile --net 4g                   on a 4G line (9 Mbit/s down, 60 ms); `slow4g`: 1.6 Mbit/s, 150 ms
//   just mobile --load                     only the load: no frame is timed (much faster in software)
//   just mobile --dist /tmp/before         another build's folder
//   just mobile --json out.json            the numbers, for a table
//   just mobile --load --budget            fails when more was downloaded before the room showed than scripts/budget.json allows
//   just mobile --url https://room.piabrota.art/   a running site
//
// The build is served here as the host serves it (scripts/serve.mjs): a `.br` or `.gz` file that
// lies beside a file is sent in its place, text is gzipped otherwise, on HTTP/1.1.
//
// In this container Chrome draws in software (SwiftShader), so the times are not a phone's; they
// compare one build with another, on the same machine. Trust the bytes, the requests and their order.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
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
  cdp.on('Network.loadingFinished', (e) => { const u = urls.get(e.requestId); if (/^https?:/.test(u ?? '')) files.push([e.encodedDataLength, u]); }); // not the blob: pictures inside a model
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
  // when #loading gets `done`, for a build older than the `room:shown` mark
  await page.addInitScript(() => new MutationObserver((_, obs) => {
    if (document.getElementById('loading')?.classList.contains('done')) { window.__shownAt = performance.now(); obs.disconnect(); }
  }).observe(document, { subtree: true, attributes: true, attributeFilter: ['class'] }));
  // when the room is really on the screen: the third frame the browser asks for after the room says it shows
  // has at least one whole frame of the room behind it (a build that compiles its shaders in that frame stalls there)
  await page.addInitScript(() => addEventListener('room:shown', () => {
    let n = 0; const tick = () => { if (++n === 3) window.__drawnAt = performance.now(); else requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }, { once: true }));
  // The processor's seconds the browser spends (the page's process and the GPU's, which here is the software
  // renderer): unlike the clock, they do not grow when another job shares the machine.
  const sys = await browser.newBrowserCDPSession();
  const cpuNow = async () => (await sys.send('SystemInfo.getProcessInfo')).processInfo.filter((p) => p.type === 'renderer' || p.type === 'GPU').reduce((a, p) => a + p.cpuTime, 0);
  const cpu0 = await cpuNow();
  await page.goto(`${url}?hifi&night${query}`);
  await page.waitForSelector('#loading.done');
  // every file that had arrived when the room showed (performance.mark in src/app.js), and when it showed
  // and when the last of the files the room waits for had arrived: its code, its fonts and the pictures of its
  // first frame. On a slow line this says more than the time it shows, which here is mostly software drawing.
  const { before, shownAt, filesAt, codeAt } = await page.evaluate(() => {
    const at = performance.getEntriesByName('room:shown')[0]?.startTime ?? window.__shownAt ?? Infinity;
    const all = performance.getEntriesByType('resource').filter((e) => /^https?:/.test(e.name)), path = (e) => new URL(e.name).pathname;
    const last = (re) => Math.max(0, ...all.filter((e) => re.test(path(e)) && !/maplibre|worker/.test(path(e))).map((e) => e.responseEnd));
    return { shownAt: at, codeAt: last(/^\/assets\/.*\.(js|css|woff2)$/), filesAt: Math.max(last(/^\/assets\/.*\.(js|css|woff2)$/), last(/^\/textures\//)),
      before: all.filter((e) => e.responseEnd <= at).map((e) => [e.transferSize || e.encodedBodySize, e.name]) };
  });
  const html = files.find(([, u]) => u === page.url())?.[0] ?? 0;
  const shown = before.reduce((a, [b]) => a + b, 0) + html;
  const drawnAt = await page.waitForFunction(() => window.__drawnAt).then((h) => h.jsonValue());
  const cpuDrawn = await cpuNow() - cpu0;
  // every model in its place (room.ready), then a moment for what follows it
  const modelsAt = await page.evaluate(async () => { await window.__room.room.ready; return performance.now(); });
  const cpuModels = await cpuNow() - cpu0; await sys.detach();
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
  return { ...r, shown, requests: before.length + 1, shownAt: shownAt / 1000, codeAt: codeAt / 1000, filesAt: filesAt / 1000, drawnAt: drawnAt / 1000, modelsAt: modelsAt / 1000, cpuDrawn, cpuModels, total, totalRequests: files.length, before, all: files };
}

for (const [name, d] of Object.entries(devices)) {
  if (only && only !== name) continue;
  const all = []; for (let i = 0; i < runs; i++) all.push(await visit(d));
  const r = all[0], of = (k) => all.map((x) => x[k]);
  console.log(`${name.padEnd(6)} ${r.profile.padEnd(5)} ${r.files.padEnd(4)} files${net ? `, on ${net}` : ''}, downloaded ${(median(of('shown')) / 1e6).toFixed(2)} MB in ${median(of('requests'))} requests before the room shows, its code and fonts in at ${median(of('codeAt')).toFixed(1)} s${spread(of('codeAt'))} and its first pictures at ${median(of('filesAt')).toFixed(1)} s${spread(of('filesAt'))}, shown in ${median(of('shownAt')).toFixed(1)} s${spread(of('shownAt'))}, its first frame drawn at ${median(of('drawnAt')).toFixed(1)} s${spread(of('drawnAt'))} after ${median(of('cpuDrawn')).toFixed(1)} s of processor${spread(of('cpuDrawn'))}, every model in at ${median(of('modelsAt')).toFixed(1)} s${spread(of('modelsAt'))} after ${median(of('cpuModels')).toFixed(1)} s of processor${spread(of('cpuModels'))}, ${(median(of('total')) / 1e6).toFixed(2)} MB in ${median(of('totalRequests'))} requests in all, drawn at ${r.w}×${r.h} (ratio ${r.ratio}), ${process.argv.includes('--load') ? 'frames not timed' : `a frame ${median(of('median')).toFixed(0)} ms`}`);
  if (process.argv.includes('--bytes')) for (const [b, u] of r.before.sort((a, z) => z[0] - a[0]).slice(0, 12)) console.log(`  ${(b / 1e3).toFixed(0).padStart(6)} kB  ${new URL(u).pathname}`);
  report[name] = { look: r.profile, files: r.files, net: net ?? 'local', bytesBefore: median(of('shown')), requestsBefore: median(of('requests')), code: of('codeAt'), pictures: of('filesAt'), shown: of('shownAt'), drawn: of('drawnAt'), models: of('modelsAt'), cpuDrawn: of('cpuDrawn'), cpuModels: of('cpuModels'), paint: of('paint'), bytes: median(of('total')), requests: median(of('totalRequests')), frame: median(of('median')), before: r.before.map(([b, u]) => [b, new URL(u).pathname]), all: r.all.map(([b, u]) => [b, new URL(u).pathname]) };
}
if (arg('--json')) writeFileSync(arg('--json'), JSON.stringify(report, null, 1));
// --budget: what was measured, against the limits `just check` counts from the files (scripts/budget.json)
let over = 0;
if (process.argv.includes('--budget')) {
  const limits = JSON.parse(readFileSync(new URL('./budget.json', import.meta.url), 'utf8'));
  for (const [name, r] of Object.entries(report)) {
    const max = limits[name]; if (!max) continue;
    const bad = [r.bytesBefore > max.total && `${(r.bytesBefore / 1e3).toFixed(0)} kB before the room shows, over ${(max.total / 1e3).toFixed(0)} kB`, r.requestsBefore > max.requests && `${r.requestsBefore} requests before the room shows, over ${max.requests}`].filter(Boolean);
    for (const b of bad) console.error(`✗ ${name}: ${b} (scripts/budget.json)`);
    over += bad.length;
  }
  if (!over) console.log('✓ what was downloaded before the room showed is within scripts/budget.json');
}
await browser.close();
await server?.close();
if (over) process.exit(1);
