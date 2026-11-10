import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { FACES, FONT_TITLE, FONT_MONO } from './art.js';

// The tapes, their sleeves, the VCR and the mixtape, at their real sizes.
// Everything here is built around its own origin and placed by the room,
// and every word and colour that makes it someone's comes in from config.
//
// The sizes, in millimetres:
//
//   VHS cassette   187 × 103 × 25    the shell 186.2 × 102.4 × 24.6, edges rounded 1.6;
//                                    the flap 187 × 25 × 5.5 along one long edge;
//                                    two windows of 46 × 30, sunk 1.5, reel hubs 93 apart;
//                                    top label 148 × 40, spine sticker 147 × 19.4
//   its sleeve     189–193.5 × 106 × 28   card, edges rounded 1.2, open at one short end
//   VCR            430 × 90 × 300    feet 7, the cover 428 × 80 × 290, the fascia 430 × 83 × 14;
//                                    the slot 192 × 32, its flap 191 × 31; the display 158 × 32;
//                                    six keys of 20 × 9, standing 2.2 proud
//   audio cassette 100 × 64 × 9      12 thick at the head (60 × 13.5); the window 28 × 12,
//                                    spindle holes 42.5 apart
//
// Budgets: a cassette is one draw call (244 triangles), a sleeve one (100),
// the VCR three (the body, the slot's flap, the LED; about 1 150 triangles),
// the mixtape one (two with its clear case, on the full look only). Each
// has one atlas, drawn on a canvas; the lite look draws them at half size.

const M = 0.001; // metres in a millimetre
const still = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const S = (t) => t * t * (3 - 2 * t);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seedOf = (s) => { let h = 2166136261; for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
const rng = (a) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const fontOf = (name) => FACES[name] ?? { title: FONT_TITLE, mono: FONT_MONO }[name] ?? FACES.marker;

// ─────────────────────────────────────────────────────────────
// Canvases. A sheet is drawn in its own logical pixels, `k` times
// as large on the canvas; a region of it is drawn in millimetres.
// ─────────────────────────────────────────────────────────────
function sheet([w, h], k = 1) {
  const c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k);
  const ctx = c.getContext('2d'); ctx.scale(k, k);
  return [c, ctx];
}
function texture(c, { srgb = true, anisotropy = 8 } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = anisotropy;
  return t;
}
function region(ctx, [x, y, w, h], wmm, hmm, draw) {
  ctx.save(); ctx.beginPath(); ctx.rect(x - 1, y - 1, w + 2, h + 2); ctx.clip();
  ctx.translate(x, y); ctx.scale(w / wmm, h / hmm); draw(ctx, wmm, hmm); ctx.restore();
}
// the largest size at which a text fits a width; leaves the font set
function fit(c, text, max, size, font) {
  c.font = `${size}px ${font}`;
  const w = c.measureText(text).width;
  if (w > max) { size *= max / w; c.font = `${size}px ${font}`; }
  return size;
}
function specks(c, w, h, n, rnd, { light = 0.1, dark = 0.1, size = 0.5 } = {}) {
  for (let i = 0; i < n; i++) {
    const on = rnd() < 0.5;
    c.fillStyle = `rgba(${on ? '255,255,255' : '0,0,0'},${(on ? light : dark) * rnd()})`;
    c.fillRect(rnd() * w, rnd() * h, 0.1 + rnd() * size, 0.1 + rnd() * size * 0.6);
  }
}
// scuffed edges: the card, or the bare plastic, where the surface has rubbed off
function wear(c, w, h, rnd, { color = '233,226,212', n = 1, corners = 1 } = {}) {
  const per = 2 * (w + h);
  for (let i = 0; i < per * 1.5 * n; i++) {
    const d = rnd() * per, len = 0.4 + rnd() * rnd() * 5, t = 0.1 + rnd() * rnd() * 0.6;
    c.fillStyle = `rgba(${color},${0.2 + rnd() * 0.6})`;
    if (d < w) c.fillRect(d, 0, len, t); else if (d < 2 * w) c.fillRect(d - w, h - t, len, t);
    else if (d < 2 * w + h) c.fillRect(0, d - 2 * w, t, len); else c.fillRect(w - t, d - 2 * w - h, t, len);
  }
  for (const [x, y] of [[0, 0], [w, 0], [0, h], [w, h]]) for (let i = 0; i < 7 * corners; i++) {
    c.fillStyle = `rgba(${color},${0.25 + rnd() * 0.5})`;
    c.beginPath(); c.arc(x + (rnd() - 0.5) * 1.6, y + (rnd() - 0.5) * 1.6, 0.25 + rnd() * 0.8, 0, 7); c.fill();
  }
}
// a soft dark rim, as where two stacked things meet: it stands in for the occlusion the lite look has none of
function rim(c, w, h, d = 1.6, a = 0.28) {
  for (const [x0, y0, x1, y1, r] of [[0, 0, 0, d, [0, 0, w, d]], [0, h, 0, h - d, [0, h - d, w, d]], [0, 0, d, 0, [0, 0, d, h]], [w, 0, w - d, 0, [w - d, 0, d, h]]]) {
    const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(...r);
  }
}
let _noise;
function grain(ctx, amount) { // fine red noise, added to a relief sheet: the grain of plastic and of paper
  if (!_noise) {
    _noise = document.createElement('canvas'); _noise.width = _noise.height = 128;
    const n = _noise.getContext('2d'), img = n.createImageData(128, 128), r = rng(11);
    for (let i = 0; i < 128 * 128; i++) img.data.set([r() * 255, 0, 0, 255], i * 4);
    n.putImageData(img, 0, 0);
  }
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = amount; ctx.fillStyle = ctx.createPattern(_noise, 'repeat');
  ctx.fillRect(0, 0, 4096, 4096); ctx.restore();
}
// A relief sheet holds three things in one texture: red is the height (the bump),
// green the roughness, blue the metalness.
const relief = (h, rough, metal = 0) => `rgb(${Math.round(h)},${Math.round(rough * 255)},${Math.round(metal * 255)})`;

// ─────────────────────────────────────────────────────────────
// Geometry, as loose triangles: positions, normals and atlas UVs.
// ─────────────────────────────────────────────────────────────
const DIRS = ['px', 'nx', 'py', 'ny', 'pz', 'nz'];
const AXIS = { px: 0, nx: 0, py: 1, ny: 1, pz: 2, nz: 2 };
// where a point of a face lies in its picture: u to the right, v up, each 0..1 across the box
const FRAME = {
  px: (x, y, z) => [1 - z, y], nx: (x, y, z) => [z, y],
  py: (x, y, z) => [x, 1 - z], ny: (x, y, z) => [x, z],
  pz: (x, y) => [x, y], nz: (x, y) => [1 - x, y],
};
// and back: a point (u, v) of a face, n out of it
const TO = {
  px: (u, v, n) => [n, v, -u], nx: (u, v, n) => [-n, v, u],
  py: (u, v, n) => [u, n, -v], pz: (u, v, n) => [u, v, n],
};
const soup = () => ({ p: [], n: [], uv: [] });

// A box with rounded edges. `open` leaves a whole side out; `cut` leaves out
// only its flat middle, for a plate with wells to take its place.
function rbox(w, h, d, r, { open = [], cut = [] } = {}) {
  const g = new RoundedBoxGeometry(w, h, d, 1, r), pos = g.attributes.position.array, nor = g.attributes.normal.array;
  const per = pos.length / 6, part = soup();
  for (let i = 0; i < pos.length; i += 9) {
    const side = DIRS[Math.floor(i / per)], a = AXIS[side];
    if (open.includes(side)) continue;
    if (cut.includes(side) && [0, 3, 6].every((k) => Math.abs(nor[i + k + a]) > 0.999)) continue;
    for (let k = 0; k < 9; k++) { part.p.push(pos[i + k]); part.n.push(nor[i + k]); }
  }
  g.dispose();
  return part;
}
function fromGeometry(geo) {
  const g = geo.index ? geo.toNonIndexed() : geo, part = soup();
  part.p.push(...g.attributes.position.array); part.n.push(...g.attributes.normal.array);
  return part;
}
function shift(part, x, y, z) {
  for (let i = 0; i < part.p.length; i += 3) { part.p[i] += x; part.p[i + 1] += y; part.p[i + 2] += z; }
  return part;
}
// A flat face with rectangular wells sunk into it: a cassette's windows, the
// VCR's slot. [u0, v0, u1, v1] in the face's own plane, at `n` along its normal.
function plate(dir, [u0, v0, u1, v1], n, wells = []) {
  const to = TO[dir], part = soup();
  const quad = (a, b, c, d) => {
    const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], e2 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const nx = e1[1] * e2[2] - e1[2] * e2[1], ny = e1[2] * e2[0] - e1[0] * e2[2], nz = e1[0] * e2[1] - e1[1] * e2[0], l = Math.hypot(nx, ny, nz) || 1;
    for (const v of [a, b, c, a, c, d]) { part.p.push(...v); part.n.push(nx / l, ny / l, nz / l); }
  };
  const cuts = (a, b, k0, k1) => [...new Set([a, b, ...wells.flatMap((w) => [w[k0], w[k1]])])].sort((x, y) => x - y);
  const us = cuts(u0, u1, 'u0', 'u1'), vs = cuts(v0, v1, 'v0', 'v1');
  for (let i = 0; i < us.length - 1; i++) for (let j = 0; j < vs.length - 1; j++) {
    const cu = (us[i] + us[i + 1]) / 2, cv = (vs[j] + vs[j + 1]) / 2;
    if (wells.some((w) => cu > w.u0 && cu < w.u1 && cv > w.v0 && cv < w.v1)) continue;
    quad(to(us[i], vs[j], n), to(us[i + 1], vs[j], n), to(us[i + 1], vs[j + 1], n), to(us[i], vs[j + 1], n));
  }
  for (const w of wells) {
    const s = w.inset ?? 0, m = n - w.depth;
    const r = [[w.u0, w.v0], [w.u1, w.v0], [w.u1, w.v1], [w.u0, w.v1]];
    const f = [[w.u0 + s, w.v0 + s], [w.u1 - s, w.v0 + s], [w.u1 - s, w.v1 - s], [w.u0 + s, w.v1 - s]];
    for (let k = 0; k < 4; k++) { const k1 = (k + 1) % 4; quad(to(...r[k], n), to(...r[k1], n), to(...f[k1], m), to(...f[k], m)); }
    quad(to(...f[0], m), to(...f[1], m), to(...f[2], m), to(...f[3], m));
  }
  return part;
}
// Gives every triangle its place in the atlas: the picture of the side it
// faces (or of `dir`, for the walls of a well), by where it lies in `box`.
function unwrap(part, rects, [W, H], box, dir) {
  const { p, n } = part, min = box.min, size = box.getSize(new THREE.Vector3());
  part.uv.length = 0;
  for (let i = 0; i < p.length; i += 9) {
    let side = dir;
    if (!side) {
      const s = [n[i] + n[i + 3] + n[i + 6], n[i + 1] + n[i + 4] + n[i + 7], n[i + 2] + n[i + 5] + n[i + 8]];
      const a = Math.abs(s[1]) >= Math.abs(s[0]) && Math.abs(s[1]) >= Math.abs(s[2]) ? 1 : Math.abs(s[2]) >= Math.abs(s[0]) ? 2 : 0;
      side = DIRS[a * 2 + (s[a] < 0 ? 1 : 0)];
    }
    const [rx, ry, rw, rh] = Array.isArray(rects) ? rects : rects[side];
    for (let k = 0; k < 9; k += 3) {
      const [u, v] = FRAME[side](clamp((p[i + k] - min.x) / size.x), clamp((p[i + k + 1] - min.y) / size.y), clamp((p[i + k + 2] - min.z) / size.z));
      part.uv.push((rx + u * rw) / W, 1 - (ry + (1 - v) * rh) / H);
    }
  }
  return part;
}
function geometry(parts) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(parts.flatMap((x) => x.p), 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(parts.flatMap((x) => x.n), 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(parts.flatMap((x) => x.uv), 2));
  g.computeBoundingSphere();
  return g;
}
const boxOf = (w, h, d) => new THREE.Box3(new THREE.Vector3(-w / 2, -h / 2, -d / 2), new THREE.Vector3(w / 2, h / 2, d / 2));
function shadowed(m) { m.castShadow = m.receiveShadow = true; return m; }

// ─────────────────────────────────────────────────────────────
// The VHS cassette. It lies with its label up (+y), its spine
// sticker toward +z and its flap toward -z: it goes into the VCR
// flap first.
// ─────────────────────────────────────────────────────────────
const CAS = {
  w: 187, h: 25, d: 103,
  windows: [[24, 15, 46, 30], [117, 15, 46, 30]], hubs: [[47, 30.5], [140, 30.5]], // on the top, from the flap's left corner
  label: [19.5, 54, 148, 40], sticker: [20, 2.8, 147, 19.4], lip: 5.5,
  ribs: [[4.5, 16, 14, 28], [168.5, 16, 14, 28]],
  size: [1024, 1024],
  at: { py: [0, 0, 1024, 564], pz: [0, 572, 1024, 137], nz: [0, 716, 1024, 137], ny: [0, 860, 298, 164], px: [306, 860, 340, 82], nx: [306, 942, 340, 82] },
};
let _casGeo;
function cassetteGeometry() {
  if (_casGeo) return _casGeo;
  const W = CAS.w * M, H = CAS.h * M, D = CAS.d * M, r = 1.6 * M, box = boxOf(W, H, D);
  const bw = 186.2 * M, bh = 24.6 * M, bd = 102.4 * M, z0 = (D - bd) / 2; // the shell sits behind the flap
  const body = shift(rbox(bw, bh, bd, r, { cut: ['py'] }), 0, 0, z0);
  const wells = CAS.windows.map(([x, y, w, h]) => ({ u0: x * M - W / 2, u1: (x + w) * M - W / 2, v0: D / 2 - (y + h) * M, v1: D / 2 - y * M, depth: 1.5 * M, inset: 1 * M }));
  const top = plate('py', [-(bw / 2 - r), -z0 - (bd / 2 - r), bw / 2 - r, -z0 + (bd / 2 - r)], bh / 2, wells);
  const flap = shift(rbox(W, H, CAS.lip * M, 1.2 * M, { open: ['pz'] }), 0, 0, -D / 2 + CAS.lip * M / 2);
  return (_casGeo = geometry([unwrap(body, CAS.at, CAS.size, box), unwrap(top, CAS.at, CAS.size, box, 'py'), unwrap(flap, CAS.at, CAS.size, box)]));
}

// a reel seen through a window: the pack of tape, the white hub and its teeth
function reel(c, x, y, pack, hub, turn = 0) {
  c.fillStyle = 'rgba(255,255,255,0.035)'; c.beginPath(); c.arc(x, y, 43, 0, 7); c.fill(); // the clear flange
  c.strokeStyle = 'rgba(255,255,255,0.07)'; c.lineWidth = 0.35;
  for (let k = 0; k < 3; k++) { const a = turn + k * 2.094; c.beginPath(); c.moveTo(x + Math.cos(a) * (hub + 1), y + Math.sin(a) * (hub + 1)); c.lineTo(x + Math.cos(a) * 42, y + Math.sin(a) * 42); c.stroke(); }
  const g = c.createRadialGradient(x, y, hub, x, y, pack);
  g.addColorStop(0, '#2b201a'); g.addColorStop(0.7, '#1d1512'); g.addColorStop(1, '#120d0b');
  c.fillStyle = g; c.beginPath(); c.arc(x, y, pack, 0, 7); c.fill();
  c.lineWidth = 0.18; // the windings catch the light in rings
  for (let rr = hub + 0.8; rr < pack; rr += 0.9) { c.strokeStyle = `rgba(255,225,200,${0.03 + 0.05 * Math.abs(Math.sin(rr * 2.7))})`; c.beginPath(); c.arc(x, y, rr, 0, 7); c.stroke(); }
  for (const a of [turn - 0.9, turn + 2.2]) { // and in two soft wedges
    c.fillStyle = 'rgba(255,230,205,0.07)'; c.beginPath(); c.moveTo(x, y); c.arc(x, y, pack, a, a + 0.5); c.fill();
  }
  c.fillStyle = '#e9e5db'; c.beginPath(); c.arc(x, y, hub, 0, 7); c.fill();
  c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 0.3; c.beginPath(); c.arc(x, y, hub - 0.15, 0, 7); c.stroke();
  c.fillStyle = '#0a0a0c'; c.beginPath(); c.arc(x, y, hub * 0.5, 0, 7); c.fill();
  c.fillStyle = '#d5d1c6';
  for (let k = 0; k < 6; k++) { c.save(); c.translate(x, y); c.rotate(turn + k * 1.0472); c.fillRect(hub * 0.3, -0.7, hub * 0.24, 1.4); c.restore(); }
  c.fillStyle = 'rgba(0,0,0,0.5)';
  for (let k = 0; k < 3; k++) { const a = turn + 0.5 + k * 2.094; c.beginPath(); c.arc(x + Math.cos(a) * hub * 0.76, y + Math.sin(a) * hub * 0.76, 0.9, 0, 7); c.fill(); }
}

const SHELL = '#151517';
// The shell without its labels, the same for every cassette: drawn once.
function paintShell(ctx) {
  const rnd = rng(3), A = CAS.at;
  ctx.fillStyle = SHELL; ctx.fillRect(0, 0, ...CAS.size);
  region(ctx, A.py, CAS.w, CAS.d, (c, w, h) => { // the top
    c.fillStyle = SHELL; c.fillRect(-2, -2, w + 4, h + 4);
    specks(c, w, h, 900, rnd, { light: 0.07, dark: 0.25, size: 0.5 });
    c.fillStyle = '#060607'; c.fillRect(0, CAS.lip - 0.15, w, 0.5); c.fillStyle = 'rgba(255,255,255,0.05)'; c.fillRect(0, CAS.lip + 0.35, w, 0.25); // where the flap ends
    for (const [x, y, rw, rh] of CAS.ribs) for (let i = 0; i * 1.75 < rw; i++) { // the ribbed grips
      c.fillStyle = '#0a0a0b'; c.fillRect(x + i * 1.75, y, 0.8, rh); c.fillStyle = '#242427'; c.fillRect(x + i * 1.75 + 0.8, y, 0.5, rh);
    }
    c.fillStyle = '#1e1e21'; c.beginPath(); c.moveTo(93.5, 20); c.lineTo(99, 29); c.lineTo(88, 29); c.fill(); // the arrow: this way in
    c.fillStyle = '#0c0c0d'; for (let i = 0; i < 4; i++) c.fillRect(84, 33 + i * 2.2, 19, 0.9);
    CAS.windows.forEach(([x, y, ww, wh], i) => {
      c.fillStyle = '#1b1b1e'; c.fillRect(x - 1.2, y - 1.2, ww + 2.4, wh + 2.4); // a raised frame
      c.fillStyle = '#0d0d0f'; c.fillRect(x, y, ww, wh);                          // the walls of the well
      c.save(); c.beginPath(); c.rect(x + 1, y + 1, ww - 2, wh - 2); c.clip();
      c.fillStyle = '#08080a'; c.fillRect(x, y, ww, wh);
      reel(c, ...CAS.hubs[i], i === 0 ? 31 : 15.5, 13, i * 0.7);
      const g = c.createLinearGradient(x, y, x + ww, y + wh); // the glass: a streak of light, a shadow under its edge
      g.addColorStop(0.18, 'rgba(255,255,255,0)'); g.addColorStop(0.3, 'rgba(255,255,255,0.09)'); g.addColorStop(0.42, 'rgba(255,255,255,0.02)'); g.addColorStop(0.55, 'rgba(255,255,255,0.05)'); g.addColorStop(0.62, 'rgba(255,255,255,0)');
      c.fillStyle = g; c.fillRect(x, y, ww, wh);
      const sh = c.createLinearGradient(0, y + 1, 0, y + 5); sh.addColorStop(0, 'rgba(0,0,0,0.6)'); sh.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = sh; c.fillRect(x, y, ww, 5);
      c.restore();
    });
    const [lx, ly, lw, lh] = CAS.label; c.fillStyle = '#09090a'; c.fillRect(lx - 1, ly - 1, lw + 2, lh + 2); // the label's recess
    wear(c, w, h, rnd, { color: '120,120,126', n: 0.5 });
  });
  const side = (c, w, h) => {
    c.fillStyle = SHELL; c.fillRect(-2, -2, w + 4, h + 4);
    specks(c, w, h, 260, rnd, { light: 0.07, dark: 0.25 });
    c.fillStyle = '#070708'; c.fillRect(0, h / 2 - 0.15, w, 0.35); c.fillStyle = 'rgba(255,255,255,0.045)'; c.fillRect(0, h / 2 + 0.2, w, 0.2); // the two halves of the shell meet
  };
  region(ctx, A.pz, CAS.w, CAS.h, (c, w, h) => { // the spine
    side(c, w, h);
    const [sx, sy, sw, sh] = CAS.sticker; c.fillStyle = '#09090a'; c.fillRect(sx - 0.8, sy - 0.8, sw + 1.6, sh + 1.6);
    c.fillStyle = '#060607'; c.fillRect(6, 15.5, 8.5, 6); c.fillStyle = '#1c1c1f'; c.fillRect(6.6, 16.1, 7.3, 4.8); // the record tab, still there
    wear(c, w, h, rnd, { color: '120,120,126', n: 0.6 });
  });
  region(ctx, A.nz, CAS.w, CAS.h, (c, w, h) => { // the flap
    c.fillStyle = '#131315'; c.fillRect(-2, -2, w + 4, h + 4);
    specks(c, w, h, 260, rnd, { light: 0.07, dark: 0.25 });
    c.fillStyle = 'rgba(255,255,255,0.035)'; c.fillRect(0, 3, w, 5);
    c.fillStyle = '#060607'; for (const x of [28, 151]) c.fillRect(x, h - 4.5, 8, 4.5);
    c.fillRect(0, h - 1.4, w, 0.3);
    wear(c, w, h, rnd, { color: '120,120,126', n: 0.6 });
  });
  for (const [key, flapAt] of [['px', 1], ['nx', 0]]) region(ctx, A[key], CAS.d, CAS.h, (c, w, h) => { // the two ends
    side(c, w, h);
    const x = flapAt ? w - 22 : 22; c.fillStyle = '#060607'; c.fillRect(x - 0.2, 0, 0.4, h); // the flap's arm
    c.fillRect(flapAt ? w - 15 : 9, 9.5, 6, 6); c.fillStyle = '#202023'; c.fillRect(flapAt ? w - 14.4 : 9.6, 10.1, 4.8, 4.8); // its catch
    wear(c, w, h, rnd, { color: '120,120,126', n: 0.6 });
  });
  region(ctx, A.ny, CAS.w, CAS.d, (c, w, h) => { // underneath: the hubs and five screws
    c.fillStyle = '#121214'; c.fillRect(-2, -2, w + 4, h + 4);
    for (const [x, y] of CAS.hubs) { c.fillStyle = '#060607'; c.beginPath(); c.arc(x, h - y, 15, 0, 7); c.fill(); c.fillStyle = '#d5d1c6'; c.beginPath(); c.arc(x, h - y, 12.5, 0, 7); c.fill(); c.fillStyle = '#0a0a0c'; c.beginPath(); c.arc(x, h - y, 6, 0, 7); c.fill(); }
    c.fillStyle = '#050506'; for (const [x, y] of [[8, 8], [w - 8, 8], [8, h - 8], [w - 8, h - 8], [w / 2, h - 14]]) { c.beginPath(); c.arc(x, y, 2.2, 0, 7); c.fill(); }
  });
}
// The relief of the shell: the bump of its ribs, seams and labels, the gloss of
// its windows, the satin of its plastic and the matt of its paper. One for all.
function paintShellRelief(ctx) {
  const A = CAS.at, base = relief(120, 0.5), low = relief(60, 0.5);
  ctx.fillStyle = base; ctx.fillRect(0, 0, ...CAS.size);
  region(ctx, A.py, CAS.w, CAS.d, (c, w) => {
    c.fillStyle = low; c.fillRect(0, CAS.lip - 0.15, w, 0.5);
    for (const [x, y, rw, rh] of CAS.ribs) for (let i = 0; i * 1.75 < rw; i++) { c.fillStyle = relief(40, 0.55); c.fillRect(x + i * 1.75, y, 0.8, rh); c.fillStyle = relief(200, 0.4); c.fillRect(x + i * 1.75 + 0.8, y, 0.6, rh); }
    c.fillStyle = relief(170, 0.4); c.beginPath(); c.moveTo(93.5, 20); c.lineTo(99, 29); c.lineTo(88, 29); c.fill();
    c.fillStyle = low; for (let i = 0; i < 4; i++) c.fillRect(84, 33 + i * 2.2, 19, 0.9);
    for (const [x, y, ww, wh] of CAS.windows) { c.fillStyle = relief(165, 0.42); c.fillRect(x - 1.2, y - 1.2, ww + 2.4, wh + 2.4); }
    const [lx, ly, lw, lh] = CAS.label; c.fillStyle = low; c.fillRect(lx - 1, ly - 1, lw + 2, lh + 2);
  });
  const seam = (c, w, h) => { c.fillStyle = low; c.fillRect(0, h / 2 - 0.15, w, 0.35); };
  region(ctx, A.pz, CAS.w, CAS.h, (c, w, h) => {
    seam(c, w, h);
    const [sx, sy, sw, sh] = CAS.sticker; c.fillStyle = low; c.fillRect(sx - 0.8, sy - 0.8, sw + 1.6, sh + 1.6);
    c.fillStyle = relief(40, 0.5); c.fillRect(6, 15.5, 8.5, 6); c.fillStyle = base; c.fillRect(6.6, 16.1, 7.3, 4.8);
  });
  region(ctx, A.nz, CAS.w, CAS.h, (c, w, h) => { c.fillStyle = relief(30, 0.5); for (const x of [28, 151]) c.fillRect(x, h - 4.5, 8, 4.5); c.fillRect(0, h - 1.4, w, 0.3); });
  for (const [key, flapAt] of [['px', 1], ['nx', 0]]) region(ctx, A[key], CAS.d, CAS.h, (c, w, h) => {
    seam(c, w, h); c.fillStyle = low; c.fillRect((flapAt ? w - 22 : 22) - 0.2, 0, 0.4, h); c.fillRect(flapAt ? w - 15 : 9, 9.5, 6, 6);
  });
  grain(ctx, 0.07);
  // after the grain, what is smooth: the glass of the windows, and the paper
  region(ctx, A.py, CAS.w, CAS.d, (c) => {
    for (const [x, y, ww, wh] of CAS.windows) { c.fillStyle = relief(110, 0.3); c.fillRect(x, y, ww, wh); c.fillStyle = relief(120, 0.07); c.fillRect(x + 1, y + 1, ww - 2, wh - 2); }
    c.fillStyle = relief(132, 0.88); c.fillRect(...CAS.label);
  });
  region(ctx, A.pz, CAS.w, CAS.h, (c) => { c.fillStyle = relief(132, 0.88); c.fillRect(...CAS.sticker); });
}

// What is written on a label: by hand (a marker, a typewriter) on a ruled
// sticker, or printed, in the tape's own face and colours.
function writing(c, x, y, w, h, look, rnd, big) {
  const { text, face = 'marker', paper = '#f4efe4', ink = '#222', code } = look;
  const byHand = face === 'marker' || face === 'typewriter', font = fontOf(face);
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); c.translate(x, y);
  c.fillStyle = paper; c.fillRect(0, 0, w, h);
  specks(c, w, h, w * h * 0.25, rnd, { light: 0.1, dark: 0.07, size: 0.4 });
  c.textBaseline = 'middle';
  if (byHand) {
    const band = big ? 6 : 12; // a printed band, where the tape's length is
    c.fillStyle = ink; c.globalAlpha = 0.85; if (big) c.fillRect(0, 0, w, band); else c.fillRect(0, 0, band, h); c.globalAlpha = 1;
    if (code) {
      c.fillStyle = paper; c.textAlign = 'center';
      if (big) { c.font = `3.4px ${FONT_MONO}`; c.textAlign = 'left'; c.fillText(code, 3, band / 2 + 0.2); }
      else { c.save(); c.translate(band / 2, h / 2); c.rotate(-Math.PI / 2); fit(c, code, h - 3, 3.6, FONT_MONO); c.fillText(code, 0, 0.3); c.restore(); }
    }
    c.strokeStyle = ink; c.globalAlpha = 0.3; c.lineWidth = 0.2;
    const lines = big ? [18, 27, 36] : [h - 3.2];
    for (const ly of lines) { c.beginPath(); c.moveTo(big ? 4 : band + 3, ly); c.lineTo(w - 4, ly); c.stroke(); }
    c.globalAlpha = 1;
    const x0 = big ? 8 : band + 6, room = w - x0 - 8, size = big ? 12 : 12.5, base = big ? 12.5 + band / 2 + 5 : h / 2 - 0.4;
    c.fillStyle = face === 'marker' ? ink : '#1d1d22'; c.textAlign = 'left';
    if (face === 'marker') {
      c.translate(x0, base); c.rotate(-0.012 - rnd() * 0.02);
      fit(c, text, room, size, font);
      c.globalAlpha = 0.9; c.fillText(text, 0, 0); c.globalAlpha = 0.35; c.fillText(text, 0.18, 0.12); // the felt tip, pressed twice
    } else { // typed, each letter landing a little off
      const s = fit(c, text, room, size * 0.74, font); let cx = x0;
      for (const ch of text) { c.globalAlpha = 0.62 + rnd() * 0.38; c.fillText(ch, cx + (rnd() - 0.5) * 0.12, base + (rnd() - 0.5) * s * 0.05); cx += c.measureText(ch).width; }
    }
  } else {
    c.strokeStyle = ink; c.lineWidth = 0.35; c.globalAlpha = 0.7; c.strokeRect(1.4, 1.4, w - 2.8, h - 2.8); c.globalAlpha = 1;
    c.fillStyle = ink; c.textAlign = 'center';
    const s = fit(c, text, w - (big ? 24 : 40), (big ? 17 : 12.5) * (face === 'pixel' ? 0.6 : face === 'neon' ? 0.92 : 1.15), font);
    if (face === 'neon') { c.shadowColor = ink; c.shadowBlur = 6; }
    c.fillText(text, w / 2, h / 2 + s * 0.06 - (big ? 3 : 0)); c.shadowBlur = 0;
    if (code) { c.font = `${big ? 3.4 : 2.6}px ${FONT_MONO}`; c.globalAlpha = 0.75; if (big) c.fillText(code, w / 2, h - 7); else { c.textAlign = 'right'; c.fillText(code, w - 4, h - 3.6); } }
  }
  c.restore();
}
let _shell;
function cassetteMap(look, k, id) {
  if (!_shell) { [_shell] = sheet(CAS.size, 1); paintShell(_shell.getContext('2d')); }
  const [c, ctx] = sheet(CAS.size, k), rnd = rng(seedOf(id) + 1);
  ctx.drawImage(_shell, 0, 0, ...CAS.size);
  region(ctx, CAS.at.py, CAS.w, CAS.d, (cc) => writing(cc, ...CAS.label, look, rnd, true));
  region(ctx, CAS.at.pz, CAS.w, CAS.h, (cc) => writing(cc, ...CAS.sticker, look, rnd, false));
  return c;
}
const _relief = new Map();
function cassetteRelief(k, anisotropy) {
  if (!_relief.has(k)) { const [c, ctx] = sheet(CAS.size, k); paintShellRelief(ctx); _relief.set(k, texture(c, { srgb: false, anisotropy })); }
  return _relief.get(k);
}

// One VHS cassette: `look` is what its labels say ({ text, face, paper, ink, code }),
// `small` draws it at half size (a cassette that lives in a sleeve).
export function buildCassette(look, { lite = false, anisotropy = 8, small = false, id = look.text } = {}) {
  const k = (lite ? 0.5 : 1) * (small ? 0.5 : 1), rb = cassetteRelief(lite ? 0.5 : 1, anisotropy);
  const mat = new THREE.MeshStandardMaterial({ map: texture(cassetteMap(look, k, id), { anisotropy }), roughnessMap: rb, bumpMap: rb, bumpScale: 1.4, roughness: 1, metalness: 0 });
  const m = shadowed(new THREE.Mesh(cassetteGeometry(), mat)); m.name = 'cassette';
  return m;
}

// ─────────────────────────────────────────────────────────────
// The sleeve: card, printed, open at one short end. Each style
// is a different layout, not one template in other colours.
// ─────────────────────────────────────────────────────────────
const SLV = {
  w: 190, h: 28, d: 106, size: [1024, 512],
  at: { spine: [0, 0, 1024, 151], face: [0, 156, 640, 356], end: [648, 156, 320, 84], mouth: [648, 248, 320, 84] },
};
const _slvGeo = new Map();
function sleeveGeometry(len, open) {
  const key = `${len}:${open}`; if (_slvGeo.has(key)) return _slvGeo.get(key);
  const W = len * M, H = SLV.h * M, D = SLV.d * M, r = 1.2 * M, e = r * 0.2929, side = open > 0 ? 'px' : 'nx', box = boxOf(W, H, D), A = SLV.at;
  const rects = { pz: A.spine, nz: A.spine, py: A.face, ny: A.face, px: A.end, nx: A.end };
  const card = rbox(W, H, D, r, { open: [side] });
  // the inside: a tube of bare card as deep as the sleeve
  const inside = plate(side, [-(D / 2 - e), -(H / 2 - e), D / 2 - e, H / 2 - e], W / 2 - e, [{ u0: -(D / 2 - e), v0: -(H / 2 - e), u1: D / 2 - e, v1: H / 2 - e, depth: W - 2.5 * M, inset: 0.3 * M }]);
  const g = geometry([unwrap(card, rects, SLV.size, box), unwrap(inside, A.mouth, SLV.size, box, side)]);
  _slvGeo.set(key, g); return g;
}

const cut = (c, w, h) => { c.beginPath(); c.rect(0, 0, w, h); c.clip(); };
// d: { title, sub, code, font, colors: [card, mark, type, extra], rnd, theme }
const STYLES = {
  // lines of swell running the length of the card, a sun over them
  waves: {
    spine(c, w, h, d) {
      const [bg, line, type, extra = line] = d.colors;
      c.fillStyle = bg; c.fillRect(0, 0, w, h);
      c.lineWidth = 0.55;
      for (let i = 0; i < 5; i++) {
        c.strokeStyle = i % 2 ? extra : line; c.globalAlpha = 0.35 + i * 0.15; c.beginPath();
        for (let x = -2; x <= w + 2; x += 1) c.lineTo(x, 19 + i * 1.9 + Math.sin(x * 0.42 + i * 1.3) * (0.7 + i * 0.12));
        c.stroke();
      }
      c.globalAlpha = 1; c.fillStyle = type; c.textBaseline = 'middle'; c.textAlign = 'left';
      fit(c, d.title, 118, 13.5, d.font); c.fillText(d.title, 9, 10.2);
      c.fillStyle = extra; c.beginPath(); c.arc(w - 15, 10, 5.2, 0, 7); c.fill();
      c.fillStyle = bg; c.fillRect(w - 22, 10.6, 14, 0.7); c.fillRect(w - 22, 12.6, 14, 0.9);
      c.fillStyle = type; c.textAlign = 'right'; c.font = `2.9px ${FONT_MONO}`; c.fillText(d.code ?? '', w - 26, 6); c.globalAlpha = 0.75; c.fillText(d.sub ?? '', w - 26, 11);
    },
    face(c, w, h, d) {
      const [bg, line, type, extra = line] = d.colors;
      c.fillStyle = bg; c.fillRect(0, 0, w, h);
      c.fillStyle = extra; c.beginPath(); c.arc(w - 40, 40, 19, 0, 7); c.fill();
      for (let i = 0; i < 12; i++) {
        const y0 = 42 + i * 5.6; c.fillStyle = bg; c.beginPath(); c.moveTo(-2, h + 2);
        for (let x = -2; x <= w + 2; x += 1.5) c.lineTo(x, y0 + Math.sin(x * 0.11 + i * 1.7) * (1.6 + i * 0.5));
        c.lineTo(w + 2, h + 2); c.fill();
        c.strokeStyle = i % 3 ? line : extra; c.lineWidth = 0.5 + i * 0.06; c.globalAlpha = 0.4 + i * 0.05; c.beginPath();
        for (let x = -2; x <= w + 2; x += 1.5) c.lineTo(x, y0 + Math.sin(x * 0.11 + i * 1.7) * (1.6 + i * 0.5));
        c.stroke(); c.globalAlpha = 1;
      }
      c.fillStyle = type; c.textBaseline = 'middle'; c.textAlign = 'left'; fit(c, d.title, 120, 24, d.font); c.fillText(d.title, 10, 22);
      c.font = `4.2px ${FONT_MONO}`; c.globalAlpha = 0.8; c.fillText(d.sub ?? '', 11, 38); c.globalAlpha = 1;
    },
  },
  // a ring that closes on itself, cut by the edge of the card
  rings: {
    spine(c, w, h, d) {
      const [bg, ring, type, extra = ring] = d.colors;
      c.fillStyle = bg; c.fillRect(0, 0, w, h);
      for (const [r, lw, col] of [[19, 3.2, ring], [13.5, 2.2, extra], [8.5, 2.6, ring], [3.4, 1.6, type]]) { c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); c.arc(17, h / 2, r, 0.35, 6.1); c.stroke(); }
      c.fillStyle = type; c.textBaseline = 'middle'; c.textAlign = 'left';
      const s = fit(c, d.title, 104, 8.6, d.font); c.fillText(d.title, 43, 11.2 + s * 0.08);
      c.font = `2.8px ${FONT_MONO}`; c.globalAlpha = 0.8; c.fillText(d.sub ?? '', 43.4, 20.6); c.globalAlpha = 1;
      for (let i = 0; i < 3; i++) { c.fillStyle = [ring, extra, type][i]; c.beginPath(); c.arc(w - 11, 7 + i * 7, 2.1, 0, 7); c.fill(); }
      c.fillStyle = type; c.textAlign = 'right'; c.font = `2.9px ${FONT_MONO}`; c.fillText(d.code ?? '', w - 18, h / 2);
      c.fillRect(153, 4, 0.35, h - 8);
    },
    face(c, w, h, d) {
      const [bg, ring, type, extra = ring] = d.colors;
      c.fillStyle = bg; c.fillRect(0, 0, w, h);
      for (const [r, lw, col] of [[58, 9, ring], [43, 5, extra], [30, 7, ring], [16, 3, type]]) { c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); c.arc(62, h / 2 + 4, r, 0.5, 6.0); c.stroke(); }
      c.fillStyle = type; c.textBaseline = 'middle'; c.textAlign = 'right';
      fit(c, d.title, 70, 9, d.font); c.fillText(d.title, w - 9, 24);
      c.font = `3.6px ${FONT_MONO}`; c.globalAlpha = 0.8; c.fillText(d.sub ?? '', w - 9, 36); c.fillText(d.code ?? '', w - 9, h - 12); c.globalAlpha = 1;
      c.fillRect(w - 79, 30, 70, 0.4);
    },
  },
  // the name alone, as large as the card takes
  bigtype: {
    spine(c, w, h, d) {
      const [bg, type, dot, extra = type] = d.colors, t = d.title.toUpperCase();
      c.fillStyle = bg; c.fillRect(0, 0, w, h);
      c.fillStyle = type; c.textBaseline = 'alphabetic'; c.textAlign = 'left';
      c.font = `28.5px ${d.font}`; const tw = c.measureText(t).width, sx = Math.min(1.7, 150 / tw); // the capitals nearly as tall as the spine
      c.save(); c.translate(5, h - 2.7); c.scale(sx, 1); c.fillText(t, 0, 0); c.restore();
      c.fillStyle = extra; c.beginPath(); c.ellipse(w - 14, h / 2, 9.5, 7.2, 0, 0, 7); c.fill();
      c.fillStyle = dot; c.beginPath(); c.arc(w - 14, h / 2, 4.6, 0, 7); c.fill();
      c.fillStyle = bg; c.beginPath(); c.arc(w - 14, h / 2, 1.9, 0, 7); c.fill();
    },
    face(c, w, h, d) {
      const [bg, type, dot, extra = type] = d.colors, t = d.title.toUpperCase();
      c.fillStyle = bg; c.fillRect(0, 0, w, h);
      c.fillStyle = type; c.textBaseline = 'alphabetic'; c.textAlign = 'left';
      c.font = `64px ${d.font}`; const tw = c.measureText(t).width;
      c.save(); c.translate(-3, 62); c.scale((w + 8) / tw, 1.25); c.fillText(t, 0, 0); c.restore();
      c.fillStyle = extra; c.beginPath(); c.ellipse(w - 30, h - 22, 21, 15, 0, 0, 7); c.fill();
      c.fillStyle = dot; c.beginPath(); c.arc(w - 30, h - 22, 9.5, 0, 7); c.fill();
      c.fillStyle = bg; c.beginPath(); c.arc(w - 30, h - 22, 4, 0, 7); c.fill();
      c.fillStyle = type; c.textBaseline = 'middle'; c.font = `4.4px ${FONT_MONO}`; c.fillText(d.sub ?? '', 8, h - 24); c.globalAlpha = 0.75; c.fillText(d.code ?? '', 8, h - 15); c.globalAlpha = 1;
    },
  },
  // graph paper, and the name in a window cut out of it
  grid: {
    spine(c, w, h, d) {
      const [bg, line, type, extra = type] = d.colors;
      c.fillStyle = bg; c.fillRect(0, 0, w, h);
      c.strokeStyle = line; c.lineWidth = 0.14; c.globalAlpha = 0.55;
      for (let x = 1; x < w; x += 3.5) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); }
      for (let y = 0.25; y < h; y += 3.5) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
      c.globalAlpha = 1; c.textBaseline = 'middle'; c.textAlign = 'left';
      const s = fit(c, d.title, 110, 17, d.font), tw = c.measureText(d.title).width;
      c.fillStyle = bg; c.fillRect(8, 4.5, tw + 17, 19); c.strokeStyle = type; c.lineWidth = 0.4; c.strokeRect(8, 4.5, tw + 17, 19);
      c.fillStyle = type; c.fillText(d.title, 12, h / 2 - s * 0.02);
      c.fillStyle = extra; c.fillRect(13.5 + tw, 8.5, 5.5, 11); // the cursor
      const cw = 30; c.fillStyle = bg; c.fillRect(w - cw - 7, 7.75, cw, 12.5); c.strokeStyle = line; c.strokeRect(w - cw - 7, 7.75, cw, 12.5);
      c.fillStyle = type; c.textAlign = 'center'; c.font = `3.1px ${FONT_MONO}`; c.fillText(d.code ?? '', w - cw / 2 - 7, 11.4); c.globalAlpha = 0.75; fit(c, d.sub ?? '', cw - 3, 2.6, FONT_MONO); c.fillText(d.sub ?? '', w - cw / 2 - 7, 16.6); c.globalAlpha = 1;
    },
    face(c, w, h, d) {
      const [bg, line, type, extra = type] = d.colors, hz = 58;
      c.fillStyle = bg; c.fillRect(0, 0, w, h);
      c.strokeStyle = extra; c.lineWidth = 0.6; for (let i = 0; i < 9; i++) { const y = 20 + i * 4.2, half = Math.sqrt(Math.max(0, 22 * 22 - (y - 38) ** 2)); c.beginPath(); c.moveTo(w - 48 - half, y); c.lineTo(w - 48 + half, y); c.stroke(); } // a moon, in scan lines
      c.strokeStyle = line; c.lineWidth = 0.3; c.globalAlpha = 0.85; // the floor, running to the horizon
      for (let i = -14; i <= 14; i++) { c.beginPath(); c.moveTo(w / 2 + i * 3, hz); c.lineTo(w / 2 + i * 26, h); c.stroke(); }
      for (let i = 0; i < 9; i++) { const y = hz + (h - hz) * (i / 8) ** 2.1; c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
      c.globalAlpha = 1; c.textBaseline = 'middle'; c.textAlign = 'left';
      const s = fit(c, d.title, 96, 22, d.font), tw = c.measureText(d.title).width;
      c.fillStyle = bg; c.fillRect(8, 12, tw + 12, 24); c.strokeStyle = type; c.lineWidth = 0.45; c.strokeRect(8, 12, tw + 12, 24);
      c.fillStyle = type; c.fillText(d.title, 13, 24 - s * 0.02);
      c.font = `3.8px ${FONT_MONO}`; c.fillText(d.sub ?? '', 9, 43); c.globalAlpha = 0.75; c.fillText(d.code ?? '', 9, 50); c.globalAlpha = 1;
    },
  },
  // rays from a corner, and the name on a dark plate over them
  sunburst: {
    spine(c, w, h, d) {
      const [bg, ray, type, extra = ray] = d.colors;
      c.fillStyle = bg; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 20; i++) {
        const a0 = -0.03 - i * 0.079, a1 = a0 - 0.046; c.fillStyle = i % 2 ? extra : ray; c.globalAlpha = i % 3 === 2 ? 0.6 : 1;
        c.beginPath(); c.moveTo(-14, h + 8); c.lineTo(-14 + Math.cos(a0) * 300, h + 8 + Math.sin(a0) * 300); c.lineTo(-14 + Math.cos(a1) * 300, h + 8 + Math.sin(a1) * 300); c.fill();
      }
      c.globalAlpha = 1; c.fillStyle = bg; c.beginPath(); c.arc(-14, h + 8, 26, 0, 7); c.fill();
      c.textBaseline = 'middle'; c.textAlign = 'center';
      const s = fit(c, d.title, 104, 12.5, d.font), tw = c.measureText(d.title).width, px = 62, pw = tw + 14;
      c.fillStyle = bg; c.beginPath(); c.roundRect(px, 4.5, pw, 19, 9.5); c.fill();
      c.fillStyle = type; c.fillText(d.title, px + pw / 2, h / 2 + s * 0.05);
      c.fillStyle = bg; c.fillRect(w - 6, 0, 6, h);
      c.save(); c.translate(w - 2.9, h / 2); c.rotate(-Math.PI / 2); c.fillStyle = type; fit(c, `${d.code ?? ''}  ${d.sub ?? ''}`, h - 3, 2.5, FONT_MONO); c.fillText(`${d.code ?? ''}  ${d.sub ?? ''}`, 0, 0.2); c.restore();
    },
    face(c, w, h, d) {
      const [bg, ray, type, extra = ray] = d.colors;
      c.fillStyle = bg; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 22; i++) {
        const a0 = -Math.PI * (i / 22), a1 = a0 - Math.PI / 44; c.fillStyle = i % 2 ? extra : ray; c.globalAlpha = i % 3 === 2 ? 0.6 : 1;
        c.beginPath(); c.moveTo(w / 2, h + 6); c.lineTo(w / 2 + Math.cos(a0) * 240, h + 6 + Math.sin(a0) * 240); c.lineTo(w / 2 + Math.cos(a1) * 240, h + 6 + Math.sin(a1) * 240); c.fill();
      }
      c.globalAlpha = 1; c.fillStyle = bg; c.beginPath(); c.arc(w / 2, h + 6, 40, 0, 7); c.fill();
      c.fillStyle = type; c.beginPath(); c.arc(w / 2, h + 6, 33, 0, 7); c.fill();
      c.textBaseline = 'middle'; c.textAlign = 'center';
      const s = fit(c, d.title, 130, 19, d.font), tw = c.measureText(d.title).width;
      c.fillStyle = bg; c.beginPath(); c.roundRect(w / 2 - tw / 2 - 10, 14, tw + 20, 30, 15); c.fill();
      c.fillStyle = type; c.fillText(d.title, w / 2, 29 + s * 0.05);
      c.fillStyle = bg; c.font = `3.8px ${FONT_MONO}`; c.fillText(d.sub ?? '', w / 2, h - 13); c.fillText(d.code ?? '', w / 2, h - 6.5);
    },
  },
  // an index card: typed small, ruled, with a row of colour tabs
  smalltype: {
    spine(c, w, h, d) {
      const [bg, ink, ...tabs] = d.colors;
      c.fillStyle = bg; c.fillRect(0, 0, w, h);
      tabs.forEach((t, i) => { c.fillStyle = t; c.fillRect(0, (h / tabs.length) * i, 7.5, h / tabs.length + 0.2); });
      c.fillStyle = ink; c.fillRect(12, 7.2, w - 20, 0.3); c.fillRect(12, 20.6, w - 20, 0.3); c.fillRect(w - 44, 7.2, 0.3, 13.4);
      c.textBaseline = 'middle'; c.textAlign = 'left';
      const s = fit(c, d.title, 108, 8.2, d.font); let x = 13.5;
      for (const ch of d.title) { c.globalAlpha = 0.7 + d.rnd() * 0.3; c.fillText(ch, x, 14.4 + (d.rnd() - 0.5) * s * 0.05); x += c.measureText(ch).width; }
      c.globalAlpha = 0.8; c.font = `2.5px ${FONT_MONO}`; c.fillText(d.sub ?? '', 13.5, 4.2);
      c.textAlign = 'center'; c.font = `4.6px ${FONT_MONO}`; c.globalAlpha = 0.9; c.fillText(d.code ?? '', w - 26, 14.2); c.globalAlpha = 1;
    },
    face(c, w, h, d) {
      const [bg, ink, ...tabs] = d.colors;
      c.fillStyle = bg; c.fillRect(0, 0, w, h);
      tabs.forEach((t, i) => { c.fillStyle = t; c.fillRect((w / tabs.length) * i, 0, w / tabs.length + 0.2, 6); });
      c.fillStyle = ink; for (let i = 0; i < 6; i++) c.fillRect(12, 34 + i * 11, w - 24, 0.3);
      c.fillRect(46, 34, 0.3, 55);
      c.textBaseline = 'middle'; c.textAlign = 'left';
      const s = fit(c, d.title, w - 30, 12, d.font); let x = 13;
      for (const ch of d.title) { c.globalAlpha = 0.7 + d.rnd() * 0.3; c.fillText(ch, x, 21 + (d.rnd() - 0.5) * s * 0.05); x += c.measureText(ch).width; }
      c.globalAlpha = 0.85; c.font = `4.4px ${d.font}`; c.fillText(d.code ?? '', 14, 40); c.fillText(d.sub ?? '', 50, 40); c.globalAlpha = 1;
    },
  },
};
function sleeveMap(def, k) {
  const sl = def.sleeve, sp = def.spine ?? { text: def.label }, style = STYLES[sl.style] ?? STYLES.smalltype, rnd = rng(seedOf(def.id) + 7), A = SLV.at;
  const d = { title: sp.text, sub: sl.sub, code: sp.code, font: fontOf(sl.face ?? sp.face), colors: sl.colors ?? [sp.paper ?? '#e9e4d8', sp.ink ?? '#222', sp.ink ?? '#222'], rnd };
  const card = sl.card ?? '226,218,202', [c, ctx] = sheet(SLV.size, k);
  ctx.fillStyle = d.colors[0]; ctx.fillRect(0, 0, ...SLV.size);
  const finish = (cc, w, h, n) => { specks(cc, w, h, w * h * 0.12, rnd, { light: 0.06, dark: 0.07, size: 0.45 }); rim(cc, w, h); wear(cc, w, h, rnd, { color: card, n }); };
  region(ctx, A.spine, SLV.w, SLV.h, (cc, w, h) => { cc.save(); cut(cc, w, h); style.spine(cc, w, h, d); cc.restore(); finish(cc, w, h, 1); });
  region(ctx, A.face, SLV.w, SLV.d, (cc, w, h) => { cc.save(); cut(cc, w, h); style.face(cc, w, h, d); cc.restore(); finish(cc, w, h, 0.8); });
  region(ctx, A.end, SLV.d, SLV.h, (cc, w, h) => { // the closed end: the card's colour, the tape's length
    cc.fillStyle = d.colors[0]; cc.fillRect(-2, -2, w + 4, h + 4);
    cc.fillStyle = d.colors[1]; cc.fillRect(0, h - 5, w, 1.2);
    cc.fillStyle = d.colors[2] ?? d.colors[1]; cc.textBaseline = 'middle'; cc.textAlign = 'center'; cc.font = `7px ${FONT_MONO}`; cc.fillText(sp.code ?? '', w / 2, h / 2 - 2);
    finish(cc, w, h, 1.2);
  });
  region(ctx, A.mouth, SLV.d, SLV.h, (cc, w, h) => { // the open end: bare card round the mouth, dark inside
    cc.fillStyle = '#2a2622'; cc.fillRect(-2, -2, w + 4, h + 4);
    cc.strokeStyle = '#8f8676'; cc.lineWidth = 1.6; cc.strokeRect(0, 0, w, h);
    cc.fillStyle = '#0c0b0a'; cc.fillRect(4, 3, w - 8, h - 6);
  });
  return c;
}
let _card;
function cardGrain() { // the fibre of the card, a bump shared by every sleeve
  if (!_card) {
    const [c, ctx] = sheet([128, 128]); ctx.fillStyle = relief(110, 1); ctx.fillRect(0, 0, 128, 128); grain(ctx, 0.2);
    _card = texture(c, { srgb: false, anisotropy: 1 }); _card.wrapS = _card.wrapT = THREE.RepeatWrapping; _card.repeat.set(6, 3);
  }
  return _card;
}
// One sleeve for the tape `def` (its `sleeve` and `spine`), `len` mm long, open toward +x or -x.
export function buildSleeve(def, { lite = false, anisotropy = 8, len = SLV.w, open = -1 } = {}) {
  const gloss = def.sleeve.finish === 'gloss';
  const mat = new THREE.MeshStandardMaterial({ map: texture(sleeveMap(def, lite ? 0.5 : 1), { anisotropy }), roughness: gloss ? 0.42 : 0.86, metalness: 0, bumpMap: cardGrain(), bumpScale: gloss ? 0.25 : 0.6 });
  const m = shadowed(new THREE.Mesh(sleeveGeometry(len, open), mat)); m.name = 'sleeve';
  return m;
}

// ─────────────────────────────────────────────────────────────
// The stack: piles side by side, nothing squared up, and the way
// a cassette travels to the VCR and back.
// ─────────────────────────────────────────────────────────────
// `tapes` is config.tapes; `stack` says who lies on whom ({ piles: [[ids, from the bottom]], gap });
// a tape in no pile goes on the shortest. Returns a group named `tapes`: its origin is on the desk,
// midway between the piles, which stand side by side along x; the spines look toward +z. It holds
// one Object3D named `tape_<id>` for each tape (its own origin is the middle of its spine), with
// in its userData:
//   cassette            the part that travels
//   load(vcr, done)     the cassette leaves its sleeve (the sleeve stays in the pile), rises, flies to
//                       the front of the VCR's slot and goes in; `done` when it is inside
//   unload(done)        and back the same way
// The group's userData.update(t) moves them with the room's clock.
// `open` is the side each pile's sleeves open to (-1 is -x, 1 is +x), one number for all or one a
// pile; left out, the first pile opens to -x and the last to +x, away from each other. A cassette
// needs 0.21 m of free desk on that side to slide out. On its way it keeps above every pile it
// crosses, and it reaches the slot from the front, so a shelf over the VCR is not in its way.
export function buildTapeStack(tapes, stack = {}, { lite = false, anisotropy = 8, open } = {}) {
  const g = new THREE.Group(); g.name = 'tapes';
  const byId = new Map(tapes.map((t) => [t.id, t]));
  const piles = (stack.piles ?? [[], []]).map((p) => p.filter((id) => byId.has(id)));
  const placed = new Set(piles.flat());
  for (const t of tapes) if (!placed.has(t.id)) piles.reduce((a, b) => (b.length < a.length ? b : a)).push(t.id);
  const pitch = SLV.w * M + (stack.gap ?? 0.03), items = [], tops = [];
  const side = (pi) => (Array.isArray(open) ? open[pi] : open) ?? (pi === piles.length - 1 && pi > 0 ? 1 : -1);
  piles.forEach((ids, pi) => {
    const pr = rng(seedOf(`pile${pi}`)), x0 = (pi - (piles.length - 1) / 2) * pitch, z0 = (pr() - 0.5) * 0.03, yaw0 = (pr() - 0.5) * 0.12, dir = side(pi);
    let top = 0;
    ids.forEach((id, i) => {
      const def = byId.get(id), r = rng(seedOf(id)), bare = !def.sleeve, loose = bare && i === ids.length - 1 && i > 0;
      const look = { text: def.label, ...def.spine };
      const tape = new THREE.Group(); tape.name = `tape_${id}`;
      const cas = buildCassette(look, { lite, anisotropy, small: !bare, id }); tape.add(cas);
      const len = SLV.w - 1 + Math.round(r() * 9) / 2;
      const back = (bare ? CAS.d : SLV.d) * M / 2; cas.position.z = -back; // the tape's origin is the middle of its spine: what the visitor sees, and clicks
      if (!bare) { const sleeve = buildSleeve(def, { lite, anisotropy, len, open: dir }); sleeve.position.z = -back; tape.add(sleeve); cas.position.x = dir * ((len - CAS.w) / 2 - 0.4 - r() * 2.2) * M; } // its end at the sleeve's mouth, or a little inside
      const cx = x0 + (r() - 0.5) * (loose ? 0.03 : 0.013), cz = z0 + (r() - 0.5) * 0.016 + (loose ? 0.004 + r() * 0.01 : 0);
      const yaw = yaw0 + (r() - 0.5) * 0.15 + (loose ? (r() < 0.5 ? -1 : 1) * (0.1 + r() * 0.1) : 0);
      tape.rotation.y = yaw; tape.position.set(cx + Math.sin(yaw) * back, 0, cz + Math.cos(yaw) * back);
      g.add(tape);
      const it = { tape, cas, bare, pile: pi, thick: (bare ? CAS.h : SLV.h) * M, k: 0, to: 0, door: 0, done: null, vcr: null, cruise: 0,
        home: cas.position.clone(), out: new THREE.Vector3(), a: new THREE.Vector3(), b: new THREE.Vector3(), c: new THREE.Vector3(), m: new THREE.Matrix4(), q2: new THREE.Quaternion() };
      it.out.copy(it.home); if (bare) it.out.y += 0.03; else it.out.x += dir * (len + 12) * M;
      top += it.thick;
      tape.userData.cassette = cas;
      tape.userData.load = (vcr, done) => {
        g.updateWorldMatrix(true, true); vcr.updateWorldMatrix(true, false);
        const slot = vcr.userData.slot ?? new THREE.Vector3(0, 0.02, 0.16), inv = _m.copy(vcr.matrixWorld).invert();
        it.m.copy(tape.matrixWorld).invert().multiply(vcr.matrixWorld);          // from the VCR's space to the tape's
        it.m.decompose(_v, it.q2, _s);
        it.a.copy(it.out).applyMatrix4(tape.matrixWorld).applyMatrix4(inv);       // where it leaves the pile, in the VCR's space
        it.b.copy(slot); it.b.z += CAS.d * M / 2 + 0.02;                          // in front of the slot
        it.c.copy(slot); it.c.z -= CAS.d * M / 2 + 0.012;                         // and inside
        // how high it must fly: over the piles between it and the slot
        const ax = _v.copy(it.out).applyMatrix4(tape.matrix).x, bx = _v.copy(it.b).applyMatrix4(vcr.matrixWorld).applyMatrix4(_m2.copy(g.matrixWorld).invert()).x;
        const half = CAS.w * M / 2, reach = SLV.w * M / 2 + 0.008; let over = 0;
        tops.forEach((h, j) => { const x = (j - (piles.length - 1) / 2) * pitch; if (Math.max(ax, bx) + half > x - reach && Math.min(ax, bx) - half < x + reach) over = Math.max(over, h); });
        const clear = _v.set(0, over + CAS.h * M / 2 + 0.03, 0).applyMatrix4(g.matrixWorld).applyMatrix4(inv).y;
        it.cruise = Math.max(clear, it.a.y + 0.02, it.b.y + 0.02);
        it.vcr = vcr; it.to = 1; it.done = done; cas.visible = true;
        if (still) it.k = 0.999;
      };
      tape.userData.unload = (done) => { it.to = 0; it.done = done; cas.visible = true; if (still) it.k = 0.001; };
      items.push(it);
    });
    tops.push(top);
  });
  const A = 0.2, B = 0.76, LOAD = 1.5; // the legs of the trip: out of the sleeve, across, in; and its seconds
  function pose(it) {
    const { k, cas, a, b } = it;
    if (k < A) { cas.position.lerpVectors(it.home, it.out, S(k / A)); cas.quaternion.identity(); }
    else if (k < B) { // in the VCR's space: up and to the slot's depth first, then along its face and down to the slot
      const s = (k - A) / (B - A), sx = S(clamp((s - 0.15) / 0.85)), sz = S(clamp(s / 0.5));
      const y = s < 0.5 ? a.y + (it.cruise - a.y) * S(clamp(s / 0.4)) : it.cruise + (b.y - it.cruise) * S(clamp((s - 0.55) / 0.45));
      cas.position.set(a.x + (b.x - a.x) * sx, y, a.z + (b.z - a.z) * sz).applyMatrix4(it.m);
      cas.quaternion.identity().slerp(it.q2, sx);
    } else { cas.position.lerpVectors(b, it.c, S((k - B) / (1 - B))).applyMatrix4(it.m); cas.quaternion.copy(it.q2); }
    it.door = S(clamp((k - (B - 0.08)) / 0.08)) * (1 - S(clamp((k - 0.94) / 0.06))); // the slot's flap gives way, and falls shut behind
  }
  function settle() { // a pile closes up when a bare cassette leaves it
    const y = piles.map(() => 0);
    for (const it of items) { it.tape.position.y = y[it.pile] + it.thick / 2; y[it.pile] += it.thick * (it.bare ? 1 - S(clamp(it.k / A)) : 1); }
  }
  settle();
  g.userData.size = [piles.length * pitch + 0.02, Math.max(...tops), SLV.d * M + 0.04]; // about what it takes of the desk, and how tall it stands
  let last = null;
  g.userData.update = (t) => {
    const dt = last == null ? 0 : clamp(t - last, 0, 0.1); last = t;
    let moved = false, door = 0, vcr = null;
    for (const it of items) {
      if (it.k === it.to) continue;
      it.k = it.to > it.k ? Math.min(1, it.k + dt / LOAD) : Math.max(0, it.k - dt / LOAD);
      pose(it); moved = true; door = Math.max(door, it.door); vcr = it.vcr;
      if (it.k === it.to) { if (it.k === 1) it.cas.visible = false; const done = it.done; it.done = null; done?.(); }
    }
    if (moved) { settle(); vcr?.userData.setDoor?.(door); }
  };
  return g;
}
const _v = new THREE.Vector3(), _s = new THREE.Vector3(), _m = new THREE.Matrix4(), _m2 = new THREE.Matrix4();

// ─────────────────────────────────────────────────────────────
// The VCR. Its origin is under its middle, on the desk; its
// front looks toward +z.
// ─────────────────────────────────────────────────────────────
const VCR = {
  w: 430, h: 90, d: 300, foot: 7, fh: 83, fd: 14,
  slot: [26, 12, 192, 32], display: [246, 12, 158, 32], groove: 52,   // on the fascia, from its top left corner
  keys: { x: 250, y: 60, w: 20, h: 9, pitch: 26 }, led: [414, 28],
  size: [2048, 768],
  at: { front: [4, 4, 1978, 382], top: [4, 392, 548, 371], side: [560, 392, 371, 102], back: [940, 392, 548, 102], door: [560, 502, 874, 143],
    trim: [1500, 392, 200, 40], key: [1500, 440, 160, 72], foot: [1500, 520, 40, 40], under: [1560, 520, 40, 40] },
};
const SEG = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abfgcd' };
function digits(c, text, x, y, w, h, t, ghost) { // a seven-segment clock
  for (const ch of text) {
    if (ch === ':') { if (!ghost) { c.fillRect(x + t * 0.4, y + h * 0.28, t * 1.1, t * 1.1); c.fillRect(x + t * 0.1, y + h * 0.68, t * 1.1, t * 1.1); } x += t * 3.2; continue; }
    const on = ghost ? SEG[8] : SEG[ch] ?? '', m = h / 2;
    c.save(); c.transform(1, 0, -0.07, 1, x + 0.07 * (y + h), 0);
    if (on.includes('a')) c.fillRect(t * 1.15, y, w - t * 2.3, t);
    if (on.includes('g')) c.fillRect(t * 1.15, y + m - t / 2, w - t * 2.3, t);
    if (on.includes('d')) c.fillRect(t * 1.15, y + h - t, w - t * 2.3, t);
    if (on.includes('f')) c.fillRect(0, y + t * 0.6, t, m - t * 1.2);
    if (on.includes('b')) c.fillRect(w - t, y + t * 0.6, t, m - t * 1.2);
    if (on.includes('e')) c.fillRect(0, y + m + t * 0.6, t, m - t * 1.2);
    if (on.includes('c')) c.fillRect(w - t, y + m + t * 0.6, t, m - t * 1.2);
    c.restore(); x += w + t * 1.6;
  }
}
const GLOW = '#8dffe0'; // the display's phosphor
function lit(c, deck, ghost) { // what is lit behind the display's glass
  const [dx, dy, dw, dh] = VCR.display;
  c.fillStyle = ghost ? 'rgba(120,200,180,0.07)' : GLOW;
  digits(c, deck.clock ?? '', dx + 14, dy + 7.5, 10.5, 17, 1.9, ghost);
  c.textBaseline = 'middle'; c.textAlign = 'left'; c.font = `4.2px ${FONT_MONO}`;
  (deck.lit ?? []).forEach((word, i) => { if (ghost || i === 0) c.fillText(word, dx + 92, dy + 10 + i * 6.4); });
  for (let i = 0; i < 9; i++) if (ghost || i < 3) c.fillRect(dx + 118 + i * 3.6, dy + dh - 9 - i * 1.4, 2.4, 3 + i * 1.4); // a level, low
}
function paintVCR(ctx, deck) {
  const rnd = rng(17), A = VCR.at, FW = VCR.w, FH = VCR.fh;
  ctx.fillStyle = '#17171a'; ctx.fillRect(0, 0, ...VCR.size);
  region(ctx, A.front, FW, FH, (c, w, h) => {
    c.fillStyle = '#101012'; c.fillRect(-2, -2, w + 4, VCR.groove + 2);              // the upper band, glossy
    const g = c.createLinearGradient(0, VCR.groove, 0, h); g.addColorStop(0, '#35353b'); g.addColorStop(1, '#26262b');
    c.fillStyle = g; c.fillRect(-2, VCR.groove, w + 4, h);                            // the lower, brushed
    for (let i = 0; i < 520; i++) { c.fillStyle = `rgba(255,255,255,${0.02 + rnd() * 0.035})`; c.fillRect(rnd() * w, VCR.groove + rnd() * (h - VCR.groove), 20 + rnd() * 90, 0.12); }
    specks(c, w, h, 700, rnd, { light: 0.05, dark: 0.2 });
    c.fillStyle = '#050506'; c.fillRect(0, VCR.groove - 0.4, w, 0.8); c.fillStyle = 'rgba(255,255,255,0.1)'; c.fillRect(0, VCR.groove + 0.4, w, 0.25);
    const [sx, sy, sw, sh] = VCR.slot; c.fillStyle = '#020203'; c.fillRect(sx - 0.6, sy - 0.6, sw + 1.2, sh + 1.2); // the slot: dark inside
    c.strokeStyle = 'rgba(255,255,255,0.09)'; c.lineWidth = 0.3; c.strokeRect(sx - 1.6, sy - 1.6, sw + 3.2, sh + 3.2);
    const [dx, dy, dw, dh] = VCR.display; c.fillStyle = '#030405'; c.fillRect(dx, dy, dw, dh);                       // the display's smoked glass
    c.strokeStyle = 'rgba(255,255,255,0.08)'; c.strokeRect(dx - 1, dy - 1, dw + 2, dh + 2);
    lit(c, deck, true);
    c.save(); c.globalAlpha = 0.5; lit(c, deck, false); c.restore(); // unlit, the segments that are on show a little; their light is the `vcr_led` mesh
    const sheen = c.createLinearGradient(dx, dy, dx + dw, dy + dh); sheen.addColorStop(0.3, 'rgba(255,255,255,0)'); sheen.addColorStop(0.45, 'rgba(255,255,255,0.05)'); sheen.addColorStop(0.6, 'rgba(255,255,255,0)');
    c.fillStyle = sheen; c.fillRect(dx, dy, dw, dh);
    c.fillStyle = '#c9c9d0'; c.textBaseline = 'middle'; c.textAlign = 'left';                                        // the brand plate
    c.font = `10px ${FONT_TITLE}`; let bx = sx + 1; for (const ch of deck.brand ?? '') { c.fillText(ch, bx, 67.5); bx += c.measureText(ch).width + 1.5; }
    c.fillStyle = '#8d8d96'; c.font = `3px ${FONT_MONO}`; c.fillText(deck.model ?? '', bx + 5, 65); c.fillText(deck.badge ?? '', bx + 5, 70.2);
    c.textAlign = 'right'; c.fillText(deck.line ?? '', sx + sw, 67.6);
    const K = VCR.keys; c.textAlign = 'center'; c.font = `2.5px ${FONT_MONO}`;
    (deck.keys ?? []).forEach((word, i) => {
      const kx = K.x + i * K.pitch; c.fillStyle = '#050506'; c.fillRect(kx - 0.5, K.y - 0.5, K.w + 1, K.h + 1);       // the key's seat
      c.fillStyle = i === (deck.keys.length - 1) ? '#d05a4a' : '#9a9aa4'; c.fillText(word, kx + K.w / 2, K.y + K.h + 4.6);
    });
    const [lx, ly] = VCR.led; c.fillStyle = '#050506'; c.beginPath(); c.arc(lx, ly, 2.6, 0, 7); c.fill();
    c.fillStyle = '#8d8d96'; c.font = `2.3px ${FONT_MONO}`; c.fillText(deck.led ?? '', lx, ly + 6.5);
    wear(c, w, h, rnd, { color: '110,110,118', n: 0.25, corners: 0.5 });
  });
  region(ctx, A.top, 428, 290, (c, w, h) => { // the cover, from above: painted steel, vents at the back
    c.fillStyle = '#19191c'; c.fillRect(-2, -2, w + 4, h + 4);
    specks(c, w, h, 1600, rnd, { light: 0.06, dark: 0.22, size: 1.6 });
    for (const x0 of [40, 268]) for (let i = 0; i < 14; i++) { c.fillStyle = '#040405'; c.fillRect(x0 + i * 8.6, 26, 3.6, 62); c.fillStyle = 'rgba(255,255,255,0.07)'; c.fillRect(x0 + i * 8.6 + 3.6, 26, 0.8, 62); }
    c.fillStyle = '#0a0a0b'; for (const [x, y] of [[10, 10], [w - 10, 10], [10, h - 30], [w - 10, h - 30]]) { c.beginPath(); c.arc(x, y, 2.6, 0, 7); c.fill(); }
    const dust = c.createLinearGradient(0, 0, 0, h); dust.addColorStop(0, 'rgba(180,170,150,0.07)'); dust.addColorStop(1, 'rgba(180,170,150,0)'); c.fillStyle = dust; c.fillRect(0, 0, w, h);
  });
  for (const key of ['side', 'back']) region(ctx, A[key], key === 'side' ? 290 : 428, 80, (c, w, h) => {
    c.fillStyle = '#18181b'; c.fillRect(-2, -2, w + 4, h + 4); specks(c, w, h, 300, rnd, { light: 0.06, dark: 0.2, size: 1.4 });
    c.fillStyle = '#0a0a0b'; for (const x of [14, w - 14]) { c.beginPath(); c.arc(x, h - 12, 2.6, 0, 7); c.fill(); }
  });
  region(ctx, A.door, 191, 31, (c, w, h) => { // the slot's flap
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#1c1c20'); g.addColorStop(0.5, '#121214'); g.addColorStop(1, '#19191c');
    c.fillStyle = g; c.fillRect(-2, -2, w + 4, h + 4);
    specks(c, w, h, 240, rnd, { light: 0.06, dark: 0.2 });
    c.fillStyle = 'rgba(255,255,255,0.07)'; c.fillRect(6, h - 6, w - 12, 0.3); c.fillRect(6, 5, w - 12, 0.3);
    c.fillStyle = '#74747c'; c.textBaseline = 'middle'; c.textAlign = 'center'; c.font = `3px ${FONT_MONO}`; c.fillText(deck.flap ?? '', w / 2, h / 2);
  });
  const fill = (rect, col) => { ctx.fillStyle = col; ctx.fillRect(rect[0] - 2, rect[1] - 2, rect[2] + 4, rect[3] + 4); };
  fill(A.trim, '#1b1b1e'); fill(A.foot, '#0c0c0d'); fill(A.under, '#0e0e10');
  region(ctx, A.key, 20, 9, (c, w, h) => { // a key: lighter on top, a line where the finger goes
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#4a4a52'); g.addColorStop(1, '#2e2e34'); c.fillStyle = g; c.fillRect(-1, -1, w + 2, h + 2);
    c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(4, h / 2 - 0.25, w - 8, 0.5);
  });
}
function paintVCRRelief(ctx) {
  const A = VCR.at, FW = VCR.w, FH = VCR.fh, steel = relief(120, 0.6, 0.12);
  ctx.fillStyle = steel; ctx.fillRect(0, 0, ...VCR.size);
  region(ctx, A.top, 428, 290, (c) => { for (const x0 of [40, 268]) for (let i = 0; i < 14; i++) { c.fillStyle = relief(20, 0.7, 0.3); c.fillRect(x0 + i * 8.6, 26, 3.6, 62); } });
  region(ctx, A.front, FW, FH, (c, w, h) => {
    c.fillStyle = relief(120, 0.2, 0); c.fillRect(-2, -2, w + 4, VCR.groove + 2);
    c.fillStyle = relief(120, 0.42, 0.15); c.fillRect(-2, VCR.groove, w + 4, h);
    const r = rng(5); for (let i = 0; i < 700; i++) { c.fillStyle = relief(90 + r() * 70, 0.42, 0.15); c.fillRect(r() * w, VCR.groove + r() * (h - VCR.groove), 20 + r() * 90, 0.14); }
    c.fillStyle = relief(40, 0.5, 0); c.fillRect(0, VCR.groove - 0.4, w, 0.8);
    const K = VCR.keys; for (let i = 0; i < 6; i++) c.fillRect(K.x + i * K.pitch - 0.5, K.y - 0.5, K.w + 1, K.h + 1);
  });
  for (const key of ['door', 'trim']) { ctx.fillStyle = relief(120, 0.24, 0); ctx.fillRect(A[key][0] - 2, A[key][1] - 2, A[key][2] + 4, A[key][3] + 4); }
  ctx.fillStyle = relief(120, 0.38, 0); ctx.fillRect(A.key[0] - 2, A.key[1] - 2, A.key[2] + 4, A.key[3] + 4);
  ctx.fillStyle = relief(120, 0.9, 0); ctx.fillRect(A.foot[0] - 2, A.foot[1] - 2, A.foot[2] + 4, A.foot[3] + 4);
  grain(ctx, 0.1);
  region(ctx, A.front, FW, FH, (c) => { c.fillStyle = relief(120, 0.1, 0); c.fillRect(...VCR.display); }); // the display's glass
}

// `deck` is config.deck: the made-up brand, the words on the fascia, the clock.
// Returns a group named `vcr`: its origin is on the desk under its middle (between its feet), its
// front looks toward +z. Three meshes: the body, the slot's flap `vcr_door`, and `vcr_led`, all that
// is lit (the clock behind the display's glass and the power LED). In its userData:
//   size        [width, height, depth] in metres, feet included
//   slot        the middle of the slot's mouth, in the group's space
//   setDoor(k)  the flap: 0 shut, 1 tilted in
//   update(t)   the clock that nobody set, blinking with the room's clock
export function buildVCR(deck = {}, { lite = false, anisotropy = 8 } = {}) {
  const k = lite ? 0.5 : 1, A = VCR.at, size = VCR.size;
  const W = VCR.w * M, D = VCR.d * M, foot = VCR.foot * M, FH = VCR.fh * M, FD = VCR.fd * M, yc = foot + FH / 2, zf = D / 2;
  const g = new THREE.Group(); g.name = 'vcr';
  // the cover, of painted steel
  const cw = 428 * M, ch = 80 * M, cd = 290 * M;
  const cover = shift(unwrap(rbox(cw, ch, cd, 2.5 * M, { open: ['pz'] }), { px: A.side, nx: A.side, py: A.top, ny: A.under, nz: A.back, pz: A.under }, size, boxOf(cw, ch, cd)), 0, foot + 1.5 * M + ch / 2, -(D - cd) / 2);
  // the fascia, with the slot and the display sunk into it
  const fb = boxOf(W, FH, FD), r = 2 * M;
  const well = ([x, y, w, h], depth, inset) => ({ u0: x * M - W / 2, u1: (x + w) * M - W / 2, v0: FH / 2 - (y + h) * M, v1: FH / 2 - y * M, depth, inset });
  const front = { px: A.trim, nx: A.trim, py: A.trim, ny: A.trim, pz: A.front, nz: A.under };
  const fascia = [unwrap(rbox(W, FH, FD, r, { cut: ['pz'], open: ['nz'] }), front, size, fb),
    unwrap(plate('pz', [-(W / 2 - r), -(FH / 2 - r), W / 2 - r, FH / 2 - r], FD / 2, [well(VCR.slot, 0.16, 0), well(VCR.display, 1.4 * M, 1 * M)]), front, size, fb, 'pz')];
  for (const p of fascia) shift(p, 0, yc, zf - FD / 2);
  // the keys, and the feet
  const K = VCR.keys, kb = boxOf(K.w * M, K.h * M, 4.4 * M), parts = [cover, ...fascia];
  for (let i = 0; i < (deck.keys?.length ?? 6); i++) parts.push(shift(unwrap(rbox(K.w * M, K.h * M, 4.4 * M, 1 * M, { open: ['nz'] }), A.key, size, kb), (K.x + i * K.pitch + K.w / 2) * M - W / 2, foot + FH - (K.y + K.h / 2) * M, zf));
  const fg = new THREE.CylinderGeometry(15 * M, 13 * M, foot, 10, 1), fbx = boxOf(30 * M, foot, 30 * M);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) parts.push(shift(unwrap(fromGeometry(fg), A.foot, size, fbx), sx * 180 * M, foot / 2, sz * 118 * M));
  fg.dispose();
  const maps = sheet(size, k), rb = sheet(size, k / 2);
  paintVCR(maps[1], deck); paintVCRRelief(rb[1]);
  const rbt = texture(rb[0], { srgb: false, anisotropy });
  const mat = new THREE.MeshStandardMaterial({ map: texture(maps[0], { anisotropy }), roughnessMap: rbt, metalnessMap: rbt, bumpMap: rbt, bumpScale: 1.2, roughness: 1, metalness: 1 });
  const body = shadowed(new THREE.Mesh(geometry(parts), mat)); g.add(body);
  // the slot's flap, hung by its top edge a little behind the fascia's face
  const [sx, sy, sw, sh] = VCR.slot, dw = 191 * M, dh = 31 * M, dt = 2.4 * M;
  const door = shadowed(new THREE.Mesh(geometry([shift(unwrap(rbox(dw, dh, dt, 0.8 * M), { px: A.trim, nx: A.trim, py: A.trim, ny: A.trim, pz: A.door, nz: A.trim }, size, boxOf(dw, dh, dt)), 0, -dh / 2, -dt / 2)]), mat));
  door.name = 'vcr_door'; door.position.set((sx + sw / 2) * M - W / 2, foot + FH - (sy + 0.5) * M, zf - 0.8 * M); g.add(door);
  // what is lit: the clock and the power LED, two small quads of light added over the fascia
  const [dx, dy, dwd, dhd] = VCR.display, [lx, ly] = VCR.led, L = [dx, dy, lx + 5 - dx, dhd], px = 4 * k; // the strip of the fascia they are drawn on, mm
  const [lc, lctx] = sheet([L[2] * px, L[3] * px]);
  lctx.fillStyle = '#000'; lctx.fillRect(0, 0, L[2] * px, L[3] * px); lctx.scale(px, px); lctx.translate(-dx, -dy); lit(lctx, deck, false);
  const halo = lctx.createRadialGradient(lx, ly, 0, lx, ly, 3.4); halo.addColorStop(0, '#ffb8a8'); halo.addColorStop(0.35, '#ff3b2f'); halo.addColorStop(0.6, '#7a1108'); halo.addColorStop(1, '#000');
  lctx.fillStyle = halo; lctx.fillRect(lx - 4, ly - 4, 8, 8);
  const lg = new THREE.BufferGeometry(), P = [], U = [], C = [], zl = zf + 0.2 * M;
  for (const [x0, y0, x1, y1, c] of [[dx + 1, dy + 1, dx + dwd - 1, dy + dhd - 1, 2.2], [lx - 4, ly - 4, lx + 4, ly + 4, 1.5]]) {
    for (const [x, y] of [[x0, y1], [x1, y1], [x1, y0], [x0, y1], [x1, y0], [x0, y0]]) { P.push(x * M - W / 2, foot + FH - y * M, zl); U.push((x - L[0]) / L[2], 1 - (y - L[1]) / L[3]); C.push(c, c, c); }
  }
  lg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); lg.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); lg.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
  const led = new THREE.Mesh(lg, new THREE.MeshBasicMaterial({ map: texture(lc, { anisotropy }), vertexColors: true, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  led.name = 'vcr_led'; g.add(led);
  g.userData.size = [W, VCR.h * M, D];
  g.userData.slot = new THREE.Vector3((sx + sw / 2) * M - W / 2, foot + FH - (sy + sh / 2) * M - 1.5 * M, zf);
  g.userData.setDoor = (o) => { door.rotation.x = clamp(o) * 1.5; };
  let shown = null;
  g.userData.update = (t) => { // 12:00, 12:00, 12:00
    const on = still || t % 1.2 < 0.75; if (on === shown) return; shown = on;
    const col = lg.attributes.color; for (let i = 0; i < 6; i++) col.setXYZ(i, on ? 2.2 : 0.12, on ? 2.2 : 0.12, on ? 2.2 : 0.12); col.needsUpdate = true;
  };
  return g;
}

// ─────────────────────────────────────────────────────────────
// The mixtape: an audio cassette. It stands on its long edge, its
// label toward +z.
// ─────────────────────────────────────────────────────────────
const MIX = {
  w: 100, h: 64, t: 9, head: [60, 13.5, 12], window: [36, 23.5, 28, 12], eyes: [[28.75, 29.5], [71.25, 29.5]],
  size: [1024, 720], at: { face: [12, 12, 1000, 640], edge: [12, 664, 1000, 44] },
};
function mixGeometry() {
  const W = MIX.w * M, H = MIX.h * M, T = MIX.t * M, r = 1.6 * M, box = boxOf(W, H, T), [hw, hh, ht] = MIX.head.map((v) => v * M);
  const rects = { pz: MIX.at.face, nz: MIX.at.face, px: MIX.at.edge, nx: MIX.at.edge, py: MIX.at.edge, ny: MIX.at.edge };
  const [x, y, w, h] = MIX.window;
  const face = plate('pz', [-(W / 2 - r), -(H / 2 - r), W / 2 - r, H / 2 - r], T / 2, [{ u0: x * M - W / 2, u1: (x + w) * M - W / 2, v0: H / 2 - (y + h) * M, v1: H / 2 - y * M, depth: 2.2 * M, inset: 0.7 * M }]);
  const head = shift(rbox(hw, hh, ht, 1 * M), 0, -H / 2 + hh / 2, 0);
  return geometry([unwrap(rbox(W, H, T, r, { cut: ['pz'] }), rects, MIX.size, box), unwrap(face, rects, MIX.size, box, 'pz'), unwrap(head, rects, MIX.size, boxOf(W, H, ht))]);
}
function paintMix(ctx, words, theme, rnd) {
  const body = '#d9d1c0';
  ctx.fillStyle = body; ctx.fillRect(0, 0, ...MIX.size);
  region(ctx, MIX.at.face, MIX.w, MIX.h, (c, w, h) => {
    c.fillStyle = body; c.fillRect(-1, -1, w + 2, h + 2);
    specks(c, w, h, 900, rnd, { light: 0.12, dark: 0.1, size: 0.4 });
    c.fillStyle = 'rgba(0,0,0,0.13)'; c.beginPath(); c.moveTo(18, h); c.lineTo(23, 50.5); c.lineTo(77, 50.5); c.lineTo(82, h); c.fill(); // the head's housing
    c.fillStyle = '#1a1a1c'; for (const x of [36, 64]) { c.beginPath(); c.arc(x, 58.5, 1.7, 0, 7); c.fill(); } for (const x of [27, 73]) c.fillRect(x - 1.6, 59, 3.2, 3.2);
    c.fillStyle = '#f6f2e8'; c.beginPath(); c.roundRect(5, 4, 90, 40, 1.6); c.fill();                      // the label
    c.fillStyle = theme?.lanes?.write ?? '#3FB950'; c.fillRect(5, 4, 90, 5.5);
    c.fillStyle = theme?.accent ?? '#BC2318'; c.fillRect(5, 39.6, 90, 1.5);
    c.strokeStyle = 'rgba(30,30,40,0.3)'; c.lineWidth = 0.15; for (const y of [18.6, 39]) { c.beginPath(); c.moveTo(8, y); c.lineTo(92, y); c.stroke(); }
    c.fillStyle = '#1d1d22'; c.textBaseline = 'middle'; c.textAlign = 'center';
    c.save(); c.translate(50, 14.2); c.rotate(-0.012); fit(c, words.title ?? '', 78, 8.6, FACES.marker); c.globalAlpha = 0.9; c.fillText(words.title ?? '', 0, 0); c.globalAlpha = 0.3; c.fillText(words.title ?? '', 0.15, 0.1); c.restore();
    c.fillStyle = body; c.beginPath(); c.roundRect(20, 20.5, 60, 18, 3); c.fill();                          // the label is cut round the window and the spindles
    c.fillStyle = 'rgba(0,0,0,0.1)'; c.beginPath(); c.roundRect(20, 20.5, 60, 0.6, 0.3); c.fill();
    for (const [x, y] of MIX.eyes) { // the spindle holes, and the teeth that turn the reels
      c.fillStyle = '#0a0a0c'; c.beginPath(); c.arc(x, y, 5.3, 0, 7); c.fill();
      c.fillStyle = '#ece8de'; for (let k = 0; k < 6; k++) { c.save(); c.translate(x, y); c.rotate(k * 1.0472 + 0.3); c.fillRect(3.1, -0.65, 2.3, 1.3); c.restore(); }
      c.strokeStyle = '#ece8de'; c.lineWidth = 0.7; c.beginPath(); c.arc(x, y, 5.1, 0, 7); c.stroke();
    }
    const [wx, wy, ww, wh] = MIX.window;
    c.fillStyle = '#8f887a'; c.fillRect(wx, wy, ww, wh);                                                   // the well's walls
    c.save(); c.beginPath(); c.rect(wx + 0.7, wy + 0.7, ww - 1.4, wh - 1.4); c.clip();
    c.fillStyle = '#141416'; c.fillRect(wx, wy, ww, wh);
    for (const [i, pack] of [[0, 17], [1, 9.5]]) { // the two packs of tape: side A nearly played
      const [x, y] = MIX.eyes[i], gr = c.createRadialGradient(x, y, 5, x, y, pack); gr.addColorStop(0, '#4a3528'); gr.addColorStop(1, '#2a1d16');
      c.fillStyle = gr; c.beginPath(); c.arc(x, y, pack, 0, 7); c.fill();
      c.lineWidth = 0.12; for (let rr = 6; rr < pack; rr += 0.7) { c.strokeStyle = `rgba(255,220,190,${0.04 + 0.05 * Math.abs(Math.sin(rr * 3.1))})`; c.beginPath(); c.arc(x, y, rr, 0, 7); c.stroke(); }
    }
    const gl = c.createLinearGradient(wx, wy, wx + ww, wy + wh); gl.addColorStop(0.2, 'rgba(255,255,255,0)'); gl.addColorStop(0.4, 'rgba(255,255,255,0.12)'); gl.addColorStop(0.55, 'rgba(255,255,255,0)');
    c.fillStyle = gl; c.fillRect(wx, wy, ww, wh); c.restore();
    c.fillStyle = '#1d1d22'; fit(c, words.side ?? '', 70, 3.1, FONT_MONO); c.fillText(words.side ?? '', 50, 42.4);
    for (const [x, y] of [[4, 4], [96, 4], [4, 60], [96, 60], [50, 47.3]]) { // five screws
      c.fillStyle = '#9d968a'; c.beginPath(); c.arc(x, y, 1.5, 0, 7); c.fill(); c.strokeStyle = '#5c574f'; c.lineWidth = 0.3;
      c.beginPath(); c.moveTo(x - 0.9, y - 0.5); c.lineTo(x + 0.9, y + 0.5); c.moveTo(x - 0.5, y + 0.9); c.lineTo(x + 0.5, y - 0.9); c.stroke();
    }
    wear(c, w, h, rnd, { color: '255,255,255', n: 0.3 });
  });
  region(ctx, MIX.at.edge, 100, 9, (c, w, h) => { c.fillStyle = body; c.fillRect(-1, -1, w + 2, h + 2); specks(c, w, h, 200, rnd, { light: 0.1, dark: 0.1 }); c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(0, h / 2 - 0.12, w, 0.24); });
}
function paintMixRelief(ctx) {
  ctx.fillStyle = relief(120, 0.42); ctx.fillRect(0, 0, ...MIX.size);
  region(ctx, MIX.at.face, MIX.w, MIX.h, (c) => {
    c.fillStyle = relief(134, 0.85); c.beginPath(); c.roundRect(5, 4, 90, 40, 1.6); c.fill();
    c.fillStyle = relief(120, 0.42); c.beginPath(); c.roundRect(20, 20.5, 60, 18, 3); c.fill();
    for (const [x, y] of MIX.eyes) { c.fillStyle = relief(30, 0.5); c.beginPath(); c.arc(x, y, 5.3, 0, 7); c.fill(); }
    for (const [x, y] of [[4, 4], [96, 4], [4, 60], [96, 60], [50, 47.3]]) { c.fillStyle = relief(70, 0.3, 0.8); c.beginPath(); c.arc(x, y, 1.5, 0, 7); c.fill(); }
  });
  grain(ctx, 0.1);
  region(ctx, MIX.at.face, MIX.w, MIX.h, (c) => { const [wx, wy, ww, wh] = MIX.window; c.fillStyle = relief(120, 0.06); c.fillRect(wx + 0.7, wy + 0.7, ww - 1.4, wh - 1.4); });
}
// `words` is config.playlist.tape ({ title, side }); `scale` makes it larger than life, to be
// seen from across the room. Returns a group: the cassette, and on the full look its clear case.
export function buildMixtape(words = {}, { lite = false, anisotropy = 8, theme, scale = 1, boxed = !lite } = {}) {
  const k = lite ? 0.5 : 1, g = new THREE.Group();
  const map = sheet(MIX.size, k), rb = sheet(MIX.size, k / 2);
  paintMix(map[1], words, theme, rng(seedOf(words.title) + 5)); paintMixRelief(rb[1]);
  const rbt = texture(rb[0], { srgb: false, anisotropy });
  g.add(shadowed(new THREE.Mesh(mixGeometry(), new THREE.MeshStandardMaterial({ map: texture(map[0], { anisotropy }), roughnessMap: rbt, metalnessMap: rbt, bumpMap: rbt, bumpScale: 1, roughness: 1, metalness: 1 }))));
  if (boxed) { // the case: clear, hard, a little scuffed
    const box = new THREE.Mesh(new RoundedBoxGeometry(109 * M, 70 * M, 16 * M, 1, 1.2 * M), new THREE.MeshPhysicalMaterial({ color: '#e8f0f4', roughness: 0.08, metalness: 0, transparent: true, opacity: 0.16, depthWrite: false }));
    box.position.y = 1.5 * M; box.renderOrder = 2; g.add(box);
  }
  // the reels' hubs, which turn while the playlist plays (`userData.playing`, set by src/app.js
  // from Spotify's player): the take-up reel, nearly full, slower than the one that feeds it
  const hubGeo = new THREE.CylinderGeometry(4.4 * M, 4.4 * M, 0.8 * M, 6).rotateX(Math.PI / 2);
  const hubMat = new THREE.MeshStandardMaterial({ color: '#ece8de', roughness: 0.6 });
  const hubs = MIX.eyes.map(([x, y]) => {
    const h = new THREE.Mesh(hubGeo, hubMat); h.position.set((x - MIX.w / 2) * M, (MIX.h / 2 - y) * M, MIX.t / 2 * M + 0.2 * M);
    h.castShadow = false; g.add(h); return h;
  });
  let last = null, speed = 0;
  g.userData.update = (t) => {
    const dt = last == null ? 0 : Math.min(0.1, t - last); last = t;
    speed += ((g.userData.playing ? 1 : 0) - speed) * Math.min(1, dt * 3); // the motor eases in and out
    if (speed < 1e-3) return;
    hubs[0].rotation.z -= dt * speed * 1.4; hubs[1].rotation.z -= dt * speed * 2.6;
  };
  g.scale.setScalar(scale); g.userData.foot = (boxed ? 33.5 : 32) * M * scale; // from its middle down to what it stands on
  return g;
}
