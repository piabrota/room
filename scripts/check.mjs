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
if (shots.length > 9) fail(4, 'more than 9 shots: number keys 1..9 cannot reach them all');
for (const [name, s] of shots) {
  if (!(s.position?.length === 3 && s.target?.length === 3)) fail(4, `shot "${name}" needs position and target [x, y, z]`);
}
if (!config.shots?.[config.startShot]) fail(4, `startShot "${config.startShot}" is not a shot`);

// 5. Every hotspot has a label and a known action.
const actions = new Set(['shot', 'link', 'sfx', 'toggleLamp']);
for (const h of config.hotspots ?? []) {
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

// 7. Every sound has a synthesized fallback.
const fallbacks = new Set(['rain', 'hum', 'click', 'thunk']);
for (const s of [...(config.ambience ?? []), ...Object.values(config.sfx ?? {})]) {
  if (!fallbacks.has(s.fallback)) fail(7, `sound ${s.src} needs a fallback, one of ${[...fallbacks].join(', ')}`);
}

// 9. Budgets for what ships in public/.
const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
const budget = { '.glb': 10 * MB, '.gltf': 10 * MB, '.mp3': 4 * MB, '.ogg': 4 * MB, '.wav': 0, '.png': 2 * MB, '.jpg': 2 * MB, '.webp': 2 * MB, '.ktx2': 4 * MB };
let total = 0;
for (const f of walk(join(root, 'public'))) {
  const size = statSync(f).size; total += size;
  const max = budget[extname(f).toLowerCase()];
  if (max === 0) fail(9, `${f.slice(root.length)}: ship .mp3 or .ogg, not .wav`);
  else if (max && size > max) fail(9, `${f.slice(root.length)} is ${(size / MB).toFixed(1)} MB, budget ${max / MB} MB`);
}
if (total > 25 * MB) fail(9, `public/ is ${(total / MB).toFixed(1)} MB, budget 25 MB`);

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

for (const src of [config.roomModel, ...(config.ambience ?? []).map((a) => a.src), ...Object.values(config.sfx ?? {}).map((s) => s.src)]) {
  if (!String(src).startsWith('/')) fail(1, `${src}: assets load from public/, as /path`);
}

// 1. Every third-party asset in public/ is listed in CREDITS.md.
const credits = existsSync(join(root, 'CREDITS.md')) ? readFileSync(join(root, 'CREDITS.md'), 'utf8') : '';
if (!credits) fail(1, 'CREDITS.md is missing');

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
