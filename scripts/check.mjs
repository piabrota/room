// `just check` runs this. It reads src/config.js and the files around
// it and fails on anything that breaks an invariant of AGENTS.md.
// Plain Node, no dependencies, so it runs before `npm ci` too.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const errors = [];
const fail = (invariant, msg) => errors.push(`invariant ${invariant}: ${msg}`);
const MB = 1024 * 1024;

const config = await import(join(root, 'src/config.js'));

// 3. config.js holds the signature.
const sig = config.signature;
if (!sig?.name || !sig?.tagline || !Array.isArray(sig.links)) fail(3, 'signature needs name, tagline and links');

// 4. Every shot is a named view with a position and a target.
const shots = Object.entries(config.shots ?? {});
if (shots.length === 0) fail(4, 'no camera shots');
if (shots.length > 10) fail(4, 'more than 10 shots: the keys 1..9 and 0 cannot reach them all');
for (const [name, s] of shots) {
  if (!(s.position?.length === 3 && s.target?.length === 3)) fail(4, `shot "${name}" needs position and target [x, y, z]`);
}
if (!config.shots?.[config.startShot]) fail(4, `startShot "${config.startShot}" is not a shot`);

// 5. Every hotspot has a label and a known action.
const actions = new Set(['shot', 'link', 'sfx', 'toggleLamp', 'toggleRadio', 'playlist', 'door']);
const names = new Set();
for (const h of config.hotspots ?? []) {
  if (names.has(h.name)) fail(5, `hotspot name "${h.name}" is used twice`);
  names.add(h.name);
  if (h.action === 'link' && !/^(https:\/\/|mailto:)/.test(h.value ?? '')) fail(5, `hotspot "${h.name}" links to "${h.value}": use https:// or mailto:`);
  if (!h.name || !h.label) fail(5, `hotspot ${JSON.stringify(h)} needs name and label`);
  if (!actions.has(h.action)) fail(5, `hotspot "${h.name}" has unknown action "${h.action}"`);
  if (h.action === 'shot' && !config.shots[h.value]) fail(5, `hotspot "${h.name}" points at missing shot "${h.value}"`);
  if (h.action === 'sfx' && !config.sfx[h.value]) fail(5, `hotspot "${h.name}" plays missing sfx "${h.value}"`);
}

// 6. Every tape is a module with the contract, and ids are unique.
const ids = new Set();
for (const t of config.tapes ?? []) {
  if (ids.has(t.id)) fail(6, `tape id "${t.id}" is used twice`);
  ids.add(t.id);
  if (!t.label || !/^#[0-9a-f]{6}$/i.test(t.color ?? '')) fail(6, `tape "${t.id}" needs a label and a #rrggbb color`);
  if (typeof t.text !== 'string' || !t.text.trim()) fail(8, `tape "${t.id}" needs a text line for the LOFI view`);
  if (typeof t.module !== 'function') { fail(6, `tape "${t.id}" needs module: () => import(...)`); continue; }
  const mod = (await t.module()).default;
  if (typeof mod?.mount !== 'function' || typeof mod?.frame !== 'function') fail(6, `tape "${t.id}" must export default { mount, frame, ... }`);
  for (const hook of ['input', 'stop']) {
    if (hook in (mod ?? {}) && typeof mod[hook] !== 'function') fail(6, `tape "${t.id}": ${hook} must be a function`);
  }
}

const radioTracks = (config.radio?.stations ?? []).flatMap((s) => s.tracks);
// 7. Every sound has a synthesized fallback.
const fallbacks = new Set(['rain', 'click', 'thunk', 'lofi']);
for (const s of [...(config.ambience ?? []), ...Object.values(config.sfx ?? {}), ...radioTracks]) {
  if (!fallbacks.has(s.fallback)) fail(7, `sound ${s.src} needs a fallback, one of ${[...fallbacks].join(', ')}`);
}

// 3. The posts of LOFI: each has a title, a date (YYYY-MM-DD) and a summary.
const { readPosts } = await import('./feed.mjs');
for (const p of readPosts()) {
  if (!p.title || !/^\d{4}-\d{2}-\d{2}$/.test(p.date ?? '') || !p.summary) fail(3, `posts/${p.file} needs front matter: title, date (YYYY-MM-DD) and summary`);
}

// 4. The ▲ grid map's views: the first is the whole domain (the visitor can always go back), the
// others lie inside it, and each has a unique id, a label (invariant 3: config) and a hint (5: hover).
if (config.grid) {
  const presets = config.grid.presets, [W, S, E, N] = config.grid.bbox, tol = 0.01;
  if (!Array.isArray(presets) || presets.length === 0) fail(3, 'config.grid.presets needs at least one view');
  else {
    if (presets[0].id !== 'brasil') fail(4, 'the first grid view must be "brasil", the whole domain');
    if (!config.grid.words?.presets) fail(3, 'config.grid.words.presets (the label of the views row) is missing');
    const seen = new Set();
    for (const p of presets) {
      if (!p.id || seen.has(p.id)) fail(3, `grid view "${p.id}" needs a unique id`);
      seen.add(p.id);
      if (!String(p.label ?? '').trim()) fail(3, `grid view "${p.id}" needs a label`);
      if (!String(p.hint ?? '').trim()) fail(5, `grid view "${p.id}" needs a hint for its hover`);
      const [[w, s], [e, n]] = p.bounds ?? [[], []];
      if (![w, s, e, n].every(Number.isFinite) || !(w < e && s < n)) fail(3, `grid view "${p.id}" needs bounds [[west, south], [east, north]] with west < east and south < north`);
      else if (w < W - tol || e > E + tol || s < S - tol || n > N + tol) fail(3, `grid view "${p.id}" lies outside config.grid.bbox`);
    }
  }
}

// 9. Budgets for what ships in public/.
const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
const budget = { '.glb': 10 * MB, '.gltf': 10 * MB, '.mp3': 4 * MB, '.ogg': 4 * MB, '.wav': 0, '.png': 2 * MB, '.jpg': 2 * MB, '.webp': 2 * MB, '.ktx2': 4 * MB };
let total = 0, radio = 0;
const radioDir = join(root, 'public', 'audio', 'radio');
for (const f of walk(join(root, 'public'))) {
  const size = statSync(f).size;
  if (f.startsWith(radioDir)) radio += size; else total += size; // the radio has its own budget
  const max = budget[extname(f).toLowerCase()];
  if (max === 0) fail(9, `${f.slice(root.length)}: ship .mp3 or .ogg, not .wav`);
  else if (max && size > max) fail(9, `${f.slice(root.length)} is ${(size / MB).toFixed(1)} MB, budget ${max / MB} MB`);
}
if (total > 25 * MB) fail(9, `public/ is ${(total / MB).toFixed(1)} MB without the radio, budget 25 MB`);
if (radio > 100 * MB) fail(9, `public/audio/radio/ is ${(radio / MB).toFixed(1)} MB, budget 100 MB`);

// 3. Config text is rendered as text: nothing in src/ uses innerHTML.
for (const f of walk(join(root, 'src'))) {
  if (/\.(inner|outer)HTML\b|insertAdjacentHTML/.test(readFileSync(f, 'utf8'))) fail(3, `${f.slice(root.length)} uses innerHTML; build DOM nodes with textContent`);
}

// 1. No hotlinked assets: the code loads only files that ship with the site.
for (const f of walk(join(root, 'src'))) {
  const text = readFileSync(f, 'utf8');
  for (const m of text.matchAll(/(?:loadAsync|fetch|import)\(\s*['"`](https?:)?\/\//g)) {
    fail(1, `${f.slice(root.length)} loads something from another host: ${m[0]}`);
  }
}

// 1. The one thing that loads from another host: Spotify's Embed player for config.playlist,
// made in src/player.js only, its artists credited (the owner, 9 November 2026).
if (config.playlist) {
  const p = config.playlist;
  if (!/^https:\/\/open\.spotify\.com\/embed\//.test(p.embed ?? '')) fail(1, `config.playlist.embed must be an open.spotify.com/embed/ address, not "${p.embed}"`);
  if (!p.artists?.length) fail(1, 'config.playlist names no artists: credit them beside the player');
  const credits = readFileSync(join(root, 'CREDITS.md'), 'utf8');
  if (!credits.includes(p.title)) fail(1, `CREDITS.md does not credit the playlist "${p.title}"`);
  for (const a of p.artists ?? []) if (!credits.includes(a)) fail(1, `CREDITS.md does not name ${a}, an artist of the playlist`);
}
for (const f of walk(join(root, 'src'))) {
  if (/createElement\(\s*['"]iframe/.test(readFileSync(f, 'utf8')) && !f.endsWith('/player.js')) fail(1, `${f.slice(root.length)} makes an iframe: only src/player.js may, for the playlist`);
}
if (config.hotspots.some((h) => h.action === 'playlist') && !config.playlist?.embed) fail(5, 'a hotspot opens the playlist, but config.playlist has no embed');
// the door's lock: a code of digits, one clue for each
if (config.hotspots.some((h) => h.action === 'door')) {
  const l = config.door?.lock;
  if (!l || !/^\d{1,8}$/.test(l.code ?? '')) fail(5, 'the door hotspot needs config.door.lock.code, digits only');
  else if (l.clues?.length !== l.code.length) fail(5, `config.door.lock has ${l.clues?.length ?? 0} clues for a code of ${l.code.length} digits`);
}

for (const src of [config.roomModel, config.outside?.night?.photo, config.outside?.day?.photo, ...(config.ambience ?? []).map((a) => a.src), ...Object.values(config.sfx ?? {}).map((s) => s.src), ...radioTracks.map((t) => t.src)].filter(Boolean)) {
  if (!String(src).startsWith('/')) fail(1, `${src}: assets load from public/, as /path`);
}

// 1. Every third-party asset in public/ is listed in CREDITS.md.
const credits = existsSync(join(root, 'CREDITS.md')) ? readFileSync(join(root, 'CREDITS.md'), 'utf8') : '';
if (!credits) fail(1, 'CREDITS.md is missing');
for (const t of radioTracks) {
  if (!credits.includes(`\`public${t.src}\``)) fail(1, `radio track ${t.src} has no row in CREDITS.md`);
}
for (const ph of [config.outside?.night?.photo, config.outside?.day?.photo].filter(Boolean)) {
  if (!credits.includes(`\`public${ph}\``)) fail(1, `${ph} has no row in CREDITS.md`);
}

// 2. The idea is credited by name, with no link to the original's site, code or issues.
const readme = readFileSync(join(root, 'README.md'), 'utf8');
if (!readme.includes('Felix Rieseberg')) fail(2, 'README.md must credit Felix Rieseberg by name');
for (const f of ['README.md', 'AGENTS.md', 'CREDITS.md', ...walk(join(root, 'src')).map((p) => p.slice(root.length))]) {
  const p = join(root, f);
  if (existsSync(p) && /rieseberg\.com|github\.com\/felixrieseberg/i.test(readFileSync(p, 'utf8'))) fail(2, `${f} links to the original; credit by name only`);
}

// AGENTS.md keeps exactly ten invariants.
const agents = readFileSync(join(root, 'AGENTS.md'), 'utf8');
const count = (agents.split('## Invariants')[1]?.split('\n## ')[0].match(/^\d+\. \*\*/gm) ?? []).length;
if (count !== 10) errors.push(`AGENTS.md lists ${count} invariants, not 10`);

if (errors.length) {
  console.error(errors.map((e) => `✗ ${e}`).join('\n'));
  process.exit(1);
}
console.log(`✓ config, tapes, sounds, budgets and credits keep the invariants (${ids.size} tapes, ${shots.length} shots)`);
