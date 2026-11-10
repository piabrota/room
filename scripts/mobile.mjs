// `just mobile` runs this: it opens the built room as a phone would (390×844 CSS pixels, a
// pixel ratio of 3, touch, Chrome's CPU slowed 4×) and as a laptop would (1280×720, ratio 2),
// and prints for each what the visitor pays: the bytes downloaded before the room shows, the
// time until it shows, the size of the picture drawn (the drawing buffer), and the time one
// frame of the room takes, the GPU's work included (a pixel is read back after each frame).
//
// In this container Chrome draws in software (SwiftShader), so the times are not a phone's; they
// compare one build with another, on the same machine. `--url <address>` measures a running site.
import { existsSync, readdirSync } from 'node:fs';
import { preview } from 'vite';
import { chromium } from 'playwright-core';

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
const server = arg('--url') ? null : await preview({ root, preview: { port: 4178, strictPort: false }, logLevel: 'warn' });
const url = arg('--url') ?? server.resolvedUrls.local[0];
const gpu = process.platform === 'darwin';
const browser = await chromium.launch({ executablePath: chrome(), args: gpu ? [] : ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });

const devices = {
  phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, cpu: 4 },
  laptop: { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2, isMobile: false, hasTouch: false, cpu: 1 },
};
const only = arg('--device');
const query = arg('--query') ?? '';
for (const [name, d] of Object.entries(devices)) {
  if (only && only !== name) continue;
  const { cpu, ...ctxOpts } = d;
  const ctx = await browser.newContext(ctxOpts);
  const page = await ctx.newPage();
  page.setDefaultTimeout(180000);
  let bytes = 0; const urls = new Map(), files = [];
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable');
  cdp.on('Network.requestWillBeSent', (e) => urls.set(e.requestId, e.request.url));
  cdp.on('Network.loadingFinished', (e) => { bytes += e.encodedDataLength; files.push([e.encodedDataLength, urls.get(e.requestId)]); });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
  // when #loading gets `done`, for a build older than the `room:shown` mark
  await page.addInitScript(() => new MutationObserver((_, obs) => {
    if (document.getElementById('loading')?.classList.contains('done')) { window.__shownAt = performance.now(); obs.disconnect(); }
  }).observe(document, { subtree: true, attributes: true, attributeFilter: ['class'] }));
  const t0 = Date.now();
  await page.goto(`${url}?hifi&night${query}`);
  await page.waitForSelector('#loading.done');
  const ready = (Date.now() - t0) / 1000;
  // the bytes of every file that had arrived when the room showed (performance.mark in src/app.js)
  const before = await page.evaluate(() => {
    const at = performance.getEntriesByName('room:shown')[0]?.startTime ?? window.__shownAt ?? Infinity;
    return performance.getEntriesByType('resource').filter((e) => e.responseEnd <= at).map((e) => [e.transferSize || e.encodedBodySize, e.name]);
  });
  const shown = before.reduce((a, [b]) => a + b, 0) + (files.find(([, u]) => u === page.url())?.[0] ?? 0);
  await page.waitForTimeout(500);
  const r = await page.evaluate(async () => {
    const { renderer, step, post } = window.__room;
    const gl = renderer.getContext(), px = new Uint8Array(4);
    const one = () => { const t = performance.now(); step(1 / 30); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); return performance.now() - t; };
    for (let i = 0; i < 5; i++) one(); // warm up
    const ts = []; for (let i = 0; i < 20; i++) ts.push(one());
    ts.sort((a, b) => a - b);
    return { w: gl.drawingBufferWidth, h: gl.drawingBufferHeight, ratio: renderer.getPixelRatio(), median: ts[10], profile: post.profile ?? 'full', files: window.__room.quality.files ?? window.__room.quality.name };
  });
  console.log(`${name.padEnd(6)} ${r.profile.padEnd(5)} ${r.files.padEnd(4)} files, downloaded ${(shown / 1e6).toFixed(2)} MB, shown in ${ready.toFixed(1)} s, drawn at ${r.w}×${r.h} (ratio ${r.ratio}), a frame ${r.median.toFixed(0)} ms`);
  if (process.argv.includes('--bytes')) for (const [b, u] of before.sort((a, z) => z[0] - a[0]).slice(0, 12)) console.log(`  ${(b / 1e3).toFixed(0).padStart(6)} kB  ${new URL(u).pathname}`);
  await ctx.close();
}
await browser.close();
await server?.close();
