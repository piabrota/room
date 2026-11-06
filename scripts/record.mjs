// `just record` runs this: it builds nothing itself (the recipe builds
// first), serves dist/, opens the room in a headless Chrome and makes
// the pictures every pull request carries (AGENTS.md, "Working here"):
//
//   docs/record/shot-<name>.jpg  one still per camera shot
//   docs/record/room.mp4         15 s of navigating and clicking
//
// `--stills` makes only the stills and keeps the video that is there.
//
// The room is driven by hand, one fixed step of 1/30 s per frame
// (window.__room.step), so the video shows the motion as a visitor sees
// it at 30 fps, however slow the machine that records it.
//
// Chrome: $CHROME if set, else Google Chrome on macOS, else Playwright's
// Chromium. ffmpeg encodes the video.
import { mkdirSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { preview } from 'vite';
import { chromium } from 'playwright-core';

const root = new URL('..', import.meta.url).pathname;
const out = join(root, 'docs/record');
const frames = join(root, 'node_modules/.record');
const FPS = 30, W = 1280, H = 720;

function chrome() {
  if (process.env.CHROME) return process.env.CHROME;
  const mac = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  if (existsSync(mac)) return mac;
  for (const d of existsSync('/opt/pw-browsers') ? readdirSync('/opt/pw-browsers') : []) {
    const p = `/opt/pw-browsers/${d}/chrome-linux64/chrome`;
    if (existsSync(p)) return p;
  }
  return undefined; // Playwright's own: npx playwright-core install chromium
}

const server = await preview({ root, preview: { port: 4177, strictPort: false }, logLevel: 'warn' });
const url = server.resolvedUrls.local[0];
const browser = await chromium.launch({
  executablePath: chrome(),
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'],
});
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
page.setDefaultTimeout(120000);
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

await page.goto(`${url}?hifi`);
await page.waitForSelector('#loading.done', { timeout: 120000 });
await page.click('#enter button');
await page.addStyleTag({ content: '#enter{display:none!important}' }); // skip its fade
rmSync(frames, { recursive: true, force: true }); mkdirSync(frames, { recursive: true });
const stillsOnly = process.argv.includes('--stills');
for (const f of existsSync(out) ? readdirSync(out) : []) if (f.startsWith('shot-')) rmSync(join(out, f));
mkdirSync(out, { recursive: true });

let n = 0, mx = W / 2, my = H / 2;
async function step(count = 1) {
  for (let i = 0; i < count; i++) {
    await page.evaluate(() => window.__room.step(1 / 30));
    await page.screenshot({ path: join(frames, `f${String(n++).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 90 });
  }
}
const ease = (t) => t * t * (3 - 2 * t);
async function moveTo(x, y, seconds = 0.6) {
  const fx = mx, fy = my, k = Math.max(1, Math.round(seconds * FPS));
  for (let i = 1; i <= k; i++) {
    const t = ease(i / k); mx = fx + (x - fx) * t; my = fy + (y - fy) * t;
    await page.mouse.move(mx, my); await page.evaluate(([a, b]) => window.__rec(a, b), [mx, my]);
    await step();
  }
}
async function click() {
  await page.evaluate(([a, b]) => window.__rec(a, b, true), [mx, my]);
  await page.mouse.down(); await page.mouse.up();
  await step(3);
  await page.evaluate(([a, b]) => window.__rec(a, b, false), [mx, my]);
}
// a drag across the room: the 360° look
async function drag(dx, seconds) {
  await page.evaluate(([a, b]) => window.__rec(a, b, true), [mx, my]);
  await page.mouse.down();
  await moveTo(mx + dx, my, seconds);
  await page.mouse.up(); await page.evaluate(([a, b]) => window.__rec(a, b, false), [mx, my]);
  await step(4);
}
const wait = (s) => step(Math.round(s * FPS));
const land = async () => { for (let i = 0; i < 75 && await page.evaluate(() => window.__room.rig.moving); i++) await step(); };
// the screen position of a mesh, or of a shot button
const at = (name, dy = 0) => page.evaluate(([n, d]) => {
  const o = window.__room.room.find(n); const v = o.getWorldPosition(window.__room.camera.position.clone());
  v.y += d; v.project(window.__room.camera);
  return [(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight];
}, [name, dy]);
const button = async (shot) => {
  const b = await page.locator(`#shots button[data-shot="${shot}"]`).boundingBox();
  return [b.x + b.width / 2, b.y + b.height / 2];
};
const still = async (name) => (await page.waitForTimeout(400), page.screenshot({ path: join(out, `shot-${name}.jpg`), type: 'jpeg', quality: 88 }));

// ── the stills: one per shot, before the video ──
const shots = await page.evaluate(() => window.__room.rig.names);
for (const s of shots) { await page.evaluate((x) => { window.__room.rig.go(x, true); window.__room.step(1 / 30); }, s); await still(s); }
await page.evaluate((x) => { window.__room.rig.go(x, true); window.__room.step(1 / 30); }, shots[0]);

if (stillsOnly) { await browser.close(); await server.close(); console.log(`✓ ${shots.length} stills in docs/record/`); process.exit(errors.length ? 1 : 0); }

// a drawn cursor, since a headless screenshot has none
await page.addStyleTag({ content: '#rec-cursor{position:fixed;left:0;top:0;width:22px;height:22px;pointer-events:none;z-index:99;transform:translate(-3px,-2px)}#rec-cursor.down{scale:.85}' });
await page.evaluate(() => {
  const c = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  c.id = 'rec-cursor'; c.setAttribute('viewBox', '0 0 22 22');
  const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  p.setAttribute('d', 'M3 2 L3 18 L7.5 14 L10.5 20.5 L13 19.4 L10 13 L16 13 Z');
  p.setAttribute('fill', '#fff'); p.setAttribute('stroke', '#000'); p.setAttribute('stroke-width', '1.2');
  c.append(p); document.body.append(c);
  window.__rec = (x, y, down) => { c.style.left = x + 'px'; c.style.top = y + 'px'; c.classList.toggle('down', !!down); };
});

// ── the video: 15 s ──
await moveTo(...(await at('sign')), 0.8); await wait(0.6);                      // hover the sign
await moveTo(...(await button('fabric')), 0.6); await click(); await land();    // a shot button
await moveTo(...(await at('frame_pirsig')), 0.7); await wait(0.6);              // hover a project
await page.keyboard.press('4'); await land();                                   // key 4: the shelf
await moveTo(...(await at('book_closed-source')), 0.6); await wait(0.5);        // hover a book
await moveTo(...(await button('desk')), 0.5); await click(); await land();
await moveTo(...(await at('tape_bots')), 0.5); await click(); await wait(1.6);  // a tape into the VCR
await moveTo(...(await at('lamp', 0.4)), 0.5); await click(); await wait(0.4); await click(); // the lamp, off and on
const r = await page.locator('#radio').boundingBox();
await moveTo(r.x + r.width / 2, r.y + r.height / 2, 0.5); await click(); await wait(0.3); // piabrota RADIO on
await page.keyboard.press('7'); await land();                                   // key 7: the marola-dev sea
await moveTo(...(await at('buoy_marola')), 0.5); await wait(0.4);              // hover a buoy
await drag(-380, 1.4);                                                          // drag: look around, 360°
await page.keyboard.press('9'); await land();                                   // key 9: the ouroboric-dev loop
await page.keyboard.press('Escape'); await land();                              // Esc: back to the start
await wait(Math.max(0.5, (15 * FPS - n) / FPS));

execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-framerate', String(FPS), '-i', join(frames, 'f%04d.jpg'),
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '26', '-preset', 'slow', '-movflags', '+faststart', join(out, 'room.mp4')]);
rmSync(frames, { recursive: true, force: true });
await browser.close(); await server.close();

if (errors.length) { console.error('page errors:\n' + errors.join('\n')); process.exit(1); }
console.log(`✓ ${shots.length} stills and ${(n / FPS).toFixed(1)} s of video in docs/record/`);
