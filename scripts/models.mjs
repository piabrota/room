// `just models` runs this: it fetches the room's furniture and props from Poly Haven (CC0,
// polyhaven.com), and writes each as one small file for the laptop's look and one smaller for
// the phone's, into public/models/:
//
//   <name>.glb        textures of 1024 px (WebP), the mesh as its author made it or thinned a
//                     little, compressed with meshopt
//   <name>.lite.glb   textures of 512 px (normal and roughness maps 256), the mesh thinned more
//
// and the rows of CREDITS.md that name each model's authors (between the two `models` marks).
// `src/config.js` (`models`) says which file stands where in the room; `src/furniture.js` loads
// them. The downloads are kept in node_modules/.models/, so a second run fetches nothing.
//
//   just models                 every model of the list below
//   just models television_02   only these (by Poly Haven id or by output name)
//   just models --list          the list, with what is on disk
//   just models --nodes fern_02 the nodes of a set and their sizes, to write a `pick`
//
// A model in the list: `id` (Poly Haven's), `name` (the file; the id when left out), `pick`
// (keep only the nodes whose name matches, for a set of several plants or cases), `thin` (a
// share of triangles for the nodes whose name matches, before the rest), `px` and
// `litePx` (texture sizes), `ratio` and `liteRatio` (the share of triangles kept), `error` (how
// far a thinned surface may move, as a share of the model's size).
import { mkdirSync, existsSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { NodeIO, Logger } from '@gltf-transform/core';
import { ALL_EXTENSIONS, EXTTextureWebP } from '@gltf-transform/extensions';
import { dedup, flatten, join as joinMeshes, weld, simplify, simplifyPrimitive, prune, meshopt, getBounds } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptSimplifier, MeshoptDecoder } from 'meshoptimizer';
import sharp from 'sharp';

const root = new URL('..', import.meta.url).pathname;
const out = join(root, 'public/models');
const cache = join(root, 'node_modules/.models');
const API = 'https://api.polyhaven.com';
const UA = { 'User-Agent': 'room-models' }; // Poly Haven asks every client for a name

export const { models: MODELS, textures: TEXTURES } = JSON.parse(readFileSync(new URL('./models.json', import.meta.url), 'utf8'));

async function get(url, file) {
  if (existsSync(file) && statSync(file).size > 0) return file;
  mkdirSync(dirname(file), { recursive: true });
  for (let i = 0; ; i++) {
    try {
      const r = await fetch(url, { headers: UA });
      if (!r.ok) throw new Error(`${r.status} ${url}`);
      writeFileSync(file, Buffer.from(await r.arrayBuffer()));
      return file;
    } catch (e) { if (i === 3) throw e; await new Promise((s) => setTimeout(s, 2000 * 2 ** i)); }
  }
}
const json = async (url, file) => JSON.parse(readFileSync(await get(url, file), 'utf8'));

// the glTF of a model at 1k or 2k, with its buffers and textures, as Poly Haven's API lists them
async function fetchModel(id, res) {
  const dir = join(cache, id);
  const files = await json(`${API}/files/${id}`, join(dir, 'files.json'));
  const info = await json(`${API}/info/${id}`, join(dir, 'info.json'));
  const g = files.gltf?.[res]?.gltf; if (!g) throw new Error(`${id}: no glTF at ${res}`);
  const main = await get(g.url, join(dir, res, basename(new URL(g.url).pathname)));
  await Promise.all(Object.entries(g.include ?? {}).map(([rel, f]) => get(f.url, join(dir, res, rel))));
  return { main, info };
}

async function shrink(texture, px, kind) {
  const img = sharp(texture.getImage());
  const meta = await img.metadata();
  const size = Math.min(px, Math.max(meta.width, meta.height));
  const quality = kind === 'normal' ? 88 : kind === 'color' ? 84 : 80;
  const buf = await img.resize(size, size, { fit: 'inside', kernel: 'lanczos3' }).webp({ quality, alphaQuality: 90, effort: 6, smartSubsample: kind !== 'normal' }).toBuffer();
  texture.setImage(buf).setMimeType('image/webp');
}

async function build(io, m, source, lite) {
  const doc = await io.read(source); doc.setLogger(new Logger(Logger.Verbosity.WARN));
  const scene = doc.getRoot().getDefaultScene() ?? doc.getRoot().listScenes()[0];
  if (m.pick) { // keep only the named nodes of a set
    const keep = new RegExp(m.pick);
    for (const node of doc.getRoot().listNodes()) {
      if (!node.getMesh()) continue;
      let named = false; for (let n = node; n && n.getName; n = n.getParentNode?.()) if (keep.test(n.getName())) named = true;
      if (!named) node.setMesh(null);
    }
  }
  for (const c of doc.getRoot().listCameras()) c.dispose();
  const ratio = lite ? (m.liteRatio ?? 0.5) : (m.ratio ?? 1);
  await doc.transform(dedup(), prune(), flatten(), weld());
  for (const [pattern, r] of Object.entries(m.thin ?? {})) { // a part with far more triangles than it shows (the soil of a pot)
    for (const node of doc.getRoot().listNodes()) if (node.getMesh() && new RegExp(pattern).test(node.getName())) {
      for (const prim of node.getMesh().listPrimitives()) simplifyPrimitive(prim, { simplifier: MeshoptSimplifier, ratio: r, error: 0.05 });
    }
  }
  await doc.transform(joinMeshes({ keepNamed: false }), weld());
  if (ratio < 1) await doc.transform(simplify({ simplifier: MeshoptSimplifier, ratio, error: m.error ?? (lite ? 0.004 : 0.0015), lockBorder: false }));
  await doc.transform(prune());

  const px = lite ? (m.litePx ?? 512) : (m.px ?? 1024);
  doc.createExtension(EXTTextureWebP).setRequired(true);
  const kinds = new Map();
  for (const mat of doc.getRoot().listMaterials()) {
    const set = (t, k) => { if (t && !(kinds.get(t) === 'color')) kinds.set(t, k); };
    set(mat.getBaseColorTexture(), 'color'); set(mat.getEmissiveTexture(), 'color');
    set(mat.getNormalTexture(), 'normal');
    set(mat.getMetallicRoughnessTexture(), 'data'); set(mat.getOcclusionTexture(), 'data');
  }
  for (const [t, kind] of kinds) await shrink(t, kind === 'color' ? px : (lite ? px / 2 : px), kind);

  await doc.transform(prune(), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
  const file = join(out, `${m.name ?? m.id}${lite ? '.lite' : ''}.glb`);
  await io.write(file, doc);
  const tris = doc.getRoot().listMeshes().flatMap((x) => x.listPrimitives()).reduce((s, p) => s + (p.getIndices()?.getCount() ?? p.getAttribute('POSITION').getCount()) / 3, 0);
  const b = getBounds(scene);
  return { file, bytes: statSync(file).size, tris: Math.round(tris), mats: doc.getRoot().listMaterials().length, prims: doc.getRoot().listMeshes().flatMap((x) => x.listPrimitives()).length, size: b.max.map((v, i) => +(v - b.min[i]).toFixed(3)) };
}

// A surface (the walls, the wood, the cloth): Poly Haven's colour, normal and roughness maps at
// 1k, as public/textures/pbr/<id>_{diff,nor,rough}.jpg, and the colour alone at 512 px for the
// phone (<id>_diff.lite.jpg). `maps` in models.json keeps only some of them. A file that is there is left as it is; `--force` writes it again.
async function fetchTexture(t, force) {
  const dir = join(cache, 'textures', t.id), dest = join(root, 'public/textures/pbr');
  const files = await json(`${API}/files/${t.id}`, join(dir, 'files.json'));
  await json(`${API}/info/${t.id}`, join(dir, 'info.json'));
  mkdirSync(dest, { recursive: true });
  let bytes = 0;
  const maps = t.maps ?? ['diff', 'nor', 'rough']; // a surface painted one colour needs no colour map
  for (const [key, as, px, q] of [['Diffuse', 'diff', 1024, 84], ['nor_gl', 'nor', 1024, 86], ['Rough', 'rough', 1024, 80], ['Diffuse', 'diff.lite', 512, 80]]) {
    if (!maps.includes(as.split('.')[0])) continue;
    const to = join(dest, `${t.id}_${as}.jpg`);
    if (existsSync(to) && !force) { bytes += statSync(to).size; continue; }
    const f = files[key]?.['1k']?.jpg ?? files[key]?.['1k']?.png; if (!f) throw new Error(`${t.id}: no ${key} at 1k`);
    const src = await get(f.url, join(dir, basename(new URL(f.url).pathname)));
    await sharp(src).resize(px, px, { fit: 'inside' }).jpeg({ quality: q, mozjpeg: true }).toFile(to);
    bytes += statSync(to).size;
  }
  return bytes;
}

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const wanted = MODELS.filter((m) => !args.length || args.includes(m.id) || args.includes(m.name));
if (process.argv.includes('--list')) {
  for (const m of MODELS) { const f = join(out, `${m.name ?? m.id}.glb`); console.log(`${(m.name ?? m.id).padEnd(26)} ${m.id.padEnd(30)} ${existsSync(f) ? (statSync(f).size / 1024).toFixed(0) + ' kB' : 'missing'}`); }
  process.exit(0);
}

await MeshoptEncoder.ready; await MeshoptSimplifier.ready; await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });
if (process.argv.includes('--nodes')) {
  for (const id of args) {
    const { main, info } = await fetchModel(id, '1k');
    const doc = await io.read(main);
    console.log(`${id}: ${info.polycount} polygons, by ${Object.keys(info.authors ?? {}).join(', ')}`);
    for (const node of doc.getRoot().listNodes()) {
      if (!node.getMesh()) continue;
      const b = getBounds(node), tris = node.getMesh().listPrimitives().reduce((s, p) => s + (p.getIndices()?.getCount() ?? 0) / 3, 0);
      console.log(`  ${node.getName().padEnd(40)} ${String(tris).padStart(6)} tris  x ${b.min[0].toFixed(2)}..${b.max[0].toFixed(2)}  y ${b.min[1].toFixed(2)}..${b.max[1].toFixed(2)}  z ${b.min[2].toFixed(2)}..${b.max[2].toFixed(2)}  ${node.getMesh().listPrimitives().map((p) => p.getMaterial()?.getName()).join(',')}`);
    }
  }
  process.exit(0);
}
mkdirSync(out, { recursive: true });
let total = 0, totalLite = 0;
const credits = new Map(); // Poly Haven id -> { name, authors, files }
for (const m of wanted) {
  const { main, info } = await fetchModel(m.id, m.res ?? '1k');
  const full = await build(io, m, main, false), lite = await build(io, m, main, true);
  total += full.bytes; totalLite += lite.bytes;
  console.log(`${(m.name ?? m.id).padEnd(26)} ${String(full.tris).padStart(6)} tris ${String(full.prims).padStart(2)} draws ${(full.bytes / 1024).toFixed(0).padStart(5)} kB | lite ${String(lite.tris).padStart(6)} tris ${(lite.bytes / 1024).toFixed(0).padStart(5)} kB | ${full.size.join(' × ')} m`);
}
console.log(`✓ ${wanted.length} models: ${(total / 1048576).toFixed(1)} MB for the laptop, ${(totalLite / 1048576).toFixed(1)} MB for the phone, in public/models/`);
let texBytes = 0;
for (const t of TEXTURES.filter((x) => !args.length || args.includes(x.id))) texBytes += await fetchTexture(t, process.argv.includes('--force'));
if (texBytes) console.log(`✓ ${TEXTURES.length} surfaces: ${(texBytes / 1048576).toFixed(1)} MB in public/textures/pbr/`);

// CREDITS.md: one row per Poly Haven model, between the marks, from the whole list
for (const m of MODELS) {
  const info = join(cache, m.id, 'info.json'); if (!existsSync(info)) continue;
  const i = JSON.parse(readFileSync(info, 'utf8'));
  const c = credits.get(m.id) ?? { name: i.name, authors: Object.keys(i.authors ?? {}), files: [] };
  c.files.push(m.name ?? m.id); credits.set(m.id, c);
}
const file = join(root, 'CREDITS.md'), text = readFileSync(file, 'utf8');
const START = '<!-- models:start (written by `just models`) -->', END = '<!-- models:end -->';
if (text.includes(START) && credits.size === new Set(MODELS.map((m) => m.id)).size) {
  const rows = [...credits].map(([id, c]) => `| ${c.files.map((f) => `\`public/models/${f}.glb\``).join(', ')} | ${c.authors.join(', ')} | "${c.name}" on [Poly Haven](https://polyhaven.com/a/${id}) | CC0 1.0 |`);
  const table = ['| File (and its `.lite.glb`) | Author | Source | Licence |', '|---|---|---|---|', ...rows].join('\n');
  writeFileSync(file, text.replace(new RegExp(`${START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${END}`), `${START}\n${table}\n${END}`));
  console.log(`✓ CREDITS.md: ${rows.length} rows`);
} else if (text.includes(START)) console.log('· CREDITS.md left as it is: run `just models` with no name to fetch every model first');
