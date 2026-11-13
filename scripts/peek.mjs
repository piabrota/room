// `just peek` runs this: one still of the room from anywhere, in a headless Chrome, for
// looking at a change while working on it (a model's scale, a texture, a shadow). It serves
// the source with Vite's dev server, so there is no build to wait for.
//
//   just peek --shot desk                         a named shot (config.shots)
//   just peek --from 0.6,1.1,-0.6 --to 0.6,0.85,-1.2 --fov 30   or any camera, in metres
//   just peek --shot overview --day --lite        by day, in the phone's look
//   just peek --shot desk --out /tmp/desk.jpg --size 1280x720 --hud --steps 60
//   just peek --shot desk --eval "window.__room.room.lamp.intensity = 0"
//   just peek --shot overview --calls             and what the room is made of, thing by thing
//   just peek --shot overview --lite --hud --phone --size 390x844   the HUD as a phone shows it
//   just peek --shot sea --still                  as a visitor who asked for reduced motion sees it
//   just peek --all --day --out /tmp/shots        every shot in one visit, into a folder (--shots desk,shelf for some)
//   just peek --shot sea --click balloon --at 0.1,0.35,0.5,1   a click on a thing, then a still at each time after it (seconds),
//                                                 as <out>-0.10.jpg …; with --from/--to, from that camera; the room steps 1/60 s
//   just peek --shot sea --click balloon --at 0.4,0.6,0.9 --strict   as a GPU that answers pow() of a negative number with
//                                                 "not a number" (Direct3D, Metal): the software renderer here forgives it, so a
//                                                 shader that is black on a visitor's screen looks right in a still. Every pow() of
//                                                 every shader is made strict, each frame is read back as numbers, and the run fails
//                                                 when a pixel is not a number
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
// --phone: a touch screen at a pixel ratio of 2, as a phone shows the HUD (with --size 390x844)
// --still: a visitor who asked for reduced motion (invariant 8)
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: flag('phone') ? 2 : 1, isMobile: flag('phone'), hasTouch: flag('phone'), reducedMotion: flag('still') ? 'reduce' : 'no-preference' });
page.setDefaultTimeout(180000);
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.route('**/live/**', (r) => r.fulfill({ status: 204 }));
// --strict: pow() of a negative base is undefined in GLSL. This renderer answers it kindly; Direct3D and Metal answer
// "not a number", and one such pixel blackens whatever the bloom and the occlusion spread it over. So every shader
// gets a pow() that fails the way theirs does (the square root of a negative number is not a number here either).
if (flag('strict')) await page.addInitScript(() => {
  const strict = `
float strictPow(float x, float y) { return x < 0.0 ? sqrt(x) : pow(x, y); }
vec2 strictPow(vec2 x, vec2 y) { return vec2(strictPow(x.x, y.x), strictPow(x.y, y.y)); }
vec3 strictPow(vec3 x, vec3 y) { return vec3(strictPow(x.x, y.x), strictPow(x.y, y.y), strictPow(x.z, y.z)); }
vec4 strictPow(vec4 x, vec4 y) { return vec4(strictPow(x.x, y.x), strictPow(x.y, y.y), strictPow(x.z, y.z), strictPow(x.w, y.w)); }
#define pow strictPow
`;
  const source = WebGL2RenderingContext.prototype.shaderSource;
  WebGL2RenderingContext.prototype.shaderSource = function (shader, code) {
    const lines = code.split('\n');
    let at = lines.findIndex((l) => /^\s*#version/.test(l)) + 1;                                   // after the version line,
    lines.forEach((l, i) => { if (i < 400 && /^\s*precision\s+\w+\s+\w+\s*;/.test(l)) at = i + 1; }); // and after the precisions
    lines.splice(at, 0, strict);
    return source.call(this, shader, lines.join('\n'));
  };
});
// `record` is the laptop's look without ambient occlusion, as `just record` films it; --ao keeps the occlusion a visitor sees
await page.goto(`${url}?hifi&${flag('day') ? 'day' : 'night'}&${flag('lite') ? 'lite' : flag('ao') ? 'full' : 'record'}`);
await page.waitForSelector('#loading.done');
await page.addStyleTag({ content: `#enter{display:none!important}${flag('hud') ? '' : '#hud,#view,#tooltip{display:none!important}'}` });

const look = (o) => page.evaluate(async ({ list, shot, from, to, fov, steps, code }) => {
  const r = window.__room;
  if (r.room.ready) await (r.room.settled ?? r.room.ready); // the models, when the room loads them after its first frame, and the chart's mesh
  r.rig.go(shot ?? Object.keys(r.rig.names)[0] ?? r.rig.names[0], true);
  for (let i = 0; i < steps; i++) r.step(1 / 30);
  if (code) { await (0, eval)(code); r.renderer.shadowMap.needsUpdate = true; r.step(1 / 30); }
  if (from) {
    r.camera.position.set(...from); r.camera.lookAt(...to);
    if (fov) { r.camera.fov = fov; r.camera.updateProjectionMatrix(); }
    r.camera.updateMatrixWorld();
    r.renderer.shadowMap.needsUpdate = true;
  }
  // count the frame: every pass together, and the room's own pass (the largest single render)
  const draw = r.renderer.render.bind(r.renderer); let room = 0;
  r.renderer.render = (...a) => { const before = r.renderer.info.render.calls; draw(...a); room = Math.max(room, r.renderer.info.render.calls - before); };
  r.renderer.info.autoReset = false; r.renderer.info.reset();
  if (from) r.post.render(0, 1, false); else r.step(1 / 30);
  r.renderer.render = draw; r.renderer.info.autoReset = true;
  const { calls, triangles } = r.renderer.info.render;
  // --calls: what the room is made of, by the named thing each mesh belongs to (visible meshes × their materials)
  const parts = {};
  if (list) r.room.root.traverse((o) => {
    if (!(o.isMesh || o.isPoints) || o.material?.visible === false) return;
    for (let p = o; p; p = p.parent) if (!p.visible) return;
    let top = o; while (top.parent && top.parent !== r.room.root) top = top.parent;
    const key = top.name || o.name || '(unnamed)', n = Array.isArray(o.material) ? new Set(o.material).size : 1;
    const e = parts[key] ??= { draws: 0, tris: 0 }; e.draws += n; e.tris += Math.round((o.geometry.index?.count ?? o.geometry.attributes.position.count) / 3);
  });
  return { calls, room, parts, triangles, textures: r.renderer.info.memory.textures, geometries: r.renderer.info.memory.geometries, quality: r.quality.name };
}, { list: flag('calls'), from: vec(opt('from')), to: vec(opt('to')), fov: Number(opt('fov', 0)), steps: Number(opt('steps', 20)), code: opt('eval'), ...o });
const shoot = async (file) => {
  await page.waitForTimeout(300);
  mkdirSync(dirname(file), { recursive: true });
  await page.screenshot({ path: file, type: file.endsWith('.png') ? 'png' : 'jpeg', ...(file.endsWith('.png') ? {} : { quality: 90 }) });
};
// --strict: the room's own pass, read back as numbers; a pixel that is not a number (or is infinite) is counted
let unreal = 0;
const numbers = async (label) => {
  if (!flag('strict')) return;
  const bad = await page.evaluate(() => {
    const r = window.__room, Target = r.post.composer.renderTarget1.constructor, size = r.renderer.getDrawingBufferSize(r.camera.position.clone()); // any vector with x and y
    const w = Math.round(size.x), h = Math.round(size.y), rt = new Target(w, h, { type: 1015 }), buf = new Float32Array(w * h * 4), was = r.renderer.getRenderTarget(); // 1015: FloatType
    r.renderer.setRenderTarget(rt); r.renderer.clear(); r.renderer.render(r.scene, r.camera); r.renderer.setRenderTarget(was);
    r.renderer.readRenderTargetPixels(rt, 0, 0, w, h, buf); rt.dispose();
    let n = 0; for (let i = 0; i < buf.length; i += 4) if (!Number.isFinite(buf[i]) || !Number.isFinite(buf[i + 1]) || !Number.isFinite(buf[i + 2])) n++;
    return n;
  });
  unreal += bad;
  console.log(`${bad ? '✗' : '✓'} ${label}: ${bad} pixels are not a number under a strict pow()`);
};
const say = (file, info) => console.log(`✓ ${file} (${W}×${H}, ${info.quality}): ${info.room} draw calls in the room's pass, ${info.calls} in all passes, ${info.triangles} triangles, ${info.textures} textures, ${info.geometries} geometries`);
let info;
if (opt('click')) { // a click on a named thing, then a still at each time after it, the room stepped by hand
  info = await look({ shot: opt('shot') });
  const cam = { from: vec(opt('from')), to: vec(opt('to')), fov: Number(opt('fov', 0)) };
  const found = await page.evaluate((n) => { const r = window.__room, o = r.room.find(n); if (!o) return false; r.ui.click(o, null); return true; }, opt('click'));
  if (!found) errors.push(`nothing in the room is named "${opt('click')}"`);
  let t = 0;
  for (const at of (opt('at', '0.5')).split(',').map(Number)) {
    const n = Math.max(0, Math.round((at - t) * 60)); t += n / 60;
    await page.evaluate(({ n, from, to, fov }) => {
      const r = window.__room, render = r.post.render;
      r.post.render = () => {};                       // only the last step of each wait is drawn
      for (let i = 0; i < n - 1; i++) r.step(1 / 60);
      r.post.render = render; if (n > 0) r.step(1 / 60);
      if (from) { r.camera.position.set(...from); r.camera.lookAt(...to); if (fov) { r.camera.fov = fov; r.camera.updateProjectionMatrix(); } r.camera.updateMatrixWorld(); r.post.render(0, 1, false); }
    }, { n, ...cam });
    const file = out.replace(/\.(jpg|png)$/, (m) => `-${at.toFixed(2)}${m}`);
    await shoot(file); console.log(`✓ ${file} (${at.toFixed(2)} s after the click)`);
    await numbers(`${at.toFixed(2)} s`);
  }
} else if (flag('all') || opt('shots')) { // every shot, or some, in one visit: --out is then a folder
  const names = opt('shots')?.split(',') ?? await page.evaluate(() => { const n = window.__room.rig.names; return Array.isArray(n) ? n : Object.keys(n); });
  for (const shot of names) { info = await look({ shot }); const file = join(out.replace(/\.(jpg|png)$/, ''), `${shot}.jpg`); await shoot(file); say(file, info); await numbers(shot); }
} else { info = await look({ shot: opt('shot') }); await shoot(out); say(out, info); await numbers(opt('shot') ?? 'the still'); }
await browser.close(); await server.close();
if (flag('calls')) for (const [k, v] of Object.entries(info.parts).sort((a, b) => b[1].draws - a[1].draws)) console.log(`  ${String(v.draws).padStart(3)} draws ${String(v.tris).padStart(7)} tris  ${k}`);
if (errors.length) { console.error('page errors:\n' + errors.join('\n')); process.exit(1); }
if (unreal) { console.error(`✗ ${unreal} pixels are not a number: a pow() takes a negative base (write a square as a product, clamp what goes into the others)`); process.exit(1); }
