// Nash, watched: stills of the cat taken every few frames by a camera that follows him, a contact
// sheet of them, a clip, and a check of where he has been. For working on src/cat.js and
// src/catbody.js, where one still of the room says nothing about a gait or a leap.
//
//   node scripts/catwatch.mjs --secs 12 --every 6 --out /tmp/cat          his life from the start, a still every 6 frames
//   node scripts/catwatch.mjs --act desk --secs 14 --out /tmp/cat          make him do a thing first: a perch's id, or sleep, nap,
//                                                                          wander, dash, groom, flank, stretch, sniff, sit, loaf, yawn, curl
//   node scripts/catwatch.mjs --act nap --warm 6 --secs 1 --close           a close look at his face (--close), after 6 s
//   node scripts/catwatch.mjs --click 3 …                                   a click on him 3 s in (he looks at the camera)
//   node scripts/catwatch.mjs --day --lite --still …                        by day, the phone's look, reduced motion
//   node scripts/catwatch.mjs --video /tmp/cat.mp4 --secs 20                a clip at 30 frames a second (ffmpeg)
//   node scripts/catwatch.mjs --check 600                                   ten minutes of his life, not drawn: what he did, his
//                                                                          leaps, and how often a part of him was inside something
//
// The room steps 1/30 s a frame from its own clock, so two runs film the same life.
import { join, resolve } from 'node:path';
import { existsSync, readdirSync, mkdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createServer } from 'vite';
import { chromium } from 'playwright-core';

const root = new URL('..', import.meta.url).pathname;
const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
const [W, H] = opt('size', '640x400').split('x').map(Number);
const out = resolve(opt('out', join(root, 'node_modules/.catwatch')));
const secs = Number(opt('secs', 10)), every = Number(opt('every', 6)), warm = Number(opt('warm', 0));
const dist = Number(opt('dist', flag('close') ? 0.42 : 1.5)), turn = Number(opt('turn', 0.9)), high = Number(opt('high', flag('close') ? 0.05 : 0.45));

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
const server = await createServer({ root, logLevel: 'error', server: { port: 0, host: '127.0.0.1', fs: { strict: false } } }); // not strict: node_modules may be a link out of a worktree
await server.listen();
const gpu = process.platform === 'darwin' || process.env.RECORD_GPU === '1';
const browser = await chromium.launch({ executablePath: chrome(), args: gpu ? (process.platform === 'darwin' ? ['--use-angle=metal'] : []) : ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: W, height: H }, reducedMotion: flag('still') ? 'reduce' : 'no-preference' });
page.setDefaultTimeout(600000);
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.route('**/live/**', (r) => r.fulfill({ status: 204 }));
await page.goto(`${server.resolvedUrls.local[0]}?hifi&${flag('day') ? 'day' : 'night'}&${flag('lite') ? 'lite' : 'record'}`);
await page.waitForSelector('#loading.done');
await page.addStyleTag({ content: '#enter,#hud,#view,#tooltip{display:none!important}' });
await page.evaluate(async () => { const r = window.__room; if (r.room.ready) await r.room.ready; r.step(1 / 30); });

// steps without drawing
const run = (n) => page.evaluate((n) => { const r = window.__room, render = r.post.render; r.post.render = () => {}; for (let i = 0; i < n; i++) r.step(1 / 30); r.post.render = render; }, n);
if (opt('seed')) await page.evaluate((n) => { const r = window.__room; for (let i = 0; i < n; i++) r.step(1 / 30); }, 0);
if (opt('skip')) await run(Math.round(Number(opt('skip')) * 30));
if (opt('act')) await page.evaluate((a) => window.__room.nash.act(a), opt('act'));
if (warm) await run(Math.round(warm * 30));

if (opt('eval')) console.log(JSON.stringify(await page.evaluate((code) => (0, eval)(code), opt('eval')), null, 1));
if (opt('poses')) { // one still of each thing he does, side by side
  mkdirSync(out, { recursive: true });
  const names = opt('poses').split(',');
  for (const [i, name] of names.entries()) {
    await page.evaluate((a) => window.__room.nash.act(a), name); await run(Math.round((warm || 3) * 30));
    await page.evaluate(({ dist, turn, high, close }) => {
      const r = window.__room, cat = r.nash; r.scene.updateMatrixWorld();
      const g = cat.group.position, e = cat.body.bones[5].matrixWorld.elements, a = cat.group.rotation.y + Math.PI + turn;
      const to = close ? [e[12], e[13] + 0.01, e[14]] : [g.x, g.y + 0.14, g.z];
      r.camera.position.set(to[0] + Math.sin(a) * dist, to[1] + high, to[2] + Math.cos(a) * dist); r.camera.lookAt(...to); r.camera.fov = 32; r.camera.updateProjectionMatrix(); r.camera.updateMatrixWorld();
      r.post.render(0, 1, false);
    }, { dist, turn, high, close: flag('close') });
    await page.screenshot({ path: join(out, `p${String(i).padStart(2, '0')}.jpg`), type: 'jpeg', quality: 88 });
  }
  const cols = Math.min(4, names.length), sheet = join(out, 'poses.jpg');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', '1', '-start_number', '0', '-i', join(out, 'p%02d.jpg'), '-vf', `scale=${Math.round(1920 / cols)}:-1,tile=${cols}x${Math.ceil(names.length / cols)}`, '-frames:v', '1', '-q:v', '3', sheet]);
  console.log(`✓ ${sheet}`);
} else if (opt('check')) {
  const res = await page.evaluate((secs) => {
    const r = window.__room, cat = r.nash, nav = cat.nav, render = r.post.render; r.post.render = () => {};
    const did = {}, jumps = [], inside = {}; let bad = 0, n = 0, far = 0, slide = 0, was = null, lastJump = null;
    const bones = cat.body.bones, p = { x: 0, y: 0, z: 0 };
    const at = (i) => { const e = bones[i].matrixWorld.elements; p.x = e[12]; p.y = e[13]; p.z = e[14]; return p; };
    for (let i = 0; i < secs * 30; i++) {
      r.step(1 / 30); r.scene.updateMatrixWorld();
      const s = cat.state, key = s.step === 'pose' ? `${s.pose}${s.anim ? ':' + s.anim : ''}` : s.step === 'jump' ? `jump:${s.phase}` : s.step;
      did[key] = (did[key] ?? 0) + 1 / 30;
      if (s.jump && s.jump !== lastJump && JSON.stringify(s.jump) !== JSON.stringify(lastJump)) { lastJump = s.jump; jumps.push({ t: +(i / 30).toFixed(1), v0: +s.jump.v0.toFixed(2), T: +s.jump.T.toFixed(2), rise: +s.jump.rise.toFixed(2), dy: +s.jump.dy.toFixed(2), far: +Math.hypot(s.jump.to[0] - s.jump.from[0], s.jump.to[2] - s.jump.from[2]).toFixed(2) }); }
      if (was) far = Math.max(far, Math.hypot(s.at[0] - was[0], s.at[1] - was[1], s.at[2] - was[2]));
      was = s.at;
      if (nav) { // the hips, the back, the chest and the head: is any of them inside a thing?
        n++; let hit = false;
        for (const b of [0, 2, 3, 5]) { const q = at(b); if (nav.solidAt(q.x, q.y + 0.02, q.z)) { hit = true; const k = `${key} @ ${s.here ?? 'floor'}`; inside[k] = (inside[k] ?? 0) + 1; break; } }
        if (hit) bad++;
      }
    }
    r.post.render = render;
    for (const k in did) did[k] = +did[k].toFixed(1);
    return { did, jumps, frames: n, inside: bad, where: inside, farthestStep: +far.toFixed(3), perches: cat.state.perches, triangles: cat.state.triangles };
  }, Number(opt('check')));
  console.log(JSON.stringify(res, null, 1));
} else {
  mkdirSync(out, { recursive: true });
  for (const f of readdirSync(out)) if (/^f\d+\.jpg$/.test(f)) rmSync(join(out, f));
  const video = opt('video'), frames = Math.round(secs * 30);
  let shot = 0;
  for (let i = 0; i < frames; i++) {
    const draw = video ? true : i % every === 0;
    const info = await page.evaluate(({ draw, dist, turn, high, close, fixed, click }) => {
      const r = window.__room, cat = r.nash, render = r.post.render;
      if (click) { r.camera.updateMatrixWorld(); r.ui.click(cat.group, null); }
      r.post.render = () => {}; r.step(1 / 30); r.post.render = render;
      if (!draw) return null;
      r.scene.updateMatrixWorld();
      const g = cat.group.position, e = cat.body.bones[5].matrixWorld.elements;
      const to = close ? [e[12], e[13] + 0.01, e[14]] : [g.x, g.y + 0.16, g.z];
      const a = close ? cat.group.rotation.y + Math.PI + turn : turn;
      const from = fixed ?? [to[0] + Math.sin(a) * dist, to[1] + high, to[2] + Math.cos(a) * dist];
      r.camera.position.set(...from); r.camera.lookAt(...to); r.camera.fov = close ? 30 : 32; r.camera.updateProjectionMatrix(); r.camera.updateMatrixWorld();
      r.post.render(0, 1, false);
      const calls = r.renderer.info.render.calls, s = cat.state;
      return `${s.step}${s.phase ? ':' + s.phase : ''} ${s.pose}${s.anim ? ':' + s.anim : ''} v=${s.speed} at ${s.at.join(',')}`;
    }, { draw, dist, turn, high, close: flag('close'), fixed: opt('from')?.split(',').map(Number), click: opt('click') && i === Math.round(Number(opt('click')) * 30) });
    if (!draw) continue;
    const file = join(out, `f${String(shot++).padStart(4, '0')}.jpg`);
    await page.screenshot({ path: file, type: 'jpeg', quality: 88 });
    if (!video || i % 15 === 0) console.log(`${(i / 30).toFixed(2)} s  ${info}`);
  }
  if (video) {
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', '30', '-i', join(out, 'f%04d.jpg'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '23', '-movflags', '+faststart', resolve(video)]);
    console.log(`✓ ${resolve(video)}`);
  } else if (shot > 1) {
    const cols = Number(opt('cols', Math.min(6, shot))), rows = Math.ceil(shot / cols), sheet = join(out, 'sheet.jpg');
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', '1', '-i', join(out, 'f%04d.jpg'), '-vf', `scale=${Math.round(1920 / cols)}:-1,tile=${cols}x${rows}`, '-frames:v', '1', '-q:v', '3', sheet]);
    console.log(`✓ ${sheet} (${shot} stills, ${cols}×${rows})`);
  } else console.log(`✓ ${join(out, 'f0000.jpg')}`);
}
await browser.close(); await server.close();
if (errors.length) { console.error('page errors:\n' + errors.join('\n')); process.exit(1); }
