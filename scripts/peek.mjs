// `just peek` runs this: one still of the room from anywhere, in a headless Chrome, for
// looking at a change while working on it (a model's scale, a texture, a shadow). It serves
// the source with Vite's dev server, so there is no build to wait for.
//
//   just peek --shot desk                         a named shot (config.shots)
//   just peek --from 0.6,1.1,-0.6 --to 0.6,0.85,-1.2 --fov 30   or any camera, in metres
//   just peek --shot overview --day --lite        by day, in the phone's look
//   just peek --shot desk --out /tmp/desk.jpg --size 1280x720 --hud --steps 60
//   just peek --shot desk --eval "window.__room.room.lamp.intensity = 0"
//
// It prints the draw calls and the triangles of the frame, so a heavy prop shows at once.
import { join, resolve } from 'node:path';
import { existsSync, readdirSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { createServer } from 'vite';
import { chromium } from 'playwright-core';

const root = new URL('..', import.meta.url).pathname;
const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
const vec = (s) => s?.split(',').map(Number);
const [W, H] = opt('size', '1280x720').split('x').map(Number);
const out = resolve(opt('out', join(root, 'node_modules/.peek.jpg')));

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

const server = await createServer({ root, logLevel: 'error', server: { port: 0, host: '127.0.0.1' } });
await server.listen();
const url = server.resolvedUrls.local[0];
const gpu = process.platform === 'darwin' || process.env.RECORD_GPU === '1';
const browser = await chromium.launch({
  executablePath: chrome(),
  args: gpu ? (process.platform === 'darwin' ? ['--use-angle=metal'] : []) : ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
page.setDefaultTimeout(180000);
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.route('**/live/**', (r) => r.fulfill({ status: 204 }));
await page.goto(`${url}?hifi&${flag('day') ? 'day' : 'night'}&${flag('lite') ? 'lite' : 'record'}${flag('ao') ? '&full' : ''}`);
await page.waitForSelector('#loading.done');
await page.addStyleTag({ content: `#enter{display:none!important}${flag('hud') ? '' : '#hud,#view,#tooltip{display:none!important}'}` });

const info = await page.evaluate(async ({ shot, from, to, fov, steps, code }) => {
  const r = window.__room;
  if (r.room.ready) await r.room.ready; // the models, when the room loads them after its first frame
  r.rig.go(shot ?? Object.keys(r.rig.names)[0] ?? r.rig.names[0], true);
  for (let i = 0; i < steps; i++) r.step(1 / 30);
  if (code) { await (0, eval)(code); r.renderer.shadowMap.needsUpdate = true; r.step(1 / 30); }
  if (from) {
    r.camera.position.set(...from); r.camera.lookAt(...to);
    if (fov) { r.camera.fov = fov; r.camera.updateProjectionMatrix(); }
    r.camera.updateMatrixWorld();
    r.renderer.shadowMap.needsUpdate = true;
    r.renderer.info.autoReset = false; r.renderer.info.reset();
    r.post.render(0, 1, false);
  } else {
    r.renderer.info.autoReset = false; r.renderer.info.reset();
    r.step(1 / 30);
  }
  const { calls, triangles } = r.renderer.info.render;
  return { calls, triangles, textures: r.renderer.info.memory.textures, geometries: r.renderer.info.memory.geometries, quality: r.quality.name };
}, { shot: opt('shot'), from: vec(opt('from')), to: vec(opt('to')), fov: Number(opt('fov', 0)), steps: Number(opt('steps', 20)), code: opt('eval') });
await page.waitForTimeout(300);
mkdirSync(dirname(out), { recursive: true });
await page.screenshot({ path: out, type: out.endsWith('.png') ? 'png' : 'jpeg', ...(out.endsWith('.png') ? {} : { quality: 90 }) });
await browser.close(); await server.close();
console.log(`✓ ${out} (${W}×${H}, ${info.quality}): ${info.calls} draw calls in all passes, ${info.triangles} triangles, ${info.textures} textures, ${info.geometries} geometries`);
if (errors.length) { console.error('page errors:\n' + errors.join('\n')); process.exit(1); }
