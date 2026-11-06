// `just grid` runs this: it makes the files of the ▲ grid view in
// public/grid/ from `config.grid` (docs/SURVEY.md, section 6):
//
//   land.json   the land of Natural Earth (public domain), clipped to the domain
//   mesh.bin    the triangle mesh of the coast: nodes (Float32 lon, lat), then
//               triangles (Uint16 node indices, three each)
//   frames.bin  per hour, per node: Hs (Uint8, 5 cm steps), the wind's speed
//               (Uint8, 0.1 m/s steps) and the direction it comes from (Uint8, 360/256°)
//   sst.bin     the sea's surface temperature at each node (Uint16, 0.01 °C steps,
//               65535 where there is none), one day of Copernicus Marine's OSTIA
//   run.json    the counts, the hours, the scales, the sources
//
// The mesh: nodes on the coastline every `spacing[0]` km, then ocean nodes in
// bands, closer near the coast and wider out to `reach` km, joined by a
// Delaunay triangulation; triangles over land or wider than their band are
// dropped. Triangle grids for WAVEWATCH III are Dr. Aron Roland's work.
//
// The wind: NOAA's GFS at 10 m, hourly for 24 h, through Open-Meteo's API
// (CC BY 4.0) on a 1° lattice, interpolated to the nodes. The sea is
// estimated from it: Hs = 0.21 U² / g, a fully developed sea (Pierson and
// Moskowitz, 1964). It is not a WAVEWATCH III run; that is the next step
// (.claude/skills/ww3-grid). `--offline` reuses the winds already fetched.
//
// The temperature: OSTIA, the Met Office's daily foundation SST at 0.05°
// (Copernicus Marine, SST_GLO_SST_L4_NRT_OBSERVATIONS_010_001, DOI
// 10.48670/moi-00165), its latest day, read from the service's public ARCO
// zarr store: one chunk of 1024 × 1024 cells covers the domain. It needs no
// account today. If the store ever asks for one, the view still opens, without
// the temperature, and the script says so (see `sstFail` below).
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import Delaunator from 'delaunator';
import { blosc } from './blosc.mjs';
import { grid } from '../src/config.js';

const root = new URL('..', import.meta.url).pathname;
const cache = join(root, 'node_modules/.grid'), out = join(root, 'public/grid');
mkdirSync(cache, { recursive: true }); mkdirSync(out, { recursive: true });
const offline = process.argv.includes('--offline');
const [W, S, E, N] = grid.bbox, REACH = grid.reach, [S0, S1] = grid.spacing;
const KM = 111.2; // km in a degree of latitude

async function cached(name, url, parse = (t) => JSON.parse(t)) {
  const f = join(cache, name);
  if (!existsSync(f)) {
    if (offline) throw new Error(`${name} is not cached; run without --offline`);
    const r = await fetch(url); if (!r.ok) throw new Error(`${url}: ${r.status}`);
    writeFileSync(f, await r.text());
  }
  return parse(readFileSync(f, 'utf8'));
}

// ── land: Natural Earth 1:50m ──
const ne = await cached('ne_50m_land.geojson', 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_land.geojson');
const rings = [];
for (const f of ne.features) {
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  for (const p of polys) for (const r of p) if (r.some(([x, y]) => x > W - 15 && x < E + 15 && y > S - 15 && y < N + 15)) rings.push(r);
}
// Sutherland–Hodgman against the domain (15° wider), for the map's land fill
function clip(ring, [w, s, e, n]) {
  let pts = ring;
  for (const [inside, cut] of [
    [(p) => p[0] >= w, (a, b) => [w, a[1] + (b[1] - a[1]) * (w - a[0]) / (b[0] - a[0])]],
    [(p) => p[0] <= e, (a, b) => [e, a[1] + (b[1] - a[1]) * (e - a[0]) / (b[0] - a[0])]],
    [(p) => p[1] >= s, (a, b) => [a[0] + (b[0] - a[0]) * (s - a[1]) / (b[1] - a[1]), s]],
    [(p) => p[1] <= n, (a, b) => [a[0] + (b[0] - a[0]) * (n - a[1]) / (b[1] - a[1]), n]],
  ]) {
    const next = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      if (inside(b)) { if (!inside(a)) next.push(cut(a, b)); next.push(b); } else if (inside(a)) next.push(cut(a, b));
    }
    pts = next; if (!pts.length) break;
  }
  return pts;
}
const view = [W - 15, S - 15, E + 15, N + 15];
const land = rings.map((r) => clip(r, view)).filter((r) => r.length > 3);
const r3 = (v) => Math.round(v * 1000) / 1000;
writeFileSync(join(out, 'land.json'), JSON.stringify({ type: 'FeatureCollection', features: land.map((r) => ({ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[...r.map(([x, y]) => [r3(x), r3(y)]), [r3(r[0][0]), r3(r[0][1])]]] } })) }));

const ringBoxes = land.map((r) => r.reduce((b, [x, y]) => [Math.min(b[0], x), Math.min(b[1], y), Math.max(b[2], x), Math.max(b[3], y)], [180, 90, -180, -90]));
function onLand(x, y) {
  let inside = false;
  for (let k = 0; k < land.length; k++) {
    const b = ringBoxes[k]; if (x < b[0] || x > b[2] || y < b[1] || y > b[3]) continue;
    const r = land[k];
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      if ((r[i][1] > y) !== (r[j][1] > y) && x < (r[j][0] - r[i][0]) * (y - r[i][1]) / (r[j][1] - r[i][1]) + r[i][0]) inside = !inside;
    }
  }
  return inside;
}

// ── the coast: the real edges of the land rings inside the domain, in buckets of 1° ──
const segs = [], buckets = new Map();
const key = (x, y) => `${Math.floor(x)},${Math.floor(y)}`;
for (const r of rings) for (let i = 0; i < r.length - 1; i++) {
  const a = r[i], b = r[i + 1];
  if (Math.max(a[0], b[0]) < W || Math.min(a[0], b[0]) > E || Math.max(a[1], b[1]) < S || Math.min(a[1], b[1]) > N) continue;
  const k = key((a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
  if (!buckets.has(k)) buckets.set(k, []);
  buckets.get(k).push(segs.length); segs.push([a, b]);
}
// distance in km from a point to the nearest coast, searched outward bucket by bucket
function coastKm(x, y) {
  const c = Math.cos(y * Math.PI / 180) * KM;
  let best = Infinity;
  for (let ring = 0; ring <= Math.ceil(REACH / KM) + 2; ring++) {
    if (best < (ring - 1) * KM * Math.min(1, c / KM)) break;
    for (let i = -ring; i <= ring; i++) for (let j = -ring; j <= ring; j++) {
      if (Math.max(Math.abs(i), Math.abs(j)) !== ring) continue;
      for (const s of buckets.get(key(x + i, y + j)) ?? []) {
        const [a, b] = segs[s];
        const ax = (a[0] - x) * c, ay = (a[1] - y) * KM, bx = (b[0] - x) * c, by = (b[1] - y) * KM;
        const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy;
        const t = L ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / L)) : 0;
        best = Math.min(best, Math.hypot(ax + t * dx, ay + t * dy));
      }
    }
  }
  return best;
}
const spacingAt = (d) => S0 + (S1 - S0) * Math.min(1, Math.max(0, d) / REACH) ** 1.4;

// ── the nodes ──
const nodes = [];
// on the coast, every S0 km
for (const [a, b] of segs) {
  const c = Math.cos(a[1] * Math.PI / 180) * KM, len = Math.hypot((b[0] - a[0]) * c, (b[1] - a[1]) * KM);
  for (let t = 0; t < len; t += S0) {
    const x = a[0] + (b[0] - a[0]) * t / len, y = a[1] + (b[1] - a[1]) * t / len;
    if (x >= W && x <= E && y >= S && y <= N) nodes.push([x, y]);
  }
}
// thin the coast: drop a coast node closer than S0 * 0.7 to the one before
const coast = []; for (const p of nodes) { const q = coast[coast.length - 1]; if (!q || Math.hypot((p[0] - q[0]) * KM * Math.cos(p[1] * Math.PI / 180), (p[1] - q[1]) * KM) > S0 * 0.7) coast.push(p); }
nodes.length = 0; nodes.push(...coast);
// at sea, a hexagonal lattice per band; a band keeps the points whose spacing it owns
const bands = [[0.5 * S0, 40], [40, 130], [130, 300], [300, REACH]];
for (const [d0, d1] of bands) {
  const h = spacingAt((d0 + d1) / 2), dy = h * 0.866 / KM;
  for (let y = S, row = 0; y <= N; y += dy, row++) {
    const dx = h / (KM * Math.cos(y * Math.PI / 180));
    for (let x = W + (row % 2) * dx / 2; x <= E; x += dx) {
      const d = coastKm(x, y);
      if (d < d0 || d >= d1 || onLand(x, y)) continue;
      nodes.push([x, y]);
    }
  }
}
if (nodes.length > 65535) throw new Error(`${nodes.length} nodes: Uint16 indices cannot hold them; widen spacing`);

// ── the triangles ──
const proj = nodes.flatMap(([x, y]) => [x * Math.cos(y * Math.PI / 180), y]); // near-equal-area enough for Delaunay
const del = new Delaunator(proj);
const tris = [];
for (let t = 0; t < del.triangles.length; t += 3) {
  const [i, j, k] = [del.triangles[t], del.triangles[t + 1], del.triangles[t + 2]];
  const cx = (nodes[i][0] + nodes[j][0] + nodes[k][0]) / 3, cy = (nodes[i][1] + nodes[j][1] + nodes[k][1]) / 3;
  const c = Math.cos(cy * Math.PI / 180) * KM;
  const edge = (a, b) => Math.hypot((nodes[a][0] - nodes[b][0]) * c, (nodes[a][1] - nodes[b][1]) * KM);
  const longest = Math.max(edge(i, j), edge(j, k), edge(k, i));
  if (onLand(cx, cy)) continue;
  if (longest > 2.6 * spacingAt(coastKm(cx, cy)) + 4) continue;
  tris.push(i, j, k);
}
// keep only the nodes that some triangle uses, renumbered
const used = new Int32Array(nodes.length).fill(-1), keep = [];
for (const i of tris) if (used[i] < 0) { used[i] = keep.length; keep.push(nodes[i]); }
const tri = tris.map((i) => used[i]);
console.log(`mesh: ${keep.length} nodes, ${tri.length / 3} triangles`);

// ── the wind: GFS through Open-Meteo, on a 1° lattice ──
const lattice = [];
for (let y = Math.floor(S); y <= Math.ceil(N); y++) for (let x = Math.floor(W); x <= Math.ceil(E); x++) {
  if (coastKm(x, y) <= REACH + 160) lattice.push([x, y]);
}
const HOURS = 25;
const winds = await cached(`winds-${lattice.length}.json`, null, (t) => JSON.parse(t)).catch(async (e) => {
  if (offline) throw e;
  const all = [];
  for (let i = 0; i < lattice.length; i += 100) {
    const part = lattice.slice(i, i + 100);
    const url = `https://api.open-meteo.com/v1/gfs?models=gfs_global&latitude=${part.map((p) => p[1]).join(',')}&longitude=${part.map((p) => p[0]).join(',')}&hourly=wind_speed_10m,wind_direction_10m&forecast_hours=${HOURS}&wind_speed_unit=ms&timezone=GMT`;
    let r = await fetch(url);
    // the free API counts each point as a call, 600 a minute: wait and go on
    for (let tries = 0; r.status === 429 && tries < 5; tries++) { process.stdout.write('wind: waiting a minute for the API\r'); await new Promise((ok) => setTimeout(ok, 61000)); r = await fetch(url); }
    if (!r.ok) throw new Error(`open-meteo: ${r.status} ${await r.text()}`);
    const j = await r.json(); all.push(...(Array.isArray(j) ? j : [j]));
    process.stdout.write(`wind: ${all.length}/${lattice.length}\r`);
  }
  const data = { fetched: new Date().toISOString(), times: all[0].hourly.time, points: all.map((p, k) => ({ x: lattice[k][0], y: lattice[k][1], s: p.hourly.wind_speed_10m, d: p.hourly.wind_direction_10m })) };
  writeFileSync(join(cache, `winds-${lattice.length}.json`), JSON.stringify(data));
  return data;
});
console.log(`wind: ${winds.points.length} points of GFS, ${winds.times[0]} to ${winds.times.at(-1)} UTC`);
const at = new Map(winds.points.map((p) => [`${p.x},${p.y}`, p]));
// u, v (the direction the wind blows towards) at a lattice point and hour
function uv(p, h) {
  const s = p.s[h], d = p.d[h]; if (s == null || d == null) return null;
  const r = d * Math.PI / 180; return [-s * Math.sin(r), -s * Math.cos(r)];
}
const F = Math.min(HOURS, winds.times.length), n = keep.length;
const frames = new Uint8Array(F * n * 3);
for (let h = 0; h < F; h++) {
  for (let i = 0; i < n; i++) {
    const [x, y] = keep[i], x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
    let u = 0, v = 0, wsum = 0;
    for (const [cx, cy, w] of [[x0, y0, (1 - fx) * (1 - fy)], [x0 + 1, y0, fx * (1 - fy)], [x0, y0 + 1, (1 - fx) * fy], [x0 + 1, y0 + 1, fx * fy]]) {
      const p = at.get(`${cx},${cy}`); const q = p && uv(p, h); if (!q) continue;
      u += q[0] * w; v += q[1] * w; wsum += w;
    }
    if (wsum > 0) { u /= wsum; v /= wsum; }
    const speed = Math.hypot(u, v), from = (Math.atan2(-u, -v) * 180 / Math.PI + 360) % 360;
    const hs = 0.21 * speed * speed / 9.81; // a fully developed sea, Pierson–Moskowitz
    const o = h * n * 3 + i; // per hour: every node's Hs, then every speed, then every direction
    frames[o] = Math.min(255, Math.round(hs / 0.05));
    frames[o + n] = Math.min(255, Math.round(speed / 0.1));
    frames[o + 2 * n] = Math.round(from / 360 * 256) % 256;
  }
}

// ── the sea's temperature: OSTIA, from Copernicus Marine ──
const OSTIA = 'https://s3.waw3-1.cloudferro.com/mdl-arco-time-045/arco/SST_GLO_SST_L4_NRT_OBSERVATIONS_010_001/METOFFICE-GLO-SST-L4-NRT-OBS-SST-V2/timeChunked.zarr';
async function bytes(name, url) {
  const f = join(cache, name);
  if (!existsSync(f)) {
    if (offline) throw new Error(`${name} is not cached; run without --offline`);
    const r = await fetch(url); if (!r.ok) throw new Error(`${url}: ${r.status}`);
    writeFileSync(f, Buffer.from(await r.arrayBuffer()));
  }
  return readFileSync(f);
}
let sstInfo = null;
const sst = new Uint16Array(n).fill(65535);
try {
  // the latest day: the metadata are fetched again on every run that is not --offline
  const metaFile = join(cache, 'ostia-zmetadata.json');
  if (!offline || !existsSync(metaFile)) { const r = await fetch(`${OSTIA}/.zmetadata`); if (!r.ok) throw new Error(`.zmetadata: ${r.status}`); writeFileSync(metaFile, await r.text()); }
  const meta = JSON.parse(readFileSync(metaFile, 'utf8')).metadata, arr = meta['analysed_sst/.zarray'], attrs = meta['analysed_sst/.zattrs'];
  if (arr.compressor?.id !== 'blosc' || arr.dtype !== '<i2') throw new Error(`unexpected chunk format ${arr.dtype} ${arr.compressor?.id}`);
  const [T, NY, NX] = arr.shape, [, CY, CX] = arr.chunks, day = T - 1;
  const f32 = (b) => new Float32Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
  const lat = f32(blosc(await bytes('ostia-lat', `${OSTIA}/latitude/0`))), lon = f32(blosc(await bytes('ostia-lon', `${OSTIA}/longitude/0`)));
  const tc = meta['time/.zarray'].chunks[0], times = new Int32Array(blosc(await bytes(`ostia-time-${Math.floor(day / tc)}-${T}`, `${OSTIA}/time/${Math.floor(day / tc)}`)).buffer);
  const date = new Date((Date.UTC(1981, 0, 1) / 1000 + times[day % tc]) * 1000).toISOString().slice(0, 10);
  const dy = lat[1] - lat[0], dx = lon[1] - lon[0];
  const row = (y) => (y - lat[0]) / dy, col = (x) => (x - lon[0]) / dx;
  const chunks = new Map();
  for (let cy = Math.floor(row(S - 1) / CY); cy <= Math.floor(row(N + 1) / CY); cy++) for (let cx = Math.floor(col(W - 1) / CX); cx <= Math.floor(col(E + 1) / CX); cx++) {
    const b = blosc(await bytes(`ostia-${date}-${cy}.${cx}`, `${OSTIA}/analysed_sst/${day}.${cy}.${cx}`));
    chunks.set(`${cy},${cx}`, new Int16Array(b.buffer));
  }
  const cell = (r, c) => { const ch = chunks.get(`${Math.floor(r / CY)},${Math.floor(c / CX)}`); const v = ch ? ch[(r % CY) * CX + (c % CX)] : arr.fill_value; return v === arr.fill_value ? null : v; };
  const kelvin = attrs.add_offset - 273.15, sf = attrs.scale_factor;
  let filled = 0, near = 0;
  for (let i = 0; i < n; i++) {
    const [x, y] = keep[i], r0 = row(y), c0 = col(x), r = Math.floor(r0), c = Math.floor(c0), fr = r0 - r, fc = c0 - c;
    let v = 0, w = 0;
    for (const [rr, cc, ww] of [[r, c, (1 - fr) * (1 - fc)], [r + 1, c, fr * (1 - fc)], [r, c + 1, (1 - fr) * fc], [r + 1, c + 1, fr * fc]]) {
      const q = cell(rr, cc); if (q != null) { v += q * ww; w += ww; }
    }
    // a node on the coast can fall in a cell that OSTIA counts as land: take the nearest sea cell, up to 0.3° away
    if (w === 0) for (let k = 1; k <= 6 && w === 0; k++) for (let a = -k; a <= k && w === 0; a++) for (const b of [-k, k]) {
      const q = cell(Math.round(r0) + a, Math.round(c0) + b) ?? cell(Math.round(r0) + b, Math.round(c0) + a); if (q != null) { v = q; w = 1; near++; break; }
    }
    if (w > 0) { sst[i] = Math.max(0, Math.min(65534, Math.round(((v / w) * sf + kelvin) * 100))); filled++; }
  }
  sstInfo = { date, scale: 0.01, missing: 65535, dataset: 'METOFFICE-GLO-SST-L4-NRT-OBS-SST-V2', product: 'SST_GLO_SST_L4_NRT_OBSERVATIONS_010_001', doi: '10.48670/moi-00165' };
  let lo = Infinity, hi = -Infinity; for (const t of sst) if (t !== 65535) { lo = Math.min(lo, t / 100); hi = Math.max(hi, t / 100); }
  console.log(`sst: OSTIA ${date}, ${chunks.size} chunk(s), ${filled}/${n} nodes (${near} from a nearby cell), ${lo.toFixed(1)} to ${hi.toFixed(1)} °C`);
} catch (e) {
  // sstFail: the view opens without the temperature
  console.warn(`sst: not read (${e.message}). The view will open without the temperature.\n` +
    '  If Copernicus Marine now asks for an account, make one (free) at marine.copernicus.eu and tell the owner of this script.');
}

// ── the files ──
const mesh = Buffer.alloc(n * 8 + tri.length * 2);
keep.forEach(([x, y], i) => { mesh.writeFloatLE(x, i * 8); mesh.writeFloatLE(y, i * 8 + 4); });
tri.forEach((v, k) => mesh.writeUInt16LE(v, n * 8 + k * 2));
writeFileSync(join(out, 'mesh.bin'), mesh);
writeFileSync(join(out, 'frames.bin'), frames);
if (sstInfo) writeFileSync(join(out, 'sst.bin'), Buffer.from(sst.buffer));
writeFileSync(join(out, 'run.json'), JSON.stringify({
  nodes: n, triangles: tri.length / 3, hours: winds.times.slice(0, F), fetched: winds.fetched,
  scales: { hs: 0.05, speed: 0.1, dir: 360 / 256 }, layout: 'per hour: hs[n], speed[n], from[n]',
  bbox: grid.bbox, reach: REACH, spacing: grid.spacing, sst: sstInfo,
  sources: { land: 'Natural Earth 1:50m land (public domain)', wind: 'NOAA GFS 0.25°, 10 m wind, via Open-Meteo (CC BY 4.0)', sea: 'Hs = 0.21 U²/g (Pierson–Moskowitz), not WAVEWATCH III', sst: sstInfo && `OSTIA ${sstInfo.date}, Copernicus Marine (doi:${sstInfo.doi}); these data were provided by GHRSST and Met Office` },
}, null, 1));
const kb = (f) => (readFileSync(join(out, f)).length / 1024).toFixed(0) + ' kB';
console.log(`✓ public/grid/: land.json ${kb('land.json')}, mesh.bin ${kb('mesh.bin')}, frames.bin ${kb('frames.bin')} (${F} hours)${sstInfo ? `, sst.bin ${kb('sst.bin')}` : ''}`);
