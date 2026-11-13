import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// The shell of the room: an old apartment in Rio. Plastered walls with a tall skirting and a
// cornice under a high ceiling, a herringbone floor ("taco"), a tall wooden window of two leaves
// and a fanlight, set deep in the wall, curtains to the floor on a brass rod, a ceiling rose, and
// a rug. Everything is in metres, at the size it has in such a flat:
//
//   ceiling 3.10 · skirting 0.16 · cornice 0.15 × 0.14 · the wall 0.20 thick at the window
//   window 2.40 × 1.75, its sill 1.00 above the floor · sill board 0.26 deep
//   curtains from a rod at 2.86 to the floor · rug 2.6 × 1.8
//
// The plaster's grain, the wood and the cloth are photographed surfaces (Poly Haven, CC0;
// CREDITS.md); the colours are `config.shell`; the rug, the mottled and yellowed paint and the soft
// shadows under the furniture are drawn here. The stains, the cracks and the wear are in src/lived.js.

export const ROOM = { x0: -3.0, x1: 3.4, z0: -2.0, z1: 3.8, h: 3.1 };
// The window: in the back wall, above the desk. `depth` is how far the frame sits behind the wall's face.
export const WIN = { x: 0.2, y: 1.875, w: 2.4, h: 1.75, depth: 0.16 };
// The sill board: the height of its top, the middle of the part of it a thing can stand on, and that part's depth
export const SILL = { y: WIN.y - WIN.h / 2 + 0.015, z: ROOM.z0 - 0.005, d: 0.2 };

// A box whose texture is laid in metres, with the wood's grain along its longest side.
// `grain` says which way the grain runs in the picture: 'v' (up the picture) or 'u' (across it).
export function woodBox(w, h, d, { per = 1, along, grain = 'v' } = {}) {
  const geo = new THREE.BoxGeometry(w, h, d), uv = geo.attributes.uv;
  const long = along ?? (w >= h && w >= d ? 'x' : h >= d ? 'y' : 'z');
  // faces in order +x -x +y -y +z -z, four vertices each: [what u spans, what v spans]
  const faces = [['z', 'y'], ['z', 'y'], ['x', 'z'], ['x', 'z'], ['x', 'y'], ['x', 'y']], len = { x: w, y: h, z: d };
  for (let f = 0; f < 6; f++) {
    const [a, b] = faces[f], turn = (a === long) === (grain === 'v');
    for (let i = f * 4; i < f * 4 + 4; i++) {
      const u = uv.getX(i) * len[a] / per, v = uv.getY(i) * len[b] / per;
      if (turn) uv.setXY(i, v, u); else uv.setXY(i, u, v);
    }
  }
  return geo;
}

// a flat piece with holes, its texture in metres (walls, ceiling)
function sheet(w, h, holes = []) {
  const s = new THREE.Shape([[0, 0], [w, 0], [w, h], [0, h]].map((p) => new THREE.Vector2(...p)));
  for (const [x, y, hw, hh] of holes) s.holes.push(new THREE.Path([[x, y], [x, y + hh], [x + hw, y + hh], [x + hw, y]].map((p) => new THREE.Vector2(...p))));
  return new THREE.ShapeGeometry(s);
}

// a moulding: a profile [[out, up], ...] pushed along a length
function moulding(profile, length) {
  return new THREE.ExtrudeGeometry(new THREE.Shape(profile.map((p) => new THREE.Vector2(...p))), { depth: length, bevelEnabled: false, steps: 1 });
}

function mulberry(a) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };

// Old paint: nearly one colour, with soft patches a little lighter and a little darker, as a wall
// painted by hand many times has. White, so the wall's own colour tints it. `age` (config.shell.wear.amount)
// adds what the years did: wide patches where it yellowed more, and faint runs where water once came down.
function mottle(seed = 3, size = 512, age = 0) {
  const [c, ctx] = canvas(size, size), r = mulberry(seed);
  ctx.fillStyle = '#ececec'; ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 90; i++) {
    const x = r() * size, y = r() * size, rad = (0.08 + r() * 0.22) * size, light = r() > 0.5;
    for (const [ox, oy] of [[0, 0], [size, 0], [-size, 0], [0, size], [0, -size]]) { // drawn round the edges too, so it tiles
      const g = ctx.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, rad);
      g.addColorStop(0, light ? 'rgba(255,255,255,0.10)' : 'rgba(120,110,95,0.07)'); g.addColorStop(1, 'rgba(128,128,128,0)');
      ctx.fillStyle = g; ctx.fillRect(x + ox - rad, y + oy - rad, rad * 2, rad * 2);
    }
  }
  const round = (draw) => { for (const [ox, oy] of [[0, 0], [size, 0], [-size, 0], [0, size], [0, -size]]) draw(ox, oy); }; // round the edges too, so it tiles
  for (let i = 0; i < 12 && age > 0; i++) {
    const x = r() * size, y = r() * size, rad = (0.18 + r() * 0.26) * size;
    round((ox, oy) => { const g = ctx.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, rad); g.addColorStop(0, `rgba(176,146,92,${0.05 * age})`); g.addColorStop(1, 'rgba(176,146,92,0)'); ctx.fillStyle = g; ctx.fillRect(x + ox - rad, y + oy - rad, rad * 2, rad * 2); });
  }
  for (let i = 0; i < 22 && age > 0; i++) {
    const x = r() * size, y = r() * size, len = (0.08 + r() * 0.3) * size, w = 1.5 + r() * 4;
    round((ox, oy) => { const g = ctx.createLinearGradient(0, y + oy, 0, y + oy + len); g.addColorStop(0, 'rgba(120,100,70,0)'); g.addColorStop(0.2, `rgba(120,100,70,${0.05 * age})`); g.addColorStop(1, 'rgba(120,100,70,0)'); ctx.fillStyle = g; ctx.fillRect(x + ox, y + oy, w, len); });
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// A rug in the manner of a Persian one, drawn: a field of small flowers with a medallion, corner
// pieces and three borders, in the colours of `config.shell.rug`. No rug is copied.
function rugArt(look, size = 1024) {
  const W = size, H = Math.round(size * look.size[1] / look.size[0]);
  const [c, ctx] = canvas(W, H), r = mulberry(17), u = W / 1024;
  const [red, blue, cream, gold, dark] = look.colors;
  ctx.fillStyle = dark; ctx.fillRect(0, 0, W, H);
  const band = (inset, color) => { ctx.fillStyle = color; ctx.fillRect(inset * u, inset * u, W - 2 * inset * u, H - 2 * inset * u); };
  band(10, cream); band(18, blue); band(64, cream); band(70, red); band(84, gold); band(90, red);
  // the wide border: a row of lozenges, a dot between each two
  const along = (inset, step, draw) => {
    for (let x = inset + step / 2; x < 1024 - inset; x += step) { draw(x * u, inset * u, 0); draw(x * u, H - inset * u, 0); }
    for (let y = inset + step * 1.5; y < H / u - inset - step; y += step) { draw(inset * u, y * u, 1); draw(W - inset * u, y * u, 1); }
  };
  let k = 0;
  along(41, 46, (x, y) => {
    ctx.fillStyle = k++ % 2 ? gold : cream; ctx.beginPath(); ctx.moveTo(x, y - 15 * u); ctx.lineTo(x + 13 * u, y); ctx.lineTo(x, y + 15 * u); ctx.lineTo(x - 13 * u, y); ctx.fill();
    ctx.fillStyle = red; ctx.beginPath(); ctx.arc(x, y, 4.5 * u, 0, 7); ctx.fill();
  });
  along(41, 46, (x, y, side) => { ctx.fillStyle = cream; const o = 23 * u; ctx.beginPath(); ctx.arc(x + (side ? 0 : o), y + (side ? o : 0), 2.6 * u, 0, 7); ctx.fill(); });
  // the field: small flowers in rows, each row set off from the last
  const fx0 = 98 * u, fy0 = 98 * u, fw = W - 196 * u, fh = H - 196 * u;
  ctx.save(); ctx.beginPath(); ctx.rect(fx0, fy0, fw, fh); ctx.clip();
  for (let j = 0; j * 34 * u < fh + 34 * u; j++) for (let i = 0; i * 40 * u < fw + 40 * u; i++) {
    const x = fx0 + (i + (j % 2) * 0.5) * 40 * u, y = fy0 + j * 34 * u;
    ctx.fillStyle = (i + j) % 3 ? blue : gold;
    for (let p = 0; p < 4; p++) { const a = p * Math.PI / 2 + 0.78; ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * 6 * u, y + Math.sin(a) * 6 * u, 5 * u, 2.6 * u, a, 0, 7); ctx.fill(); }
    ctx.fillStyle = cream; ctx.beginPath(); ctx.arc(x, y, 2.4 * u, 0, 7); ctx.fill();
  }
  // the corner pieces and the medallion, scalloped
  const lobe = (cx, cy, rx, ry, color) => { ctx.fillStyle = color; ctx.beginPath(); for (let a = 0; a <= 6.3; a += 0.05) { const s = 1 + 0.12 * Math.cos(a * 8); ctx.lineTo(cx + Math.cos(a) * rx * s, cy + Math.sin(a) * ry * s); } ctx.fill(); };
  for (const [cx, cy] of [[fx0, fy0], [fx0 + fw, fy0], [fx0, fy0 + fh], [fx0 + fw, fy0 + fh]]) { lobe(cx, cy, 120 * u, 120 * u, blue); lobe(cx, cy, 92 * u, 92 * u, cream); lobe(cx, cy, 70 * u, 70 * u, red); }
  ctx.restore();
  const mx = W / 2, my = H / 2;
  lobe(mx, my, 215 * u, 150 * u, blue); lobe(mx, my, 190 * u, 128 * u, cream); lobe(mx, my, 172 * u, 112 * u, red); lobe(mx, my, 96 * u, 66 * u, gold); lobe(mx, my, 70 * u, 46 * u, blue); lobe(mx, my, 30 * u, 20 * u, cream);
  for (const s of [-1, 1]) { lobe(mx + s * 262 * u, my, 44 * u, 30 * u, blue); lobe(mx + s * 262 * u, my, 26 * u, 17 * u, gold); }
  // the weave: fine lines across; the wear: a paler path where feet go; and the wool's grain
  ctx.globalAlpha = 0.1; ctx.fillStyle = '#000'; for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1); ctx.globalAlpha = 1;
  const wear = ctx.createRadialGradient(mx, H * 0.62, 20 * u, mx, H * 0.62, 420 * u);
  wear.addColorStop(0, 'rgba(210,190,160,0.16)'); wear.addColorStop(1, 'rgba(210,190,160,0)');
  ctx.fillStyle = wear; ctx.fillRect(0, 0, W, H);
  const img = ctx.getImageData(0, 0, W, H);
  for (let i = 0; i < img.data.length; i += 4) { const n = (r() - 0.5) * 22; img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n; }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}
// the pile of the rug, as a bump: short strokes across
function pileBump() {
  const [c, ctx] = canvas(256, 256), r = mulberry(5);
  ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 5000; i++) { const v = 90 + r() * 90; ctx.fillStyle = `rgb(${v},${v},${v})`; ctx.fillRect(r() * 256, r() * 256, 1 + r() * 3, 1); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(10, 7); return t;
}

// The soft dark patch a thing leaves on the floor where it stands: no pass and no light, one draw
// call for all of them. `spots`: [x, z, width, depth, strength?, y?, turn?].
export function contactShadows(spots) {
  const [c, ctx] = canvas(128, 128);
  const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.5, 'rgba(255,255,255,0.55)'); g.addColorStop(0.8, 'rgba(255,255,255,0.14)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 128, 128); ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
  const geos = spots.map(([x, z, w, d, k = 0.5, y = 0.004, turn = 0]) => {
    const geo = new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2).rotateY(turn).translate(x, y, z);
    geo.setAttribute('color', new THREE.Float32BufferAttribute([0, 0, 0, k, 0, 0, 0, k, 0, 0, 0, k, 0, 0, 0, k], 4));
    return geo;
  });
  const m = new THREE.Mesh(mergeGeometries(geos), new THREE.MeshBasicMaterial({ alphaMap: new THREE.CanvasTexture(c), vertexColors: true, transparent: true, depthWrite: false, fog: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  m.name = 'contact'; m.renderOrder = 1; m.castShadow = m.receiveShadow = false; m.userData.proxy = true; // the pointer and Nash pass through it
  return m;
}

// a curtain: cloth hanging from a rod in folds that are never quite alike, gathered at the top,
// fuller and looser toward the hem
function curtainGeo(width, height, folds, seed) {
  const geo = new THREE.PlaneGeometry(width, height, Math.round(folds * 12), 14), p = geo.attributes.position, r = mulberry(seed);
  const ph = [r() * 6.28, r() * 6.28, r() * 6.28], f2 = 0.37 + r() * 0.2, f3 = 1.7 + r() * 0.5;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), u = x / width + 0.5, v = y / height + 0.5; // v: 0 at the hem, 1 at the rod
    const a = u * folds * Math.PI * 2, open = 1 + 0.45 * (1 - v) ** 1.5;
    const wave = Math.sin(a + ph[0] + 0.9 * Math.sin(a * f2 + ph[1])) * (0.75 + 0.25 * Math.sin(a * 0.23 + ph[2])); // folds of uneven width and depth
    const z = (0.042 * wave + 0.012 * Math.sin(a * f3 + ph[1])) * open + 0.014 * (1 - v) * Math.sin(u * 5 + ph[2]);
    p.setXYZ(i, x * (0.9 + 0.1 * open) + 0.01 * Math.cos(a + ph[0]) * open, y, z);
  }
  geo.computeVertexNormals();
  return geo;
}

// Builds the shell into the room. `mesh`, `part` and `std` are the room's own helpers
// (src/room.js); `pbr(name, repeat, rot)` loads a photographed surface (its maps are listed in src/first.js); `look` is
// `config.shell`; `rose` is where the ceiling rose is, `doorGap` where the front wall's
// skirting stops for the door.
export function buildShell({ mesh, part, std, pbr, lite, look, rose, doorGap }) {
  const { x0, x1, z0, z1, h: H } = ROOM, W = x1 - x0, D = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;

  // ── the floor: herringbone parquet, waxed and a little worn ──
  const parquet = new THREE.MeshStandardMaterial({ color: look.floor, ...pbr('herringbone_parquet', [3.5, 3.5]), roughness: 1, normalScale: new THREE.Vector2(0.6, 0.6) });
  // the wax never shines like glass: the photographed roughness has specks near zero, which a lamp
  // seen low across the floor turns into white sparks, so it is kept above a floor of its own
  parquet.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n\troughnessFactor = max( roughnessFactor, 0.5 );'); };
  const floor = mesh('floor', new THREE.PlaneGeometry(7, 7), parquet, [0, 0, 0.5]);
  floor.rotation.x = -Math.PI / 2; floor.castShadow = false;

  // ── the walls: painted plaster, the paint a little uneven, the plaster's grain under it ──
  const paint = mottle(3, 512, Math.min(look.wear?.amount ?? 0, 2)); paint.repeat.set(1 / 3.7, 1 / 3.7);
  const plaster = (color) => new THREE.MeshStandardMaterial({ color, map: paint, ...pbr('beige_wall_001', [1 / 2.4, 1 / 2.4]), roughness: 1, normalScale: new THREE.Vector2(0.6, 0.6) });
  const wallMat = plaster(look.wall);
  const wall = (name, w, holes, pos, rotY, cast = true) => { const m = mesh(name, sheet(w, H, holes), wallMat, pos); m.rotation.y = rotY; m.castShadow = cast; return m; };
  const wx0 = WIN.x - WIN.w / 2, wy0 = WIN.y - WIN.h / 2, top = wy0 + WIN.h;
  // the back wall has the window's opening; the walls and the ceiling cast, so the day's sun comes in by the window only
  wall('wall_back', W, [[wx0 - x0, wy0, WIN.w, WIN.h]], [x0, 0, z0], 0, true);
  wall('wall_left', D + 1, [], [x0, 0, z1 + 0.5], Math.PI / 2);
  wall('wall_right', D + 1, [], [x1, 0, z0 - 0.5], -Math.PI / 2);
  wall('wall_front', W, [], [x1, 0, z1], Math.PI);
  // the reveal: the wall is thick, and the window sits deep in it
  const rv = WIN.depth + 0.05, rz = z0 - rv / 2 - 0.001, reveal = { opts: { roughness: 0.95 } };
  for (const s of [-1, 1]) part(new THREE.BoxGeometry(0.02, WIN.h, rv), [WIN.x + s * (WIN.w / 2 + 0.01), WIN.y, rz], look.reveal, reveal);
  part(new THREE.BoxGeometry(WIN.w + 0.04, 0.02, rv), [WIN.x, top + 0.01, rz], look.reveal, reveal);
  part(new THREE.BoxGeometry(WIN.w + 0.04, 0.02, rv), [WIN.x, wy0 - 0.01, rz], look.reveal, reveal);

  // ── the ceiling: white, a cornice all round, a rose where the lamp hangs ──
  const ceiling = mesh('ceiling', sheet(W, D), plaster(look.ceiling), [x0, H, z0]); ceiling.rotation.x = Math.PI / 2;
  const white = { opts: { roughness: 0.75 } };
  // the cornice's profile, out from the wall and down from the ceiling: a cove between two fillets
  const cove = [[0, 0], [0.14, 0], [0.14, -0.018], [0.125, -0.018], [0.118, -0.03], [0.1, -0.05], [0.07, -0.085], [0.045, -0.105], [0.03, -0.112], [0.03, -0.132], [0.018, -0.132], [0.018, -0.15], [0, -0.15]];
  const run = (len, pos, rotY) => part(moulding(cove, len), pos, look.trim, { rot: [0, rotY, 0], ...white });
  run(W, [x1, H, z0], -Math.PI / 2); run(W, [x0, H, z1], Math.PI / 2); run(D, [x0, H, z0], 0); run(D, [x1, H, z1], Math.PI); // back, front, left, right
  const medal = [[0, 0], [0.36, 0], [0.36, -0.012], [0.32, -0.02], [0.29, -0.014], [0.24, -0.03], [0.18, -0.022], [0.13, -0.045], [0.08, -0.04], [0.05, -0.07], [0, -0.075]];
  part(new THREE.LatheGeometry(medal.map((p) => new THREE.Vector2(...p)), lite ? 24 : 48), [rose[0], H, rose[1]], look.trim, white);

  // ── the woodwork: a tall skirting ──
  const wood = new THREE.MeshStandardMaterial({ color: look.wood, ...pbr('rosewood_veneer1', [1, 1]), roughness: 0.7, normalScale: new THREE.Vector2(0.5, 0.5) });
  const P = 0.9; // metres of wood one picture covers
  const skirt = (len, x, z, rotY) => {
    part(woodBox(len, 0.14, 0.018, { per: P }), [x, 0.07, z], wood, { rot: [0, rotY, 0] });
    part(woodBox(len, 0.022, 0.026, { per: P }), [x, 0.151, z], wood, { rot: [0, rotY, 0] }); // the bead on top
  };
  skirt(W, cx, z0 + 0.009, 0); skirt(D, x0 + 0.009, cz, Math.PI / 2); skirt(D, x1 - 0.009, cz, Math.PI / 2);
  const [dl, dr] = doorGap;
  skirt(dl - x0, (x0 + dl) / 2, z1 - 0.009, 0); skirt(x1 - dr, (x1 + dr) / 2, z1 - 0.009, 0);

  // ── the window: a wooden frame deep in the wall, two leaves, a fanlight above, a sill board ──
  const fz = z0 - WIN.depth, FR = 0.06, fan = top - 0.42; // `fan`: the rail under the fanlight
  const bar = (w, h, d, x, y, z = fz) => part(woodBox(w, h, d, { per: P }), [x, y, z], wood);
  bar(WIN.w, FR, 0.09, WIN.x, top - FR / 2); bar(WIN.w, FR, 0.09, WIN.x, wy0 + FR / 2);                 // head and bottom
  for (const s of [-1, 1]) bar(FR, WIN.h, 0.09, WIN.x + s * (WIN.w / 2 - FR / 2), WIN.y);               // the jambs
  bar(WIN.w - 2 * FR, 0.05, 0.08, WIN.x, fan);                                                        // the rail under the fanlight
  bar(0.07, fan - wy0 - FR, 0.06, WIN.x, (fan + wy0 + FR) / 2, fz + 0.012);                            // where the two leaves meet
  bar(0.035, top - fan - FR, 0.05, WIN.x, (top + fan) / 2);                                            // the fanlight, in two
  for (const s of [-1, 1]) {
    const lx = WIN.x + s * (WIN.w / 4 - FR / 4), lw = WIN.w / 2 - FR - 0.035;
    bar(lw, 0.045, 0.045, lx, wy0 + FR + 0.022, fz + 0.012); bar(lw, 0.045, 0.045, lx, fan - 0.047, fz + 0.012); // each leaf's rails
    bar(lw, 0.028, 0.03, lx, (fan + wy0) / 2 + 0.01, fz + 0.012);                                      // and its glazing bar
    part(new THREE.SphereGeometry(0.014, 12, 8), [WIN.x + s * 0.05, (fan + wy0) / 2 - 0.12, fz + 0.06], look.brass, { opts: { metalness: 0.85, roughness: 0.3 } }); // the knobs
  }
  // the architrave on the room's side, the sill board, and the apron under it
  const AR = 0.075;
  for (const s of [-1, 1]) part(woodBox(AR, WIN.h + AR, 0.022, { per: P }), [WIN.x + s * (WIN.w / 2 + AR / 2), WIN.y + AR / 2, z0 + 0.011], wood);
  part(woodBox(WIN.w + 2 * AR, AR, 0.026, { per: P }), [WIN.x, top + AR / 2, z0 + 0.013], wood);
  part(woodBox(WIN.w + 2 * AR + 0.06, 0.035, WIN.depth + 0.1, { per: P }), [WIN.x, SILL.y - 0.0175, z0 - WIN.depth / 2 + 0.05], wood);
  part(woodBox(WIN.w + 2 * AR, 0.05, 0.018, { per: P }), [WIN.x, wy0 - 0.05, z0 + 0.009], wood);

  // ── the curtains: cotton, drawn back to each side of the window, on a brass rod ──
  const rodY = 2.86, cw = 0.44, cz0 = z0 + 0.1, hem = 0.025;
  const cloth = new THREE.MeshStandardMaterial({ color: look.curtain, ...pbr('cotton_jersey', [3, 14]), roughness: 1, side: THREE.DoubleSide, normalScale: new THREE.Vector2(0.6, 0.6) });
  const brass = { opts: { metalness: 0.85, roughness: 0.32 } };
  part(new THREE.CylinderGeometry(0.011, 0.011, WIN.w + 2 * cw + 0.1, 12), [WIN.x, rodY, cz0], look.brass, { rot: [0, 0, Math.PI / 2], ...brass });
  for (const s of [-1, 1]) {
    part(new THREE.SphereGeometry(0.024, 14, 10), [WIN.x + s * (WIN.w / 2 + cw + 0.06), rodY, cz0], look.brass, brass);
    part(new THREE.CylinderGeometry(0.006, 0.006, 0.1, 6), [WIN.x + s * (WIN.w / 2 + cw - 0.04), rodY, z0 + 0.05], look.brass, { rot: [Math.PI / 2, 0, 0], ...brass }); // the bracket
    const tall = rodY - 0.015 - hem;
    const c = mesh('curtain', curtainGeo(cw, tall, 3.3, s + 3), cloth, [WIN.x + s * (WIN.w / 2 + cw / 2 - 0.03), hem + tall / 2, cz0]);
    c.castShadow = false; // the sun comes round them, not through a shadow map
  }

  // ── the rug, with its fringe ──
  const [rw, rd] = look.rug.size, [rx, rgz] = look.rug.at;
  const rug = mesh('rug', new THREE.BoxGeometry(rw, 0.012, rd), new THREE.MeshStandardMaterial({ map: rugArt(look.rug, lite ? 512 : 1024), bumpMap: lite ? null : pileBump(), bumpScale: 1.2, roughness: 1 }), [rx, 0.006, rgz]);
  rug.castShadow = false;
  const n = lite ? 40 : 110, fringe = [];
  for (const s of [-1, 1]) for (let i = 0; i < n; i++) {
    fringe.push(new THREE.BoxGeometry(0.05 + (i % 3) * 0.006, 0.003, 0.006).rotateY(((i * 7) % 5 - 2) * 0.06).translate(rx + s * (rw / 2 + 0.024), 0.003, rgz - rd / 2 + (i + 0.5) * rd / n));
  }
  mesh('', mergeGeometries(fringe), std(look.rug.colors[2], { roughness: 1 }), [0, 0, 0]).castShadow = false;

  return { floor, wood, fz, woodPer: P };
}
