// `just check` runs this after the build, and `just load-budget` by itself: what a visitor's
// browser must download before the room shows, counted from dist/ with no browser, against the
// limits of scripts/budget.json. A change that adds a font, a library or a picture to the room's
// start fails here, and the pull request then either moves it after the first frame or raises the
// limit and says why (the `room-load` skill).
//
// Counted, for a phone (the small files) and a laptop (the full ones), by night and by day:
//   code      the page, its style sheet, src/main.js and what it imports, and the room's own code
//             (the chunk of src/app.js and what it imports), as the host sends them (gzip)
//   fonts     the .woff2 files the page's head asks for
//   quick     the surfaces' small colours, the only pictures the room waits for (src/first.js)
//   pictures  every picture of the first frame: those, the surfaces' full maps on a laptop, the
//             view from the window and the portrait on the board
// `waits` is code + fonts + quick: what must arrive before the cover lifts. `total` is all of it,
// with the number of requests it makes. Also checked: the page's head asks for the room's code and
// fonts ahead (vite.config.js), nothing heavy is among them (MapLibre, a worker), and every file
// that shrinks has its .br and .gz copy beside it for the host to send.
//
//   node scripts/budget.mjs            check dist/
//   node scripts/budget.mjs --write    write today's numbers, with 8 % of room, into scripts/budget.json
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, extname } from 'node:path';

const root = new URL('..', import.meta.url).pathname, dist = join(root, 'dist');
const errors = [], fail = (m) => errors.push(m);
if (!existsSync(join(dist, 'index.html'))) { console.error('✗ no dist/: run `just build` first'); process.exit(1); }
const config = await import(join(root, 'src/config.js'));
const { firstFiles, quickFiles, surfaces, surfaceFiles } = await import(join(root, 'src/first.js'));
const limits = JSON.parse(readFileSync(new URL('./budget.json', import.meta.url), 'utf8'));

const html = readFileSync(join(dist, 'index.html'), 'utf8');
const size = (path, enc = '') => { const f = join(dist, path.split('?')[0]); return existsSync(f + enc) ? statSync(f + enc).size : existsSync(f) ? statSync(f).size : (fail(`${path} is asked for at the start and is not in dist/`), 0); };
const sent = (path) => size(path, '.gz'); // what the host sends today: the gzip copy when there is one

// the page's own tags, then the two lists its head script asks for: the room's chunks, the fonts
const entry = [...html.matchAll(/<script type="module"[^>]* src="([^"]+)"/g)].map((m) => m[1]);
const preloaded = [...html.matchAll(/<link rel="modulepreload"[^>]* href="([^"]+)"/g)].map((m) => m[1]);
const styles = [...html.matchAll(/<link rel="stylesheet"[^>]* href="([^"]+)"/g)].map((m) => m[1]);
const lists = [...html.matchAll(/(\["\/[^\]]*"\])\.forEach/g)].map((m) => JSON.parse(m[1]));
if (lists.length !== 2) fail('the page\'s head does not ask for the room\'s code and fonts ahead (vite.config.js, `firstLoad`)');
const [chunks = [], fonts = []] = lists;
if (!chunks.some((c) => /\/app-/.test(c))) fail('the chunk of src/app.js is not among the files the page\'s head asks for');
for (const c of [...entry, ...preloaded, ...chunks]) if (/maplibre|worker/i.test(c)) fail(`${c} loads before the room shows: it belongs to a click, not to the start`);
const js = [...new Set([...entry, ...preloaded, ...chunks])];

// a phone takes the small files, a laptop the full ones; the heavier of night and day counts
const report = {};
for (const [device, files] of [['phone', 'lite'], ['laptop', 'full']]) {
  const pics = (day) => [...new Set([...quickFiles(), ...firstFiles(config, { files }, day)])]; // the small colours come first on every device
  const pictures = Math.max(...[false, true].map((day) => pics(day).reduce((a, p) => a + size(p), 0)));
  const code = size('index.html', '.gz') + [...js, ...styles].reduce((a, p) => a + sent(p), 0);
  const fontBytes = fonts.reduce((a, p) => a + size(p), 0), quick = quickFiles().reduce((a, p) => a + size(p), 0);
  report[device] = { code, fonts: fontBytes, quick, waits: code + fontBytes + quick, pictures, total: code + fontBytes + pictures, requests: 2 + js.length + styles.length + fonts.length + pics(false).length }; // 2: the page and its icon
}
// the surfaces the first frame names are files, in both sizes
for (const name of Object.keys(surfaces)) for (const small of [false, true]) for (const f of Object.values(surfaceFiles(name, small))) if (!existsSync(join(root, 'public', f))) fail(`src/first.js names ${f}, which is not in public/ (just models)`);

// every file that shrinks has its compressed copies (vite.config.js, `precompress`)
const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]));
let copies = 0;
for (const f of walk(dist)) {
  if (!['.js', '.css', '.html'].includes(extname(f)) || statSync(f).size < 4096) continue;
  if (!existsSync(`${f}.br`) || !existsSync(`${f}.gz`)) fail(`${f.slice(dist.length)} has no .br and .gz copy: the build's precompress step did not run`); else copies++;
}

const kB = (n) => `${(n / 1e3).toFixed(0)} kB`;
if (process.argv.includes('--write')) {
  const room = (n) => Math.ceil(n * 1.08 / 1e4) * 1e4;
  const next = { ...limits };
  for (const [d, r] of Object.entries(report)) next[d] = { code: room(r.code), fonts: room(r.fonts), quick: room(r.quick), waits: room(r.waits), pictures: room(r.pictures), total: room(r.total), requests: r.requests + 2 };
  writeFileSync(new URL('./budget.json', import.meta.url), JSON.stringify(next, null, 2) + '\n');
  console.log('✓ scripts/budget.json written');
} else {
  for (const [d, r] of Object.entries(report)) {
    const max = limits[d] ?? {};
    for (const k of ['code', 'fonts', 'quick', 'waits', 'pictures', 'total', 'requests']) if (r[k] > (max[k] ?? 0)) fail(`${d}: ${k} before the room shows is ${k === 'requests' ? r[k] : kB(r[k])}, over the budget of ${k === 'requests' ? max[k] : kB(max[k] ?? 0)} (scripts/budget.json)`);
  }
}
for (const [d, r] of Object.entries(report)) console.log(`${d.padEnd(6)} the room waits for ${kB(r.waits)} (code ${kB(r.code)}, fonts ${kB(r.fonts)}, the small colours ${kB(r.quick)}); with every picture of its first frame ${kB(r.total)} in ${r.requests} requests; the budget is ${kB(limits[d]?.waits ?? 0)} and ${kB(limits[d]?.total ?? 0)} in ${limits[d]?.requests ?? 0}`);
if (errors.length) { console.error(errors.map((e) => `✗ load budget: ${e}`).join('\n')); process.exit(1); }
console.log(`✓ the load budget holds, and ${copies} files have their .br and .gz copies`);
