// Nash's body (src/cat.js gives it a life): one skinned mesh built here in code, in metres, with
// no file to fetch. He is about 46 cm from nose to rump, 25 cm at the shoulder, with a tail of 28 cm.
//
//   bones   a spine of four from the hips to the shoulders, a neck, a head with a jaw and two ears,
//           four legs of four (upper, lower, the long foot bone, the paw), a tail of eight (five on
//           the phone's look). They lie flat under one group: `solve` places every one of them each
//           frame from a pose of some forty numbers, so no angle is ever passed down a chain.
//   skin    tubes lofted along the bones at rest (the trunk and neck, each leg with its shoulder
//           blade or haunch, the tail), a head grown from a few blobs (skull, cheeks, muzzle,
//           whisker pads, chin, brow), ears, a nose, whiskers; every ring is tied to the one or two
//           bones it lies between.
//   fur     three's standard material, black, with a sheen that the room's own light raises where
//           the coat turns away from the eye (a short coat is brightest at its edge) and a fine
//           grain along the hair: he keeps his form against a dark floor.
//   eyes    two discs drawn by a small shader: the iris, a pupil that is a slit by day and round by
//           night, the lids that blink and close, a glint.
//   shadow  a soft blot on what he stands on, fainter the higher he is above it.
//
// Three draw calls. `solve` allocates nothing.
import * as THREE from 'three';

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

// what a pose is made of; every key is a number, and two poses blend key by key
export const KEYS = ['hipF', 'hipY', 'hipX', 'yaw0', 'p0', 'p1', 'bend', 'roll0', 'roll1', 'neckP', 'neckY', 'headP', 'headY', 'headR',
  'fF', 'fS', 'hF', 'hS', 'fPhi', 'hPhi', 'splayF', 'splayH', 'free', 'ffA', 'ffB', 'hfA', 'hfB', 'tailP', 'tailC', 'tailW', 'lid', 'ears', 'jaw'];
const base = {
  hipF: -0.118, hipY: 0.192, hipX: 0, yaw0: 0, p0: 0.02, p1: -0.05, bend: 0, roll0: 0, roll1: 0,
  neckP: 0.72, neckY: 0, headP: -0.12, headY: 0, headR: 0,
  fF: 0.012, fS: 0.04, hF: -0.03, hS: 0.046, fPhi: 1.36, hPhi: 1.2, splayF: 0.06, splayH: 0.1,
  free: 0, ffA: 0, ffB: -0.15, hfA: 0, hfB: -0.17, tailP: -0.75, tailC: 0.16, tailW: 0, lid: 0.1, ears: 0, jaw: 0,
};
// The postures he takes. The feet of a posture with `free` 0 stand on the ground under the
// shoulders and the hips (`fF`, `hF`: how far ahead of the joint; `fS`, `hS`: how far out); with
// `free` 1 they are held in the body's own frame (`ffA` along it, `ffB` across it, from the joint).
export const POSES = {
  stand: { ...base },
  walk: { ...base, neckP: 0.5, headP: -0.08, tailP: -0.62, tailC: 0.17 },
  trot: { ...base, hipY: 0.186, neckP: 0.36, headP: -0.02, p0: 0.04, tailP: -0.1, tailC: 0.04, ears: 0.15 },
  sniff: { ...base, hipY: 0.185, p0: -0.06, p1: -0.3, neckP: -0.55, headP: -1.05, fF: 0.03, tailP: -0.5, tailC: 0.08 },
  alert: { ...base, neckP: 0.95, headP: -0.05, tailP: -0.55, lid: 0.02 },
  sit: { ...base, hipF: -0.15, hipY: 0.074, p0: 1.25, p1: 0.2, neckP: 0.9, headP: -0.1, fF: 0.03, fS: 0.03, hF: 0.085, hS: 0.078, hPhi: 0.12, splayH: 1.0, splayF: 0.02, tailP: -0.3, tailC: 0.06, tailW: 0.3 },
  loaf: { ...base, hipF: -0.118, hipY: 0.07, p0: 0.06, p1: 0.02, neckP: 0.85, headP: -0.05, free: 1, ffA: 0.03, ffB: -0.045, hfA: 0.07, hfB: -0.055, fPhi: 2.6, hPhi: 0.1, splayF: 0.5, splayH: 0.7, tailP: -0.2, tailC: 0.03, tailW: 0.36, lid: 0.3 },
  // curled up: the spine is an arc about the middle of the nest, the head comes round to the hips
  curl: { ...base, hipF: -0.089, hipX: -0.03, hipY: 0.064, yaw0: -1.25, bend: 2.5, p0: 0, p1: -0.02, roll0: 0.45, roll1: 0.3, neckP: -0.22, neckY: 0.5, headP: -0.3, headY: 0.4, headR: 0.25,
    free: 1, ffA: 0.035, ffB: -0.04, hfA: 0.075, hfB: -0.04, fPhi: 2.7, hPhi: 0.1, splayF: 0.4, splayH: 0.5, tailP: -0.12, tailC: 0, tailW: 0.24, lid: 1, ears: 0.25 },
  rouse: null,
  crouch: { ...base, hipF: -0.128, hipY: 0.118, p0: 0.2, p1: 0.02, neckP: 0.75, headP: 0.05, fF: 0.0, hF: 0.035, hPhi: 0.75, splayH: 0.3, tailP: -0.5, tailC: 0.04, lid: 0.02 },
  push: { ...base, hipF: -0.1, hipY: 0.235, p0: 0.75, p1: 0.6, neckP: 0.8, headP: 0.3, free: 0, hF: -0.11, hPhi: 1.5, fF: 0.05, tailP: -0.3, tailC: 0.02, lid: 0.02 },
  reach: { ...base, p0: 0.1, p1: 0.02, neckP: 0.45, headP: 0.1, free: 1, ffA: 0.1, ffB: -0.11, fPhi: 2.3, hfA: -0.12, hfB: -0.12, hPhi: 2.2, tailP: 0.1, tailC: 0.03, ears: 0.3, lid: 0.02 },
  tuck: { ...base, p0: -0.1, p1: -0.12, neckP: 0.5, headP: 0, free: 1, ffA: 0.07, ffB: -0.1, fPhi: 1.9, hfA: 0.06, hfB: -0.1, hPhi: 1.0, tailP: 0.25, tailC: 0.06, ears: 0.3, lid: 0.02 },
  alight: { ...base, p0: -0.08, p1: -0.3, neckP: 0.7, headP: 0.2, free: 1, ffA: 0.075, ffB: -0.15, fPhi: 1.9, hfA: 0.07, hfB: -0.09, hPhi: 0.9, tailP: 0.45, tailC: 0.08, lid: 0.02 },
  absorb: { ...base, hipY: 0.125, p0: 0.12, p1: -0.1, neckP: 0.7, headP: 0.05, hF: 0.03, hPhi: 0.8, splayH: 0.3, tailP: -0.1, tailC: 0.08 },
  peer: { ...base, hipF: -0.12, hipY: 0.14, p0: -0.25, p1: -0.55, neckP: -0.5, headP: -0.9, fF: 0.035, hF: 0.02, hPhi: 0.8, splayH: 0.3, tailP: -0.3, tailC: 0.05, lid: 0.02 },
  bow: { ...base, hipF: -0.135, hipY: 0.205, p0: -0.5, p1: -0.3, neckP: 0.55, headP: 0.25, fF: 0.13, fPhi: 0.75, hF: -0.045, tailP: 0.5, tailC: 0.12, lid: 0.7, ears: 0.4 },
  yawn: { ...base, hipF: -0.15, hipY: 0.074, p0: 1.25, p1: 0.2, neckP: 1.0, headP: 0.4, fF: 0.03, fS: 0.03, hF: 0.085, hS: 0.078, hPhi: 0.12, splayH: 1.0, splayF: 0.02, tailP: -0.3, tailC: 0.06, tailW: 0.3, lid: 0.95, ears: 0.7, jaw: 1 },
};
POSES.rouse = { ...POSES.curl, neckP: 0.6, neckY: 0.3, headP: 0.05, headY: 0.05, headR: 0, lid: 0.22, ears: 0 }; // woken, still curled: the head up
for (const p of Object.values(POSES)) for (const k of KEYS) if (typeof p[k] !== 'number') throw new Error(`a pose lacks ${k}`);

// lengths, in metres
const SEG = 0.059;                    // one of the spine's four bones
const NECK = 0.072, HEAD = 0.03;
const UP_F = 0.072, LO_F = 0.084, FT_F = 0.036; // the fore leg: upper arm, forearm, the foot bone
const UP_H = 0.088, LO_H = 0.098, FT_H = 0.074; // the hind leg: thigh, shin, the long foot bone
const PAW = 0.03;

// bone indices
const B = { spine: 0, neck: 4, head: 5, leg: 6, tail: 22 }; // leg i (0 FL, 1 FR, 2 HL, 3 HR): 6 + 4 i + (0 upper, 1 lower, 2 foot, 3 paw)

export function createBody(cfg, { lite = false } = {}) {
  const NT = lite ? 5 : 8, TSEG = (cfg.tail ?? 0.28) / NT;
  const size = (cfg.length ?? 0.46) / 0.46;
  const group = new THREE.Group(); group.name = 'cat';
  const rig = new THREE.Group(); rig.rotation.y = Math.PI; rig.scale.setScalar(size); group.add(rig); // inside the rig he faces +z, his left is +x
  const nb = B.tail + NT;
  const bones = []; for (let i = 0; i < nb; i++) { const b = new THREE.Bone(); b.matrixAutoUpdate = false; rig.add(b); bones.push(b); }

  // ── the solver's own numbers: every joint, in the rig's frame ──
  const J = new Float64Array(5 * 3), D = new Float64Array(4 * 3), L = new Float64Array(4 * 3); // the spine's joints, and each bone's direction and left
  const hip = new Float64Array(4 * 3), knee = new Float64Array(4 * 3), ankle = new Float64Array(4 * 3), ball = new Float64Array(4 * 3);
  const neck0 = new Float64Array(3), neck1 = new Float64Array(3), dn = new Float64Array(3), dh = new Float64Array(3), lh = new Float64Array(3), ln = new Float64Array(3);
  const tail = new Float64Array((NT + 1) * 3);
  const pose = { ...base };
  const foot = new Float64Array(12);          // where each paw's ball is asked to be (the rig's frame)
  const footPhi = new Float64Array(4), toe = new Float64Array(4);
  const tailYaw = new Float64Array(NT), tailPitch = new Float64Array(NT);
  const out = { J, D, L, hip, knee, ankle, ball, foot, footPhi, toe, tailYaw, tailPitch, neck1, dh, pose, breath: 0, ground: 0, earL: 0, earR: 0 };

  function setBone(i, ax, ay, az, dx, dy, dz, lx, ly, lz, wide = 1) {
    // y along the bone, x to his left, z = x × y
    const dot = lx * dx + ly * dy + lz * dz; lx -= dot * dx; ly -= dot * dy; lz -= dot * dz;
    const n = Math.hypot(lx, ly, lz) || 1; lx /= n; ly /= n; lz /= n;
    const zx = ly * dz - lz * dy, zy = lz * dx - lx * dz, zz = lx * dy - ly * dx;
    const e = bones[i].matrix.elements;
    e[0] = lx * wide; e[1] = ly * wide; e[2] = lz * wide; e[3] = 0;
    e[4] = dx; e[5] = dy; e[6] = dz; e[7] = 0;
    e[8] = zx * wide; e[9] = zy * wide; e[10] = zz * wide; e[11] = 0;
    e[12] = ax; e[13] = ay; e[14] = az; e[15] = 1;
    bones[i].matrixWorldNeedsUpdate = true;
  }
  const seg = (i, a, ao, b, bo, lx, ly, lz) => { // a bone from one joint to another
    let dx = b[bo] - a[ao], dy = b[bo + 1] - a[ao + 1], dz = b[bo + 2] - a[ao + 2]; const n = Math.hypot(dx, dy, dz) || 1;
    dx /= n; dy /= n; dz /= n;
    setBone(i, a[ao], a[ao + 1], a[ao + 2], dx, dy, dz, lx, ly, lz);
  };

  // the spine from the hips: its joints and frames, then where the legs hang from
  function spine(P, m) {
    J[0] = P.hipX * m; J[1] = P.hipY; J[2] = P.hipF;
    for (let k = 0; k < 4; k++) {
      const u = k / 3, yaw = (P.yaw0 + P.bend * u) * m, pitch = P.p0 + (P.p1 - P.p0) * u, roll = (P.roll0 + (P.roll1 - P.roll0) * u) * m;
      const cp = Math.cos(pitch), dx = Math.sin(yaw) * cp, dy = Math.sin(pitch), dz = Math.cos(yaw) * cp;
      let lx = Math.cos(yaw), ly = 0, lz = -Math.sin(yaw);
      // rolled about the bone: left turns toward up
      const ux = dy * lz - dz * ly, uy = dz * lx - dx * lz, uz = dx * ly - dy * lx, cr = Math.cos(roll), sr = Math.sin(roll);
      lx = lx * cr + ux * sr; ly = ly * cr + uy * sr; lz = lz * cr + uz * sr;
      D[k * 3] = dx; D[k * 3 + 1] = dy; D[k * 3 + 2] = dz; L[k * 3] = lx; L[k * 3 + 1] = ly; L[k * 3 + 2] = lz;
      J[k * 3 + 3] = J[k * 3] + dx * SEG; J[k * 3 + 4] = J[k * 3 + 1] + dy * SEG; J[k * 3 + 5] = J[k * 3 + 2] + dz * SEG;
    }
    for (let i = 0; i < 4; i++) {
      const front = i < 2, sg = i % 2 ? -1 : 1, k = front ? 3 : 0, j = front ? 12 : 0;
      const dx = D[k * 3], dy = D[k * 3 + 1], dz = D[k * 3 + 2], lx = L[k * 3], ly = L[k * 3 + 1], lz = L[k * 3 + 2];
      const ux = dy * lz - dz * ly, uy = dz * lx - dx * lz, uz = dx * ly - dy * lx; // up, across the bone
      const a = front ? -0.004 : 0.012, b = front ? -0.04 : -0.02, s = (front ? 0.037 : 0.04) * sg;
      hip[i * 3] = J[j] + dx * a + ux * b + lx * s; hip[i * 3 + 1] = J[j + 1] + dy * a + uy * b + ly * s; hip[i * 3 + 2] = J[j + 2] + dz * a + uz * b + lz * s;
    }
  }
  // where a paw stands by itself in the pose (`free` 0: on the ground under its joint; 1: held in the body's frame)
  function home(i, P, ground, o, at) {
    const front = i < 2, sg = i % 2 ? -1 : 1, k = front ? 3 : 0;
    const dx = D[k * 3], dy = D[k * 3 + 1], dz = D[k * 3 + 2], lx = L[k * 3], ly = L[k * 3 + 1], lz = L[k * 3 + 2];
    const h = Math.hypot(dx, dz) || 1, lh2 = Math.hypot(lx, lz) || 1;
    const f = front ? P.fF : P.hF, s = (front ? P.fS : P.hS) * sg - (front ? 0.037 : 0.04) * sg;
    const gx = hip[i * 3] + (dx / h) * f + (lx / lh2) * s, gz = hip[i * 3 + 2] + (dz / h) * f + (lz / lh2) * s;
    if (P.free > 0) {
      const ux = dy * lz - dz * ly, uy = dz * lx - dx * lz, uz = dx * ly - dy * lx;
      const a = front ? P.ffA : P.hfA, b = front ? P.ffB : P.hfB, s2 = sg * 0.008;
      const fx = hip[i * 3] + dx * a + ux * b + lx * s2, fy = Math.max(ground + 0.012, hip[i * 3 + 1] + dy * a + uy * b + ly * s2), fz = hip[i * 3 + 2] + dz * a + uz * b + lz * s2;
      o[at] = gx + (fx - gx) * P.free; o[at + 1] = ground + (fy - ground) * P.free; o[at + 2] = gz + (fz - gz) * P.free;
    } else { o[at] = gx; o[at + 1] = ground; o[at + 2] = gz; }
  }

  // Every bone from the pose. `m` mirrors the pose (he curls to either side). The feet are asked
  // for in `foot` (src/cat.js plants them); the tail's angles in `tailYaw` and `tailPitch`.
  function solve(P, m = 1) {
    const ground = out.ground, br = 1 + out.breath, down = clamp((0.17 - (P.hipY - ground)) / 0.09, 0, 1) * clamp(1 - Math.abs(P.bend), 0, 1), round = 0.24 * clamp(Math.abs(P.bend) - 0.8, 0, 1); // sitting he spreads at the hips; curled up he is rounder all along
    spine(P, m);
    for (let k = 0; k < 4; k++) setBone(k, J[k * 3], J[k * 3 + 1], J[k * 3 + 2], D[k * 3], D[k * 3 + 1], D[k * 3 + 2], L[k * 3], L[k * 3 + 1], L[k * 3 + 2], (k === 3 ? 1 + out.breath * 0.6 : k ? br : 1) * (1 + down * (k === 0 ? 0.3 : k === 1 ? 0.22 : k === 2 ? 0.08 : 0) + round));
    // the neck and the head
    const cy = (P.yaw0 + P.bend) * m, c3 = 9;
    const ux = D[c3 + 1] * L[c3 + 2] - D[c3 + 2] * L[c3 + 1], uy = D[c3 + 2] * L[c3] - D[c3] * L[c3 + 2], uz = D[c3] * L[c3 + 1] - D[c3 + 1] * L[c3];
    neck0[0] = J[12] + D[c3] * 0.03 + ux * 0.012; neck0[1] = J[13] + D[c3 + 1] * 0.03 + uy * 0.012; neck0[2] = J[14] + D[c3 + 2] * 0.03 + uz * 0.012;
    const ny = cy + P.neckY * m, np = P.neckP, cnp = Math.cos(np);
    dn[0] = Math.sin(ny) * cnp; dn[1] = Math.sin(np); dn[2] = Math.cos(ny) * cnp;
    ln[0] = Math.cos(ny); ln[1] = 0; ln[2] = -Math.sin(ny);
    neck1[0] = neck0[0] + dn[0] * NECK; neck1[1] = Math.max(ground + 0.045, neck0[1] + dn[1] * NECK); neck1[2] = neck0[2] + dn[2] * NECK;
    setBone(B.neck, neck0[0], neck0[1], neck0[2], dn[0], dn[1], dn[2], ln[0], 0, ln[2]);
    const hy = ny + P.headY * m, hp = P.headP, chp = Math.cos(hp), hr = P.headR * m;
    dh[0] = Math.sin(hy) * chp; dh[1] = Math.sin(hp); dh[2] = Math.cos(hy) * chp;
    lh[0] = Math.cos(hy); lh[1] = 0; lh[2] = -Math.sin(hy);
    { const vx = dh[1] * lh[2] - dh[2] * lh[1], vy = dh[2] * lh[0] - dh[0] * lh[2], vz = dh[0] * lh[1] - dh[1] * lh[0], c = Math.cos(hr), s = Math.sin(hr);
      lh[0] = lh[0] * c + vx * s; lh[1] = lh[1] * c + vy * s; lh[2] = lh[2] * c + vz * s; }
    setBone(B.head, neck1[0], neck1[1], neck1[2], dh[0], dh[1], dh[2], lh[0], lh[1], lh[2]);
    jaw.quaternion.copy(jawRest).multiply(q.setFromEuler(e.set(0.6 * P.jaw, 0, 0)));
    const eb = P.ears * 0.9;
    earBones[0].quaternion.copy(earRest[0]).multiply(q.setFromEuler(e.set(-eb * 0.5 + out.earL * 0.3, out.earL, eb * 0.6)));
    earBones[1].quaternion.copy(earRest[1]).multiply(q.setFromEuler(e.set(-eb * 0.5 + out.earR * 0.3, -out.earR, -eb * 0.6)));

    // the legs: the foot bone leans back from the paw's ball by `phi`, and the two long bones meet it
    for (let i = 0; i < 4; i++) {
      const front = i < 2, sg = i % 2 ? -1 : 1, k = front ? 3 : 0, o = i * 3, b = B.leg + i * 4;
      const l1 = front ? UP_F : UP_H, l2 = front ? LO_F : LO_H, lf = front ? FT_F : FT_H;
      const dx = D[k * 3], dz = D[k * 3 + 2], h = Math.hypot(dx, dz) || 1, fx = dx / h, fz = dz / h; // the way this end of him faces, level
      const sx = L[k * 3], sy = L[k * 3 + 1], sz = L[k * 3 + 2];
      const phi = footPhi[i], cph = Math.cos(phi), sph = Math.sin(phi);
      let bx = foot[o], by = Math.max(ground, foot[o + 1]), bz = foot[o + 2];
      let ax = bx - fx * cph * lf, ay = by + sph * lf, az = bz - fz * cph * lf; // the wrist, or the hock
      if (ay < ground + 0.012) ay = ground + 0.012;
      const hx = hip[o], hy2 = hip[o + 1], hz = hip[o + 2];
      let tx = ax - hx, ty = ay - hy2, tz = az - hz, d = Math.hypot(tx, ty, tz) || 1e-6;
      const dc = clamp(d, Math.abs(l1 - l2) + 0.012, l1 + l2 - 0.002);
      tx /= d; ty /= d; tz /= d;
      if (dc !== d) { const sh = dc - d; ax += tx * sh; ay += ty * sh; az += tz * sh; bx += tx * sh; by += ty * sh; bz += tz * sh; } // out of reach: the paw comes with the leg
      // the pole: the elbow points back and the knee forward, each a little out
      const sp = (front ? P.splayF : P.splayH) * sg, pf = front ? -1 : 1;
      let px = fx * pf + sx * sp, py = (front ? 0.25 : 0.45) + sy * sp, pz = fz * pf + sz * sp;
      const pd = px * tx + py * ty + pz * tz; px -= pd * tx; py -= pd * ty; pz -= pd * tz;
      const pn = Math.hypot(px, py, pz) || 1; px /= pn; py /= pn; pz /= pn;
      const a = (l1 * l1 - l2 * l2 + dc * dc) / (2 * dc), hh = Math.sqrt(Math.max(0, l1 * l1 - a * a));
      const kx = hx + tx * a + px * hh, ky = hy2 + ty * a + py * hh, kz = hz + tz * a + pz * hh;
      knee[o] = kx; knee[o + 1] = ky; knee[o + 2] = kz; ankle[o] = ax; ankle[o + 1] = ay; ankle[o + 2] = az; ball[o] = bx; ball[o + 1] = by; ball[o + 2] = bz;
      seg(b, hip, o, knee, o, sx, sy, sz); seg(b + 1, knee, o, ankle, o, sx, sy, sz); seg(b + 2, ankle, o, ball, o, sx, sy, sz);
      const tp = toe[i], ct = Math.cos(tp);
      setBone(b + 3, bx, by, bz, fx * ct, Math.sin(tp), fz * ct, sx, 0, sz);
    }
    // the tail, link by link from the rump, kept above what he is on
    const t0x = J[0] - D[0] * 0.058 + (D[1] * L[2] - D[2] * L[1]) * 0.012, t0y = J[1] - D[1] * 0.058 + (D[2] * L[0] - D[0] * L[2]) * 0.012, t0z = J[2] - D[2] * 0.058 + (D[0] * L[1] - D[1] * L[0]) * 0.012;
    tail[0] = t0x; tail[1] = Math.max(ground + 0.016, t0y); tail[2] = t0z;
    for (let i = 0; i < NT; i++) {
      const yw = tailYaw[i], pt = tailPitch[i], c = Math.cos(pt), o = i * 3;
      tail[o + 3] = tail[o] + Math.sin(yw) * c * TSEG; tail[o + 4] = Math.max(ground + 0.014, tail[o + 1] + Math.sin(pt) * TSEG); tail[o + 5] = tail[o + 2] + Math.cos(yw) * c * TSEG;
      seg(B.tail + i, tail, o, tail, o + 3, Math.cos(yw), 0, -Math.sin(yw));
    }
  }

  // ── the rest pose, and the skin laid over it ──
  const earBones = [new THREE.Bone(), new THREE.Bone()], earRest = [new THREE.Quaternion(), new THREE.Quaternion()], jaw = new THREE.Bone();
  const q = new THREE.Quaternion(), e = new THREE.Euler(), jawRest = new THREE.Quaternion();
  const rest = POSES.stand;
  spine(rest, 1);
  for (let i = 0; i < 4; i++) { home(i, rest, 0, foot, i * 3); footPhi[i] = i < 2 ? rest.fPhi : rest.hPhi; toe[i] = 0; }
  for (let i = 0; i < NT; i++) { tailYaw[i] = Math.PI; tailPitch[i] = -0.1; }
  bones[B.head].add(earBones[0], earBones[1], jaw);
  solve(rest, 1);

  // the head's frame at rest: forward, up, left, about the middle of the skull
  const HF = new THREE.Vector3(dh[0], dh[1], dh[2]), HL = new THREE.Vector3(lh[0], lh[1], lh[2]), HU = new THREE.Vector3().crossVectors(HF, HL);
  const HC = new THREE.Vector3(neck1[0], neck1[1], neck1[2]).addScaledVector(HF, HEAD);
  const inHead = (f, u, l, o = new THREE.Vector3()) => o.copy(HC).addScaledVector(HF, f).addScaledVector(HU, u).addScaledVector(HL, l);

  let headField = null;
  const geo = buildSkin();
  function buildSkin() {
    const pos = [], col = [], si = [], sw = [], idx = [];
    const vert = (p, b0, b1, w1, c) => { pos.push(p.x, p.y, p.z); si.push(b0, b1, 0, 0); sw.push(1 - w1, w1, 0, 0); col.push(c[0], c[1], c[2]); return pos.length / 3 - 1; };
    const FUR = [1, 1, 1], SKIN = [5, 3.4, 3.4], NOSE = [0.5, 0.45, 0.45], WHISK = [60, 60, 64], MOUTH = [110, 28, 32]; // times the coat's colour
    const v = new THREE.Vector3(), t = new THREE.Vector3(), X = new THREE.Vector3(), Y = new THREE.Vector3();
    // a tube through rings: { c, a (half width, to his left), b (the other half width), bones, w, side?: the ring's own left }
    function tube(rings, n, capA = 0.5, capB = 0.5) {
      const first = pos.length / 3, N = rings.length;
      rings.forEach((r, k) => {
        const prev = rings[Math.max(0, k - 1)].c, next = rings[Math.min(N - 1, k + 1)].c;
        t.subVectors(next, prev).normalize();
        X.copy(r.side ?? v.set(1, 0, 0)); X.addScaledVector(t, -X.dot(t)).normalize(); Y.crossVectors(t, X);
        for (let j = 0; j < n; j++) {
          const th = (j / n) * Math.PI * 2, cs = Math.cos(th), sn = Math.sin(th);
          const bb = sn < 0 && r.b2 ? r.b2 : r.b;
          vert(v.copy(r.c).addScaledVector(X, r.a * cs).addScaledVector(Y, bb * sn), r.bones[0], r.bones[1] ?? r.bones[0], r.w ?? 0, r.col ?? FUR);
        }
      });
      for (let k = 0; k < N - 1; k++) for (let j = 0; j < n; j++) {
        const a = first + k * n + j, b = first + k * n + (j + 1) % n, c = a + n, d = b + n;
        idx.push(a, b, c, b, d, c);
      }
      const cap = (k, len, flip) => {
        const r = rings[k], other = rings[k ? k - 1 : 1].c;
        t.subVectors(r.c, other).normalize();
        const p = vert(v.copy(r.c).addScaledVector(t, len * Math.max(r.a, r.b)), r.bones[0], r.bones[1] ?? r.bones[0], r.w ?? 0, r.col ?? FUR);
        for (let j = 0; j < n; j++) { const a = first + k * n + j, b = first + k * n + (j + 1) % n; if (flip) idx.push(a, p, b); else idx.push(a, b, p); }
      };
      cap(0, capA, true); cap(N - 1, capB, false);
    }
    // a lump grown from blobs: along each ray from its middle, the place where the blobs' field is zero
    function lump(c, field, nu, nv, bone, tint) {
      const first = pos.length / 3, d = new THREE.Vector3();
      const at = (dir) => { let lo = 0, hi = 0.14; for (let i = 0; i < 18; i++) { const mid = (lo + hi) / 2; if (field(v.copy(c).addScaledVector(dir, mid)) < 0) lo = mid; else hi = mid; } return v.copy(c).addScaledVector(dir, lo); };
      const north = vert(at(d.copy(HF)), bone, bone, 0, tint ? tint(v) : FUR);
      for (let i = 1; i < nv; i++) {
        const ph = (i / nv) * Math.PI;
        for (let j = 0; j < nu; j++) {
          const th = (j / nu) * Math.PI * 2;
          d.set(0, 0, 0).addScaledVector(HF, Math.cos(ph)).addScaledVector(HL, Math.sin(ph) * Math.cos(th)).addScaledVector(HU, Math.sin(ph) * Math.sin(th));
          const p = at(d); vert(p, bone, bone, 0, tint ? tint(p) : FUR);
        }
      }
      const south = vert(at(d.copy(HF).negate()), bone, bone, 0, FUR);
      const ring = (i) => first + 1 + (i - 1) * nu;
      for (let j = 0; j < nu; j++) { idx.push(north, ring(1) + j, ring(1) + (j + 1) % nu); idx.push(south, ring(nv - 1) + (j + 1) % nu, ring(nv - 1) + j); }
      for (let i = 1; i < nv - 1; i++) for (let j = 0; j < nu; j++) {
        const a = ring(i) + j, b = ring(i) + (j + 1) % nu, c2 = a + nu, d2 = b + nu;
        idx.push(a, c2, b, b, c2, d2);
      }
    }
    const V = (o, i) => new THREE.Vector3(o[i * 3], o[i * 3 + 1], o[i * 3 + 2]);
    const mixV = (a, b, u) => a.clone().lerp(b, u);
    const R = lite ? 8 : 14;

    // the trunk and the neck: rings along the spine, deeper at the ribs, tucked at the waist
    {
      const sp = [0, 1, 2, 3, 4].map((k) => V(J, k)), up = new THREE.Vector3(0, 1, 0), fw = new THREE.Vector3(0, 0, 1);
      const at = (s) => { const u = clamp(s, 0, 3.999), k = Math.floor(u); return mixV(sp[k], sp[k + 1], u - k); }; // s in spine bones from the hips
      const w = (s) => { const u = clamp(s - 0.5, 0, 3), k = Math.min(2, Math.floor(u)); return { bones: [k, k + 1], w: clamp(u - k, 0, 1) }; };
      const ring = (s, a, b, b2, lift = 0) => ({ c: at(s).addScaledVector(up, lift), a, b, b2, ...w(s) });
      const n0 = new THREE.Vector3(neck0[0], neck0[1], neck0[2]), n1 = new THREE.Vector3(neck1[0], neck1[1], neck1[2]);
      const rump = at(0).addScaledVector(fw, -0.062).addScaledVector(up, 0.004);
      tube([
        { c: rump, a: 0.026, b: 0.03, bones: [0] },
        { c: at(0).addScaledVector(fw, -0.04).addScaledVector(up, 0.002), a: 0.047, b: 0.052, b2: 0.05, bones: [0] },
        ring(0, 0.061, 0.06, 0.064), ring(0.5, 0.063, 0.059, 0.064), ring(1, 0.063, 0.057, 0.063), ring(1.5, 0.064, 0.057, 0.065), ring(2, 0.065, 0.058, 0.07),
        ring(2.5, 0.064, 0.059, 0.075), ring(3, 0.061, 0.06, 0.079), ring(3.5, 0.056, 0.06, 0.079), ring(4, 0.05, 0.058, 0.074, 0.002),
        { c: mixV(sp[4], n0, 0.9).addScaledVector(up, 0.004), a: 0.042, b: 0.05, b2: 0.058, bones: [3, 4], w: 0.35 },
        { c: mixV(n0, n1, 0.4), a: 0.037, b: 0.04, b2: 0.045, bones: [3, 4], w: 0.75 },
        { c: mixV(n0, n1, 0.8), a: 0.036, b: 0.037, b2: 0.04, bones: [4, 5], w: 0.4 },
        { c: mixV(n0, n1, 1.15), a: 0.036, b: 0.035, bones: [5] },
      ], R, 0.6, 0.3);
    }
    // the legs: from the shoulder blade or the haunch, down the two long bones and the foot, to the paw
    for (let i = 0; i < 4; i++) {
      const front = i < 2, b = B.leg + i * 4, sg = i % 2 ? -1 : 1;
      const h = V(hip, i), k = V(knee, i), a = V(ankle, i), g = V(ball, i), up = new THREE.Vector3(0, 1, 0), fw = new THREE.Vector3(0, 0, 1), side = new THREE.Vector3(sg, 0, 0);
      const n = lite ? 6 : 10;
      if (front) tube([
        { c: h.clone().addScaledVector(up, 0.07).addScaledVector(fw, -0.03).addScaledVector(side, -0.02), a: 0.008, b: 0.02, bones: [3, b], w: 0.5 },
        { c: h.clone().addScaledVector(up, 0.04).addScaledVector(fw, -0.018).addScaledVector(side, -0.012), a: 0.017, b: 0.034, bones: [3, b], w: 0.6 },
        { c: h.clone().addScaledVector(side, -0.006), a: 0.022, b: 0.036, bones: [b] },
        { c: mixV(h, k, 0.5).addScaledVector(side, -0.003), a: 0.022, b: 0.031, bones: [b] },
        { c: k.clone().addScaledVector(up, 0.004), a: 0.021, b: 0.027, bones: [b, b + 1], w: 0.5 },
        { c: mixV(k, a, 0.35), a: 0.0185, b: 0.021, bones: [b + 1] },
        { c: mixV(k, a, 0.72), a: 0.0155, b: 0.0165, bones: [b + 1] },
        { c: a.clone(), a: 0.0148, b: 0.0155, bones: [b + 1, b + 2], w: 0.5 },
        { c: mixV(a, g, 0.55), a: 0.0155, b: 0.016, bones: [b + 2] },
        { c: g.clone().addScaledVector(up, 0.012).addScaledVector(fw, 0.004), a: 0.0185, b: 0.02, bones: [b + 2, b + 3], w: 0.7 },
      ], n, 0.4, 0.2);
      else tube([
        { c: h.clone().addScaledVector(up, 0.05).addScaledVector(fw, -0.012).addScaledVector(side, -0.028), a: 0.008, b: 0.03, bones: [0, b], w: 0.5 },
        { c: h.clone().addScaledVector(up, 0.022).addScaledVector(fw, 0.0).addScaledVector(side, -0.012), a: 0.026, b: 0.054, bones: [0, b], w: 0.65 },
        { c: mixV(h, k, 0.3).addScaledVector(fw, -0.006), a: 0.033, b: 0.058, bones: [b] },
        { c: mixV(h, k, 0.68).addScaledVector(fw, -0.008), a: 0.03, b: 0.046, bones: [b] },
        { c: k.clone().addScaledVector(fw, -0.012), a: 0.024, b: 0.032, bones: [b, b + 1], w: 0.5 },
        { c: mixV(k, a, 0.4), a: 0.0195, b: 0.025, bones: [b + 1] },
        { c: mixV(k, a, 0.78), a: 0.0145, b: 0.018, bones: [b + 1] },
        { c: a.clone(), a: 0.0125, b: 0.0155, bones: [b + 1, b + 2], w: 0.5 },
        { c: mixV(a, g, 0.45), a: 0.012, b: 0.0135, bones: [b + 2] },
        { c: mixV(a, g, 0.8), a: 0.0135, b: 0.0145, bones: [b + 2] },
        { c: g.clone().addScaledVector(up, 0.011).addScaledVector(fw, 0.002), a: 0.017, b: 0.018, bones: [b + 2, b + 3], w: 0.7 },
      ], n, 0.4, 0.2);
      // the paw: a low rounded pad ahead of the ball
      const pc = g.clone().addScaledVector(up, 0.011).addScaledVector(fw, 0.012);
      tube([
        { c: pc.clone().addScaledVector(fw, -0.02), a: 0.014, b: 0.0085, side, bones: [b + 3] },
        { c: pc.clone().addScaledVector(fw, -0.006), a: 0.0195, b: 0.0115, side, bones: [b + 3] },
        { c: pc.clone().addScaledVector(fw, 0.01), a: 0.0205, b: 0.011, side, bones: [b + 3] },
        { c: pc.clone().addScaledVector(fw, 0.022).addScaledVector(up, -0.0015), a: 0.016, b: 0.008, side, bones: [b + 3] },
      ], lite ? 6 : 8, 0.6, 0.7);
    }
    // the tail
    {
      const rings = [], up = new THREE.Vector3(0, 1, 0);
      rings.push({ c: V(tail, 0).add(new THREE.Vector3(0, 0, 0.03)), a: 0.02, b: 0.02, side: new THREE.Vector3(-1, 0, 0), bones: [0] });
      for (let i = 0; i <= NT; i++) {
        const u = i / NT, r = 0.0175 - 0.004 * u - (i === NT ? 0.003 : 0);
        rings.push({ c: V(tail, i), a: r, b: r, side: new THREE.Vector3(-1, 0, 0), bones: i === 0 ? [0, B.tail] : i === NT ? [B.tail + NT - 1] : [B.tail + i - 1, B.tail + i], w: i === 0 ? 0.6 : 0.5 });
        if (!lite && i < NT) rings.push({ c: mixV(V(tail, i), V(tail, i + 1), 0.5), a: r - 0.0002, b: r - 0.0002, side: new THREE.Vector3(-1, 0, 0), bones: [B.tail + i] });
      }
      void up;
      tube(rings, lite ? 6 : 8, 0.3, 0.9);
    }
    // the head: a skull, cheeks, a muzzle with its two pads, a chin, a brow
    {
      const ell = (p, c, rx, ry, rz) => { // rx along the head, ry up, rz to the side
        const dx = p.clone().sub(c), f = dx.dot(HF) / rx, u = dx.dot(HU) / ry, l = dx.dot(HL) / rz;
        return (Math.hypot(f, u, l) - 1) * Math.min(rx, ry, rz);
      };
      const smin = (a, b, k) => { const h = clamp(0.5 + 0.5 * (b - a) / k, 0, 1); return b + (a - b) * h - k * h * (1 - h); };
      const blobs = [
        [inHead(0.004, 0.004, 0), 0.046, 0.04, 0.047, 0.012],
        [inHead(0.014, -0.014, 0.026), 0.024, 0.021, 0.021, 0.012], [inHead(0.014, -0.014, -0.026), 0.024, 0.021, 0.021, 0.012],
        [inHead(0.036, -0.012, 0), 0.026, 0.017, 0.021, 0.014],
        [inHead(0.048, -0.019, 0.0105), 0.0125, 0.0105, 0.012, 0.005], [inHead(0.048, -0.019, -0.0105), 0.0125, 0.0105, 0.012, 0.005],
        [inHead(0.026, 0.022, 0.017), 0.016, 0.01, 0.014, 0.012], [inHead(0.026, 0.022, -0.017), 0.016, 0.01, 0.014, 0.012],
        [inHead(0.057, -0.0085, 0), 0.006, 0.0055, 0.0075, 0.004],
      ];
      headField = (p) => { let d = 1; for (const [c, rx, ry, rz, k] of blobs) d = smin(d, ell(p, c, rx, ry, rz), k); return d; };
      const nose = inHead(0.06, -0.0085, 0);
      const field = headField;
      lump(inHead(0.006, 0, 0), field, lite ? 14 : 24, lite ? 10 : 18, B.head, (p) => (p.distanceTo(nose) < 0.0085 ? NOSE : FUR));
      // the lower jaw, on its own bone, and the mouth it shows when he yawns
      const jawAt = inHead(-0.004, -0.02, 0);
      jaw.position.copy(jawAt); jaw.quaternion.identity();
      const jb = nb + 2;
      const chin = [[inHead(0.036, -0.0265, 0), 0.016, 0.008, 0.013, 0.006], [inHead(0.012, -0.027, 0), 0.02, 0.009, 0.019, 0.006]];
      const cf = (p) => { let d = 1; for (const [c, rx, ry, rz, k] of chin) d = smin(d, ell(p, c, rx, ry, rz), k); return d; };
      lump(inHead(0.024, -0.027, 0), cf, lite ? 8 : 12, lite ? 6 : 8, jb, lite ? null : (p) => (p.clone().sub(HC).dot(HU) > -0.0215 && p.clone().sub(HC).dot(HF) > 0.012 ? MOUTH : FUR));
      // the ears: a cupped triangle each, dark inside
      for (const sg of [1, -1]) {
        const bi = nb + (sg > 0 ? 0 : 1), root = inHead(-0.004, 0.03, sg * 0.027);
        const tip = inHead(-0.014, 0.07, sg * 0.04), fo = inHead(0.014, 0.026, sg * 0.036), ba = inHead(-0.028, 0.02, sg * 0.03), inn = inHead(0.004, 0.034, sg * 0.007), out2 = inHead(-0.006, 0.012, sg * 0.05);
        const P3 = (i) => new THREE.Vector3(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
        const face = (a, b2, c, toward) => { const n = P3(b2).sub(P3(a)).cross(P3(c).sub(P3(a))); if (n.dot(toward) < 0) idx.push(a, c, b2); else idx.push(a, b2, c); };
        const back = HF.clone().multiplyScalar(-1).addScaledVector(HL, sg * 0.4), fore = HF.clone().addScaledVector(HL, sg * 0.5);
        const A = vert(tip, bi, bi, 0, FUR), Bv = vert(inn, bi, bi, 0, FUR), Dv = vert(out2, bi, bi, 0, FUR), E = vert(ba, bi, bi, 0, FUR);
        face(A, E, Bv, back.clone().addScaledVector(HL, -sg)); face(A, Dv, E, back.clone().addScaledVector(HL, sg)); face(Bv, E, Dv, HU.clone().negate());
        const mid = vert(inHead(-0.008, 0.036, sg * 0.03), bi, bi, 0, SKIN), A2 = vert(tip, bi, bi, 0, FUR), B2 = vert(inn, bi, bi, 0, FUR), D2 = vert(out2, bi, bi, 0, FUR), C2 = vert(fo, bi, bi, 0, SKIN);
        face(A2, B2, mid, fore); face(A2, mid, D2, fore); face(B2, C2, mid, fore); face(C2, D2, mid, fore); // the inside, a shallow cup
        earBones[sg > 0 ? 0 : 1].position.copy(root);
      }
      // whiskers: four a side, each a sliver seen from both sides
      if (!lite) for (const sg of [1, -1]) for (let w = 0; w < 4; w++) {
        const from = inHead(0.046, -0.016 - w * 0.0028, sg * 0.014), to = inHead(0.05 - w * 0.006, -0.008 - w * 0.012 + 0.012, sg * (0.075 - w * 0.004));
        const a = vert(from.clone().addScaledVector(HU, 0.0007), B.head, B.head, 0, WHISK), b2 = vert(from.clone().addScaledVector(HU, -0.0007), B.head, B.head, 0, WHISK), c = vert(to, B.head, B.head, 0, WHISK);
        idx.push(a, b2, c);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setAttribute('rest', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4));
    g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
    g.setIndex(idx); g.computeVertexNormals();
    return g;
  }
  // the ears and the jaw hang from the head: their places were given in the rig's frame
  {
    const inv = bones[B.head].matrix.clone().invert(), m4 = new THREE.Matrix4(), s = new THREE.Vector3();
    for (const b of [...earBones, jaw]) { m4.makeTranslation(b.position.x, b.position.y, b.position.z).premultiply(inv).decompose(b.position, b.quaternion, s); }
    earRest[0].copy(earBones[0].quaternion); earRest[1].copy(earBones[1].quaternion); jawRest.copy(jaw.quaternion);
  }
  const allBones = [...bones, ...earBones, jaw];

  // ── the fur ──
  const uSheen = { value: new THREE.Color(cfg.sheen ?? '#8f96a8') }, uRim = { value: cfg.rim ?? 0.55 };
  const fur = new THREE.MeshStandardMaterial({ color: cfg.color, roughness: 0.62, metalness: 0, vertexColors: true, side: THREE.DoubleSide }); // both sides: the ears are one sheet
  fur.onBeforeCompile = (sh) => {
    sh.uniforms.uSheen = uSheen; sh.uniforms.uRim = uRim;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 rest;\nvarying vec3 vRest;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvRest = rest;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
uniform vec3 uSheen; uniform float uRim; varying vec3 vRest;
float catHash(vec3 p) { p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
float catGrain(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(catHash(i), catHash(i + vec3(1, 0, 0)), f.x), mix(catHash(i + vec3(0, 1, 0)), catHash(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(catHash(i + vec3(0, 0, 1)), catHash(i + vec3(1, 0, 1)), f.x), mix(catHash(i + vec3(0, 1, 1)), catHash(i + vec3(1, 1, 1)), f.x), f.y), f.z); }`)
      .replace('#include <opaque_fragment>', `{
  // a short coat: the light it takes comes back off the hairs, most where they turn away from the eye
  float grain = ${lite ? '1.0' : 'mix(0.7, 1.25, catGrain(vRest * vec3(420.0, 420.0, 90.0)))'};
  float rim = 1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0);
  vec3 lit = (reflectedLight.directDiffuse + reflectedLight.indirectDiffuse) / max(diffuseColor.rgb, vec3(0.004));
  float coat = step(vColor.r, 1.2);
  outgoingLight += coat * lit * uSheen * grain * (0.006 + uRim * rim * rim * (0.12 + 0.5 * rim * rim));
}
#include <opaque_fragment>`);
  };
  fur.customProgramCacheKey = () => `cat-fur-${lite ? 'lite' : 'full'}`;
  const mesh = new THREE.SkinnedMesh(geo, fur); mesh.name = 'cat_fur';
  mesh.castShadow = false; mesh.receiveShadow = !lite; mesh.frustumCulled = false;
  rig.add(mesh);
  group.updateMatrixWorld(true);
  mesh.bind(new THREE.Skeleton(allBones));
  // the pointer: a few balls along his back, not three thousand skinned triangles
  const ballAt = new THREE.Vector3(), hitAt = new THREE.Vector3(), sph = new THREE.Sphere();
  mesh.raycast = (ray, hits) => {
    let best = Infinity;
    for (const [i, r] of [[0, 0.085], [2, 0.085], [3, 0.08], [B.head, 0.07]]) {
      sph.set(ballAt.setFromMatrixPosition(bones[i].matrixWorld), r * size);
      if (ray.ray.intersectSphere(sph, hitAt)) { const d = ray.ray.origin.distanceTo(hitAt); if (d < best && d >= ray.near && d <= ray.far) best = d; }
    }
    if (best < Infinity) hits.push({ distance: best, point: ray.ray.at(best, new THREE.Vector3()), object: mesh });
  };

  // ── the eyes ──
  const eyeU = { uIris: { value: new THREE.Color(cfg.eyes) }, uLid: { value: 0.1 }, uPupil: { value: 0.8 }, uGlow: { value: 0.6 }, uFur: { value: new THREE.Color(cfg.color) } };
  const eyeGeo = new THREE.BufferGeometry();
  {
    const p = [], uv = [], ix = [];
    for (const sg of [1, -1]) {
      const dir = inHead(0.0405, 0.0065, sg * 0.0205).sub(HC).normalize(), n = HF.clone().addScaledVector(HL, sg * 0.42).addScaledVector(HU, 0.12).normalize();
      const ax = new THREE.Vector3().crossVectors(HU, n).normalize().addScaledVector(HU, -sg * 0.16).normalize(), ay = new THREE.Vector3().crossVectors(n, ax);
      let lo = 0, hi = 0.1; for (let i = 0; i < 18; i++) { const mid = (lo + hi) / 2; if (headField(HC.clone().addScaledVector(dir, mid)) < 0) lo = mid; else hi = mid; }
      const c = HC.clone().addScaledVector(dir, lo).addScaledVector(n, 0.0022);
      const o = p.length / 3, r = 0.0118;
      for (const [x, y] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const v = c.clone().addScaledVector(ax, x * r * sg).addScaledVector(ay, y * r); p.push(v.x, v.y, v.z); uv.push(x, y); }
      if (sg > 0) ix.push(o, o + 1, o + 2, o, o + 2, o + 3); else ix.push(o, o + 2, o + 1, o, o + 3, o + 2);
    }
    eyeGeo.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); eyeGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); eyeGeo.setIndex(ix);
  }
  const eyeMat = new THREE.ShaderMaterial({
    uniforms: eyeU, transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -6,
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform vec3 uIris, uFur; uniform float uLid, uPupil, uGlow; varying vec2 vUv;
void main() {
  vec2 p = vUv; float open = 1.0 - uLid;
  // an almond: the lids are two arcs that meet at the corners, the upper one comes down to blink
  float w = 1.0 - p.x * p.x;
  float upper = 0.78 * sqrt(max(w, 0.0)) * (2.0 * open - 1.0) + 0.04 * p.x, lower = -0.62 * sqrt(max(w, 0.0)) * mix(0.35, 1.0, open);
  float inside = smoothstep(0.0, 0.07, upper - p.y) * smoothstep(0.0, 0.07, p.y - lower) * step(abs(p.x), 0.98);
  float r = length(p * vec2(1.0, 1.05));
  vec3 iris = uIris * mix(1.05, 0.5, smoothstep(0.25, 0.95, r)); iris = mix(iris, uIris * vec3(0.75, 1.0, 0.6), 0.35 * smoothstep(0.55, 0.15, r));
  vec2 pw = vec2(mix(0.085, 0.52, uPupil), mix(0.74, 0.52, uPupil));
  float pupil = 1.0 - smoothstep(0.82, 1.1, length(p / pw));
  vec3 c = mix(iris, vec3(0.004), pupil) * uGlow;
  c *= mix(0.45, 1.0, smoothstep(0.0, 0.5, upper - p.y));            // the upper lid's shade
  c += vec3(0.9) * (1.0 - smoothstep(0.07, 0.13, length(p - vec2(-0.28, 0.3)))) * uGlow; // the glint
  float rimA = smoothstep(0.0, 0.06, upper - p.y + 0.09) * smoothstep(0.0, 0.06, p.y - lower + 0.09) * step(abs(p.x), 1.0);
  gl_FragColor = vec4(mix(uFur * 0.3, c, inside), max(inside, rimA * 0.9));
}`,
  });
  const eyes = new THREE.Mesh(eyeGeo, eyeMat); eyes.name = 'cat_eyes'; eyes.frustumCulled = false; eyes.raycast = () => {}; eyes.userData.baseMat = eyeMat; // the hover's lift leaves its material alone
  eyes.matrixAutoUpdate = false; eyes.matrix.copy(bones[B.head].matrix).invert(); bones[B.head].add(eyes); eyes.renderOrder = 2;

  // ── the blot of shadow under him ──
  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, vertexColors: true, transparent: true, depthWrite: false, fog: false, opacity: 0.5, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
  const shadowGeo = new THREE.BufferGeometry();
  { // a disc, dark in the middle and gone at its edge
    const p = [0, 0, 0], c = [0, 0, 0, 1], ix = [], n = 16, rings = [[0.45, 0.62], [0.75, 0.16], [1, 0]];
    rings.forEach(([r, a2], k) => { for (let j = 0; j < n; j++) { const th = (j / n) * Math.PI * 2; p.push(Math.cos(th) * r * 0.5, 0, Math.sin(th) * r * 0.5); c.push(0, 0, 0, a2); } if (k) for (let j = 0; j < n; j++) { const a0 = 1 + (k - 1) * n + j, b0 = 1 + (k - 1) * n + (j + 1) % n; ix.push(a0, a0 + n, b0, b0, a0 + n, b0 + n); } });
    for (let j = 0; j < n; j++) ix.push(0, 1 + (j + 1) % n, 1 + j);
    shadowGeo.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); shadowGeo.setAttribute('color', new THREE.Float32BufferAttribute(c, 4)); shadowGeo.setIndex(ix);
  }
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.name = 'cat_shadow'; shadow.userData.proxy = true; shadow.userData.baseMat = shadowMat; shadow.raycast = () => {}; shadow.renderOrder = 1; shadow.castShadow = shadow.receiveShadow = false;
  group.add(shadow);

  return {
    group, rig, mesh, eyes, shadow, bones, out, solve, home, spine, size, NT, TSEG,
    // the eyes: how shut, how round the pupil, how bright
    look(lid, pupil, glow) { eyeU.uLid.value = lid; eyeU.uPupil.value = pupil; eyeU.uGlow.value = glow; },
    // the blot: on the ground `drop` metres under his feet, `len` long, `wide` across
    shade(drop, len, wide, k) { shadow.position.set(0, -drop + 0.005, 0); shadow.scale.set(wide, 1, len); shadowMat.opacity = k; shadow.visible = k > 0.01; },
    get triangles() { return geo.index.count / 3; },
  };
}
