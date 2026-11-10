// `just fish` runs this: the fish of the aquarium on the marola wall. It fetches the Barramundi
// fish of the Khronos glTF sample assets (Microsoft, 2017, CC0 1.0), pinned to a commit, and
// writes it the way `just models` writes the furniture, into public/models/:
//
//   fish.glb        colour and normal maps of 512 px (WebP), the mesh as it is, meshopt
//   fish.lite.glb   the colour alone at 256 px, the mesh thinned to half
//
// The download is kept in node_modules/.models/, so a second run fetches nothing. The row of
// CREDITS.md is written by hand (the fish is not Poly Haven's).
import { mkdirSync, existsSync, writeFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { NodeIO, Logger } from '@gltf-transform/core';
import { ALL_EXTENSIONS, EXTTextureWebP } from '@gltf-transform/extensions';
import { dedup, prune, weld, simplify, meshopt } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptSimplifier, MeshoptDecoder } from 'meshoptimizer';
import sharp from 'sharp';

const root = new URL('..', import.meta.url).pathname;
const COMMIT = '8f492390ddc7a2ae221a1369ef560589cf8c70fb';
const URL_ = `https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/${COMMIT}/Models/BarramundiFish/glTF-Binary/BarramundiFish.glb`;
const src = join(root, 'node_modules/.models/barramundi', `${COMMIT}.glb`);

if (!existsSync(src) || !statSync(src).size) {
  mkdirSync(dirname(src), { recursive: true });
  const r = await fetch(URL_); if (!r.ok) throw new Error(`${r.status} ${URL_}`);
  writeFileSync(src, Buffer.from(await r.arrayBuffer()));
}

await MeshoptEncoder.ready; await MeshoptSimplifier.ready; await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });

for (const lite of [false, true]) {
  const doc = await io.read(src); doc.setLogger(new Logger(Logger.Verbosity.WARN));
  const px = lite ? 256 : 512;
  for (const mat of doc.getRoot().listMaterials()) {
    // the fish has no metal and its own light is the room's: the colour, and the normals on the laptop
    mat.setMetallicRoughnessTexture(null).setOcclusionTexture(null).setMetallicFactor(0).setRoughnessFactor(0.45);
    if (lite) mat.setNormalTexture(null);
  }
  await doc.transform(dedup(), prune(), weld());
  if (lite) await doc.transform(simplify({ simplifier: MeshoptSimplifier, ratio: 0.5, error: 0.004 }));
  doc.createExtension(EXTTextureWebP).setRequired(true);
  for (const mat of doc.getRoot().listMaterials()) {
    for (const [t, kind] of [[mat.getBaseColorTexture(), 'color'], [mat.getNormalTexture(), 'normal']]) {
      if (!t) continue;
      const buf = await sharp(t.getImage()).resize(px, px, { fit: 'inside', kernel: 'lanczos3' }).webp({ quality: kind === 'normal' ? 88 : 84, effort: 6, smartSubsample: kind !== 'normal' }).toBuffer();
      t.setImage(buf).setMimeType('image/webp');
    }
  }
  await doc.transform(prune(), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
  const file = join(root, 'public/models', `fish${lite ? '.lite' : ''}.glb`);
  await io.write(file, doc);
  console.log(`✓ ${file.slice(root.length)} ${(statSync(file).size / 1024).toFixed(0)} kB`);
}
