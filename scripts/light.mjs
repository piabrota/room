// `just light` runs this: it serves dist/ (the recipe builds first), opens
// the room in headless Chrome at 960×540, by night and by day, and for
// every shot measures what a visitor sees: the mean brightness of the
// frame (0 to 255) and the share of pixels burnt to white (above 245).
// It fails when a shot burns more than 1 % of its pixels, so a change of
// light, bloom or tone mapping that blows the room out to white is caught
// before the pull request (docs/SURVEY.md, section 7).
//
//   just light            every shot, night and day
//   just light day desk   one mode, some shots
//
// The frames are kept in node_modules/.light/ to look at.
import { mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { preview } from 'vite';
import { chromium } from 'playwright-core';

const root = new URL('..', import.meta.url).pathname;
const out = join(root, 'node_modules/.light');
const [modeArg, ...shotArgs] = process.argv.slice(2);
const modes = modeArg ? [modeArg] : ['night', 'day'];
const LIMIT = 1; // % of the frame burnt to white

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
// A real GPU when there is one (macOS); SwiftShader on a Linux box without one.
const gl = process.platform === 'darwin' ? ['--use-angle=metal'] : ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'];

mkdirSync(out, { recursive: true });
const server = await preview({ root, preview: { port: 4178, strictPort: false }, logLevel: 'warn' });
const url = server.resolvedUrls.local[0];
const browser = await chromium.launch({ executablePath: chrome(), args: gl });
const page = await browser.newPage({ viewport: { width: 960, height: 540 }, deviceScaleFactor: 1 });
page.setDefaultTimeout(180000);

const rows = []; let worst = 0;
for (const mode of modes) {
  await page.goto(`${url}?hifi&${mode}`);
  await page.waitForSelector('#loading.done', { timeout: 180000 });
  await page.evaluate(() => window.__room.room.settled ?? window.__room.room.ready); // the furniture that is files, all of it
  await page.addStyleTag({ content: '#enter{display:none!important}' });
  const shots = shotArgs.length ? shotArgs : await page.evaluate(() => window.__room.rig.names);
  for (const s of shots) {
    await page.evaluate((x) => { window.__room.rig.go(x, true); window.__room.step(1 / 30); window.__room.step(1 / 30); }, s);
    const png = await page.screenshot({ path: join(out, `${mode}-${s}.png`) });
    const { mean, burnt } = await page.evaluate(async (b64) => {
      const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      const x = c.getContext('2d'); x.drawImage(img, 0, 0);
      const d = x.getImageData(0, 0, c.width, c.height).data;
      let sum = 0, hot = 0;
      for (let i = 0; i < d.length; i += 4) { const l = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]; sum += l; if (l > 245) hot++; }
      return { mean: sum / (d.length / 4), burnt: (100 * hot) / (d.length / 4) };
    }, png.toString('base64'));
    worst = Math.max(worst, burnt);
    rows.push([mode, s, mean.toFixed(0), burnt.toFixed(1) + ' %', burnt > LIMIT ? '✗' : '']);
  }
}
await browser.close(); await server.close();

console.log(['mode', 'shot', 'mean', 'burnt', ''].join('\t'));
for (const r of rows) console.log(r.join('\t'));
console.log(`frames in ${out.slice(root.length)}/`);
if (worst > LIMIT) { console.error(`✗ a shot burns more than ${LIMIT} % of its pixels to white`); process.exit(1); }
console.log(`✓ just light: no shot burns more than ${LIMIT} %`);
