import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { hotspots, theme } from './config.js';
import { recordArt, crateArt, texture, FONT_TITLE, FONT_MONO } from './art.js';

// The props of the two other walls and the floor, built from config:
//   the sea    (right wall)  a wave tank, one buoy per marola-dev repo;
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
export function waveHeight(x, z, t) {
  let h = 0;
  for (const [a, k, w, [dx, dz]] of WAVES) { const l = Math.hypot(dx, dz); h += a * Math.sin(k * ((dx / l) * x + (dz / l) * z) - w * t); }
  return h;
}

function label(text, sub, w = 1024, h = 256) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.fillStyle = theme.text; ctx.font = `120px ${FONT_TITLE}`; ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, 8, 130);
  ctx.fillStyle = theme.muted; ctx.font = `34px ${FONT_MONO}`; ctx.fillText(sub, 12, 200);
  return texture(c);
}

export function buildSea(g, mesh, std, part) {
  const tank = spot('tank'); if (!tank) return () => {};
  const X = 3.08, Z = -0.45, L = 1.6, D = 0.5, top = 0.72, waterY = top + 0.36;
  // the cabinet, and the tank on it
  part(new THREE.BoxGeometry(D + 0.06, top, L + 0.08), [X, top / 2, Z], '#1d2029');
  part(new THREE.BoxGeometry(D + 0.08, 0.03, L + 0.1), [X, top + 0.015, Z], '#2a303c');
  const tankGroup = new THREE.Group(); tankGroup.name = tank.name; g.add(tankGroup);
  const glass = new THREE.MeshPhysicalMaterial({ color: '#a8d8ff', roughness: 0.05, metalness: 0, transparent: true, opacity: 0.14, depthWrite: false });
  const box = mesh('', new THREE.BoxGeometry(D, 0.48, L), glass, [X, top + 0.03 + 0.24, Z], tankGroup);
  box.castShadow = false; box.renderOrder = 2;
  // the water: a live wave surface
  const uniforms = { uTime: { value: 0 }, uDeep: { value: new THREE.Color('#06243f') }, uShallow: { value: new THREE.Color('#1682D4') }, uFoam: { value: new THREE.Color('#dff4ff') } };
  const water = new THREE.ShaderMaterial({
    uniforms, transparent: true,
    vertexShader: `
      uniform float uTime; varying float vH; varying vec3 vN;
      float wave(vec2 p) { float h = 0.0; ${waveGLSL} return h; }
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
        float k = smoothstep(-0.03, 0.04, vH);
        vec3 c = mix(uDeep, uShallow, k) * (0.55 + 0.45 * vN.y);
        c += uFoam * smoothstep(0.03, 0.045, vH) * 0.8;
        c += vec3(0.25, 0.6, 1.0) * pow(1.0 - vN.y, 2.0) * 1.2; // the glints
        gl_FragColor = vec4(c * 1.05, 0.92);
      }`,
  });
  const surface = mesh('', new THREE.PlaneGeometry(D - 0.02, L - 0.02, 24, 80), water, [X, waterY, Z], tankGroup);
  surface.rotation.x = -Math.PI / 2; surface.castShadow = surface.receiveShadow = false; surface.renderOrder = 1;
  const body = mesh('', new THREE.BoxGeometry(D - 0.02, waterY - top - 0.04, L - 0.02), new THREE.MeshBasicMaterial({ color: '#0a2c4d', transparent: true, opacity: 0.55, depthWrite: false }), [X, (waterY + top + 0.04) / 2, Z], tankGroup);
  body.castShadow = false;
  const glow = new THREE.PointLight('#3aa0ff', 1.1, 2.2, 2); glow.position.set(X - 0.3, waterY + 0.2, Z); g.add(glow);

  // the buoys: one per marola-dev repo, each one mesh (vertex colours)
  const buoys = art('buoy').map((h, i, all) => {
    const geos = [
      new THREE.CylinderGeometry(0.028, 0.034, 0.05, 14).translate(0, 0.0, 0),
      new THREE.CylinderGeometry(0.006, 0.006, 0.07, 6).translate(0, 0.06, 0),
      new THREE.SphereGeometry(0.014, 10, 8).translate(0, 0.1, 0),
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

  // the mural above: the name, in the sea's own words
  const mural = mesh('', new THREE.PlaneGeometry(1.5, 0.375), new THREE.MeshBasicMaterial({ map: label(tank.label, tank.hint), transparent: true, toneMapped: false }), [3.39, 2.15, Z]);
  mural.rotation.y = -Math.PI / 2; mural.castShadow = false;
  // a line of waves painted along the wall
  const strokes = [];
  for (let j = 0; j < 3; j++) {
    const pts = [];
    for (let s = 0; s <= 80; s++) { const z = -1.9 + (s / 80) * 3.4; pts.push(new THREE.Vector3(3.395, 1.68 + j * 0.06 + Math.sin(z * 6 + j) * 0.025, z)); }
    strokes.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, 0.004, 4));
  }
  const waveLine = mesh('', mergeGeometries(strokes), new THREE.MeshBasicMaterial({ color: theme.lanes.host }), [0, 0, 0]);
  waveLine.castShadow = false;

  return (t) => {
    uniforms.uTime.value = t;
    for (const b of buoys) {
      const p = b.userData.home, y = waveHeight(p.x, p.z, t);
      const sx = (waveHeight(p.x + 0.02, p.z, t) - y) / 0.02, sz = (waveHeight(p.x, p.z + 0.02, t) - y) / 0.02;
      b.position.set(p.x, p.y + y + 0.005, p.z);
      b.rotation.set(sz * 0.6, b.userData.phase + t * 0.2, -sx * 0.6);
    }
  };
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
  for (const [s, p] of [[[W, H, 0.02], [0, H / 2, D / 2]], [[W, H, 0.02], [0, H / 2, -D / 2]], [[0.02, H, D], [W / 2, H / 2, 0]], [[0.02, H, D], [-W / 2, H / 2, 0]], [[W, 0.02, D], [0, 0.01, 0]]]) {
    mesh('', new THREE.BoxGeometry(...s), wood, p, grp);
  }
  const edge = std('#111', { roughness: 0.6 });
  const sleeve = (h, pos) => mesh(h.name, new THREE.BoxGeometry(0.31, 0.31, 0.006), [edge, edge, edge, edge, new THREE.MeshStandardMaterial({ map: recordArt({ title: h.label, theme }), roughness: 0.6 }), edge], pos, grp);
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
