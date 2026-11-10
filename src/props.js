import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { hotspots, theme, shell, sea } from './config.js';
import { ROOM } from './shell.js';
import { buildAquarium } from './aquarium.js';
import { recordArt, cardArt, crateArt, texture, FONT_TITLE, FONT_MONO } from './art.js';

// The props of the two other walls and the floor, built from config:
//   the sea    (right wall)  an aquarium (src/aquarium.js), one buoy per marola-dev repo on its
//                            surface, the wall painted with blue stripes from corner to corner;
//   the loop   (front wall)  a wheel that turns forever, one crate per
//                            ouroboric-dev repo, each kept upright;
//   the slipbox (floor)      a crate of records: Pirsig in front, h0ffmann's repositories behind.
// Each returns the objects it adds and a function to animate them.

const art = (kind) => hotspots.filter((h) => h.art?.kind === kind);
const spot = (name) => hotspots.find((h) => h.name === name);

// ── waves: the same sum of sines in the shader and in JavaScript, so a
// buoy rides exactly the surface you see ──
const WAVES = [
  [0.022, 7.0, 1.0, [1, 0.25]],
  [0.014, 11.0, 1.7, [0.3, 1]],
  [0.009, 17.0, 2.3, [-0.7, 0.6]],
  [0.005, 29.0, 3.1, [0.9, -0.4]],
];
const waveGLSL = WAVES.map(([a, k, w, [dx, dz]]) => {
  const l = Math.hypot(dx, dz);
  return `h += ${a.toFixed(4)} * sin(${k.toFixed(2)} * (${(dx / l).toFixed(3)} * p.x + ${(dz / l).toFixed(3)} * p.y) - ${w.toFixed(2)} * uTime);`;
}).join('\n');
const TANK = 0.3; // the waves of a tank are a third of the sea's
export function waveHeight(x, z, t) {
  let h = 0;
  for (const [a, k, w, [dx, dz]] of WAVES) { const l = Math.hypot(dx, dz); h += a * Math.sin(k * ((dx / l) * x + (dz / l) * z) - w * t); }
  return h;
}

function label(text, sub, w = 1024, h = 256) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.fillStyle = shell?.ink ?? theme.text; ctx.font = `120px ${FONT_TITLE}`; // painted on the wall, in the wall's ink ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, 8, 130);
  ctx.fillStyle = shell?.inkSoft ?? theme.muted; ctx.font = `34px ${FONT_MONO}`; ctx.fillText(sub, 12, 200);
  return texture(c);
}

export function buildSea(g, mesh, std, part, furniture, { lite = false } = {}) {
  const tank = spot('tank'); if (!tank) return () => {};
  const X = 3.08, Z = -0.45, L = 1.6, D = 0.5, top = 0.72;
  // the cabinet, and the aquarium on it (src/aquarium.js)
  const stand = (s) => { // what stands there until the sideboard's file arrives, or if it never does
    mesh('', new THREE.BoxGeometry(D + 0.06, top, L + 0.08), std('#4a3426'), [0, top / 2, 0], s).rotation.y = Math.PI / 2;
    mesh('', new THREE.BoxGeometry(D + 0.08, 0.03, L + 0.1), std('#3a281d'), [0, top + 0.015, 0], s).rotation.y = Math.PI / 2;
  };
  if (furniture) furniture.place('cabinet', g, { at: [X, 0, Z], rot: -Math.PI / 2, fit: { w: L + 0.16, h: top + 0.03, d: D + 0.08 }, stretch: true, standin: stand });
  else { const s = new THREE.Group(); s.position.set(X, 0, Z); g.add(s); stand(s); }
  const aq = buildAquarium(g, { at: new THREE.Vector3(X, top + 0.03, Z), L, D, cfg: sea.aquarium, lite, name: tank.name, loadFish: () => furniture?.load('fish') ?? Promise.resolve(null) });
  const waterY = top + 0.03 + aq.waterY;
  // the surface: the live waves, small in a tank, which the buoys ride
  const uniforms = { uTime: { value: 0 }, uDeep: { value: new THREE.Color('#0d4a6b') }, uShallow: { value: new THREE.Color('#3d9cc9') }, uFoam: { value: new THREE.Color('#dff4ff') } };
  const water = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, side: THREE.DoubleSide, forceSinglePass: true,
    vertexShader: `
      uniform float uTime; varying float vH; varying vec3 vN;
      float wave(vec2 p) { float h = 0.0; ${waveGLSL} return h * ${TANK.toFixed(2)}; }
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vec2 p = w.xz; float h = wave(p);
        float e = 0.01; vN = normalize(vec3(-(wave(p + vec2(e, 0.0)) - h) / e, 1.0, -(wave(p + vec2(0.0, e)) - h) / e));
        vH = h; w.y += h;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: `
      uniform vec3 uDeep, uShallow, uFoam; varying float vH; varying vec3 vN;
      void main() {
        float k = smoothstep(-0.01, 0.012, vH);
        vec3 c = mix(uDeep, uShallow, k) * (0.55 + 0.45 * vN.y);
        c += vec3(0.5, 0.8, 1.0) * pow(1.0 - vN.y, 2.0) * 2.0; // the glints
        gl_FragColor = vec4(c * 0.9, 0.5);
      }`,
  });
  const surface = mesh('', new THREE.PlaneGeometry(D - 0.016, L - 0.016, 16, 52), water, [X, waterY, Z], aq.group);
  surface.position.set(0, aq.waterY, 0); surface.rotation.x = -Math.PI / 2; surface.castShadow = surface.receiveShadow = false; surface.renderOrder = 3;
  surface.raycast = () => {};

  // the buoys: one per marola-dev repo, each one mesh (vertex colours), riding the surface
  const buoys = art('buoy').map((h, i, all) => {
    const geos = [
      new THREE.CylinderGeometry(0.022, 0.027, 0.04, 14).translate(0, 0.0, 0),
      new THREE.CylinderGeometry(0.005, 0.005, 0.06, 6).translate(0, 0.05, 0),
      new THREE.SphereGeometry(0.012, 10, 8).translate(0, 0.085, 0),
    ];
    const colors = [new THREE.Color(h.art.color), new THREE.Color('#d8d2c4'), new THREE.Color('#fff2c0')];
    geos.forEach((geo, j) => {
      const n = geo.attributes.position.count, col = new Float32Array(n * 3);
      for (let v = 0; v < n; v++) colors[j].toArray(col, v * 3);
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    });
    const b = mesh(h.name, mergeGeometries(geos.map((x) => x.toNonIndexed())), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.4, emissive: h.art.color, emissiveIntensity: 0.25 }), [0, 0, 0]);
    b.castShadow = false;
    const row = i % 2, k = Math.floor(i / 2), n = Math.ceil(all.length / 2);
    b.userData.home = new THREE.Vector3(X - 0.1 + row * 0.2, waterY, Z - L / 2 + 0.16 + (k + row * 0.5) * ((L - 0.3) / n));
    b.userData.phase = i * 1.3;
    return b;
  });

  // the name, painted on the wall above, in the sea's own words
  const mural = mesh('', new THREE.PlaneGeometry(1.5, 0.375), new THREE.MeshBasicMaterial({ map: label(tank.label, tank.hint), transparent: true, toneMapped: false }), [3.39, 2.15, Z]);
  mural.rotation.y = -Math.PI / 2; mural.castShadow = false;
  // the wall: blue stripes, the sea's swell, from corner to corner and from the skirting to the cornice
  buildWaveWall(g, { lite, clear: { z: Z - 0.05, y: 2.15, w: 1.7, h: 0.5 } });

  return (t) => {
    uniforms.uTime.value = t; aq.update(t);
    for (const b of buoys) {
      const p = b.userData.home, y = TANK * waveHeight(p.x, p.z, t);
      const sx = TANK * (waveHeight(p.x + 0.02, p.z, t) - waveHeight(p.x, p.z, t)) / 0.02, sz = TANK * (waveHeight(p.x, p.z + 0.02, t) - waveHeight(p.x, p.z, t)) / 0.02;
      b.position.set(p.x, p.y + y + 0.005, p.z);
      b.rotation.set(sz * 0.6, b.userData.phase + t * 0.2, -sx * 0.6);
    }
  };
}

// The marola wall (the right one, x = 3.4): stripes of the sea's blues painted across all of it,
// each a band between two swells, the deep ones low and the shallow ones high, drawn once on a
// canvas from config.sea.wall. One plane, lit like the paint it is. `clear` keeps the name readable.
function buildWaveWall(g, { lite, clear }) {
  const cols = sea.wall?.colors ?? ['#06243f', '#1682D4', '#8cc8f0'];
  const z0 = ROOM.z0 + 0.012, z1 = ROOM.z1 - 0.012, y0 = 0.165, y1 = ROOM.h - 0.15;
  const W = lite ? 1024 : 2048, H = Math.round(W * (y1 - y0) / (z1 - z0) / 2) * 2;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d'), r = mulberry32(5);
  const bands = 26;
  for (let j = 0; j < bands; j++) {
    const v = j / (bands - 1); // 0 at the floor, 1 under the cornice
    const base = H * (1 - (j + 0.5) / bands);
    const thick = H / bands * (0.28 + 0.3 * r());
    const k1 = (2 + r() * 3) * Math.PI * 2 / W, k2 = (7 + r() * 6) * Math.PI * 2 / W, a1 = H * (0.006 + 0.01 * r()), a2 = H * 0.004 * r(), p1 = r() * 6.28, p2 = r() * 6.28;
    const yAt = (x, off) => base + off + a1 * Math.sin(k1 * x + p1) + a2 * Math.sin(k2 * x + p2);
    const ci = Math.min(cols.length - 1, Math.floor((1 - v) * cols.length * 0.999));
    ctx.fillStyle = cols[cols.length - 1 - ci]; ctx.globalAlpha = 0.78 + 0.2 * r();
    ctx.beginPath(); ctx.moveTo(0, yAt(0, -thick / 2));
    for (let x = 0; x <= W; x += 8) ctx.lineTo(x, yAt(x, -thick / 2));
    for (let x = W; x >= 0; x -= 8) ctx.lineTo(x, yAt(x + 30, thick / 2) + thick * 0.15 * Math.sin(x * k2 * 0.5));
    ctx.closePath(); ctx.fill();
  }
  ctx.globalAlpha = 1;
  if (clear) { // the name's place, cleared with soft edges
    const px = (z) => ((z - z0) / (z1 - z0)) * W, py = (y) => ((y1 - y) / (y1 - y0)) * H;
    ctx.globalCompositeOperation = 'destination-out'; ctx.filter = `blur(${W / 120}px)`;
    ctx.fillRect(px(clear.z - clear.w / 2), py(clear.y + clear.h / 2), px(clear.z + clear.w / 2) - px(clear.z - clear.w / 2), py(clear.y - clear.h / 2) - py(clear.y + clear.h / 2));
    ctx.filter = 'none'; ctx.globalCompositeOperation = 'source-over';
  }
  const tex = texture(c);
  const mat = new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.92, emissiveMap: tex, emissive: '#ffffff', emissiveIntensity: 0.08, depthWrite: false });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(z1 - z0, y1 - y0), mat);
  plane.position.set(ROOM.x1 - 0.004, (y0 + y1) / 2, (z0 + z1) / 2); plane.rotation.y = -Math.PI / 2;
  plane.receiveShadow = true; plane.castShadow = false; plane.name = 'marola_wall'; plane.raycast = () => {};
  g.add(plane);
}
function mulberry32(a) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// ── the loop: a wheel on the front wall that never stops ──
export function buildLoop(g, mesh, std) {
  const belt = spot('belt'); if (!belt) return () => {};
  const CX = 0.4, CY = 1.6, Zw = 3.78, R = 0.82;
  const wheel = new THREE.Group(); wheel.name = belt.name; wheel.position.set(CX, CY, Zw - 0.12); g.add(wheel);
  const steel = std('#3a3f4a', { metalness: 0.7, roughness: 0.35 });
  mesh('', new THREE.TorusGeometry(R, 0.018, 8, 96), steel, [0, 0, 0], wheel);
  mesh('', new THREE.TorusGeometry(R * 0.35, 0.012, 8, 48), steel, [0, 0, 0], wheel);
  mesh('', new THREE.CylinderGeometry(0.05, 0.05, 0.12, 20).rotateX(Math.PI / 2), std(theme.accent, { roughness: 0.4 }), [0, 0, 0], wheel);
  const crates = art('crate');
  const spokes = mergeGeometries(crates.map((_, i) => {
    const a = (i / crates.length) * Math.PI * 2;
    return new THREE.BoxGeometry(0.012, R, 0.012).translate(0, R / 2, 0).rotateZ(a);
  }));
  mesh('', spokes, steel, [0, 0, 0], wheel);
  // a light ring that runs round, so the loop reads as moving even when still
  const ringMat = new THREE.MeshBasicMaterial({ color: theme.accent, toneMapped: false });
  const runner = mesh('', new THREE.SphereGeometry(0.022, 12, 8), ringMat, [R, 0, 0], wheel);
  runner.castShadow = false;
  // the crates hang from the rim and stay upright
  const boxes = crates.map((h) => {
    const tex = crateArt({ title: h.label, theme });
    const side = new THREE.MeshStandardMaterial({ color: '#8a6a46', roughness: 0.9 });
    const face = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 });
    const b = mesh(h.name, new THREE.BoxGeometry(0.26, 0.13, 0.12), [side, side, side, side, face, face], [0, 0, 0]);
    b.rotation.y = Math.PI; // face the room
    return b;
  });
  const lamp = new THREE.PointLight('#ffd6a0', 2.2, 3.4, 1.6); lamp.position.set(CX, 2.7, Zw - 0.7); g.add(lamp);
  // the words, on the wall above
  const sign = mesh('', new THREE.PlaneGeometry(1.6, 0.4), new THREE.MeshBasicMaterial({ map: label(belt.label, belt.hint), transparent: true, toneMapped: false }), [CX + 1.9, 2.3, Zw - 0.005]);
  sign.rotation.y = Math.PI; sign.castShadow = false;
  // the floor marks: where the loop's light falls
  const spin = 0.12; // turns per second / 2π
  const v = new THREE.Vector3();
  return (t) => {
    const a0 = t * spin;
    boxes.forEach((b, i) => {
      const a = a0 + (i / boxes.length) * Math.PI * 2;
      v.set(Math.cos(a) * R, Math.sin(a) * R - 0.09, 0); // hang below the rim
      b.position.set(CX - v.x, CY + v.y, Zw - 0.2); // seen from the room, the wheel turns clockwise
      b.rotation.z = Math.sin(t * 1.3 + i) * 0.04; // a small swing
    });
    wheel.rotation.z = -a0;
    const r = -a0 * 3.0; runner.position.set(Math.cos(r) * R, Math.sin(r) * R, 0.02);
  };
}

// ── the slipbox: a crate on the floor, sleeves leaning back, two in front side by side ──
export function buildRecords(g, mesh, std, part) {
  const crate = spot('crate'); if (!crate) return () => {};
  const X = -2.2, Z = -1.15, W = 0.38, D = 0.46, H = 0.26;
  const grp = new THREE.Group(); grp.name = crate.name; grp.position.set(X, 0, Z); grp.rotation.y = 0.35; g.add(grp);
  const wood = std('#6b4a32', { roughness: 0.8 });
  mesh('', mergeGeometries([[[W, H, 0.02], [0, H / 2, D / 2]], [[W, H, 0.02], [0, H / 2, -D / 2]], [[0.02, H, D], [W / 2, H / 2, 0]], [[0.02, H, D], [-W / 2, H / 2, 0]], [[W, 0.02, D], [0, 0.01, 0]]]
    .map(([s, p]) => new THREE.BoxGeometry(...s).translate(...p))), wood, [0, 0, 0], grp);
  // a sleeve is a thin card: one box, one material, its picture wrapped round the 6 mm edges too
  const board = new THREE.BoxGeometry(0.31, 0.31, 0.006);
  const sleeve = (h, pos) => mesh(h.name, board, new THREE.MeshStandardMaterial({ map: h.art.card ? cardArt({ card: h.art.card, title: h.label, theme }) : recordArt({ title: h.label, theme }), roughness: 0.6 }), pos, grp);
  // the two that start it, side by side, leaning on the front of the crate
  for (const h of art('record').filter((x) => x.art.front !== undefined)) {
    const s = sleeve(h, [(h.art.front - 0.5) * 0.33, 0.155, D / 2 + 0.045]);
    s.rotation.x = -0.2; s.rotation.z = (h.art.front - 0.5) * -0.04;
  }
  const sleeves = art('record').filter((x) => x.art.front === undefined);
  sleeves.forEach((h, i) => {
    const s = sleeve(h, [0, 0.17, D / 2 - 0.04 - i * (D - 0.08) / sleeves.length]);
    s.rotation.x = -0.12 - i * 0.045; // leaning back, the front ones most visible
  });
  return () => {};
}
