import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { hotspots, simulator as cfg } from './config.js';
import { FONT_TITLE, FONT_MONO, FACES, texture } from './art.js';

// The universe simulator: a corner that remembers The Midnight Gospel, the animated series by
// Pendleton Ward and Duncan Trussell (config.simulator.homage). It is an homage in this room's own
// shapes: nothing of the series is drawn, quoted or played here (AGENTS.md, invariant 1).
//
//   the machine   a home-made console by the front wall: walnut cheeks, an enamelled face, a desk
//                 of knobs and toggle switches, a cable to the wall, and a round glass port in
//                 which a small world turns. One mesh with one atlas drawn on a canvas, and one
//                 more for the port: its world, its ring, its moons and the row of pilot lamps
//                 are a fragment shader, run from the room's clock. A click tunes the next world
//                 of config.simulator.worlds (the `simulate` action, src/app.js);
//   the microphone on its top, and the headphones on a peg on its side: one mesh, its colours in
//                 the vertices;
//   the chart     on the wall over it: the same worlds, drawn by hand on a canvas, with the line
//                 that names the series and its makers. One mesh; its click opens the series' page.
//
// Four draw calls. With `still` (reduced motion) the world holds still and a click cuts to the
// next one; on the phone's look (`lite`) the atlas and the chart are half the size, and the
// planet has no clouds, no stars and no moons.
//
//   buildSimulator(g, { at: [x, y, z], lite, still, anisotropy })
//
// `at` is the point of the front wall's foot that the machine stands against, in metres. It
// returns the function that moves it, and leaves `g.userData.simulator` (`next`, `label`, `hint`).

const A = 1024;          // the atlas, in its own pixels (the phone's is drawn at half of them)
const PX = 900;          // pixels to the metre on the enamel
const W = 0.64, T = 0.03, IN = W - 2 * T; // the machine's width, a cheek's thickness, the face between them
// the face, from the side (z forward, y up): the lower front, the desk, the panel with the port
const B = [0.25, 0.44], C = [0.07, 0.54], D = [0.0, 1.04], BACK = 0.262, FOOT = 0.04;
const UP = { y: (C[1] + D[1]) / 2, z: (C[0] + D[0]) / 2, tilt: -Math.atan2(C[0] - D[0], D[1] - C[1]), h: Math.hypot(C[0] - D[0], D[1] - C[1]) };
const DESK = { y: (B[1] + C[1]) / 2, z: (B[0] + C[0]) / 2, tilt: -Math.atan2(B[0] - C[0], C[1] - B[1]), h: Math.hypot(B[0] - C[0], C[1] - B[1]) };
const LOW = { h: B[1] - FOOT };
const PORT = { r: 0.15, v: 0.04, dome: 0.034 }, LAMPS = { v: -0.2, r: 0.011, gap: 0.075 };
const KNOBS = [-0.2, -0.12, -0.04], SWITCHES = [0.065, 0.13, 0.195, 0.26];
const CHART = [0.72, 0.54]; // the chart on the wall, across and up
const JACK = [0.1, 0.09]; // where the headphones plug in, on the lower front: across and up, in metres
// where each thing is on the atlas: [x, y, w, h]
const R = {
  up: [0, 0, IN * PX, UP.h * PX], desk: [0, 463, IN * PX, DESK.h * PX], low: [0, 656, IN * PX, LOW.h * PX],
  wood: [540, 0, 484, 560],
  brass: [540, 580, 110, 110], knob: [660, 580, 110, 110], chrome: [780, 580, 110, 110], ink: [900, 580, 110, 110],
  cable: [540, 700, 110, 110],
};

const mulberry = (a) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const spaced = (ctx, px) => { if ('letterSpacing' in ctx) ctx.letterSpacing = `${px}px`; };

// a geometry's own 0..1 picture, laid on a rectangle of the atlas
function into(geo, [x, y, w, h]) {
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (x + uv.getX(i) * w) / A, 1 - (y + (1 - uv.getY(i)) * h) / A);
  return geo;
}
// a geometry painted with one plain colour: the middle of its swatch
const dab = (geo, [x, y, w, h]) => { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, (x + w / 2) / A, 1 - (y + h / 2) / A); return geo; };
// a thing on a tilted panel: made flat at the panel's middle (x across, y up the panel, z out of it), then tilted with it
const onPanel = (geo, P, u = 0, v = 0, lift = 0) => geo.translate(u, v, lift).rotateX(P.tilt).translate(0, P.y, P.z);

// ── the atlas: the three enamelled faces, the walnut, and a swatch for each plain part ──
function atlas(lite) {
  const k = lite ? 0.5 : 1, L = cfg.look, P = cfg.plate, n = cfg.worlds.length;
  const c = document.createElement('canvas'); c.width = c.height = A * k;
  const ctx = c.getContext('2d'); ctx.scale(k, k);
  // the second canvas says how each part shines: green is its roughness, blue how much of a metal it is
  const s = document.createElement('canvas'); s.width = s.height = A * k / 2;
  const sx = s.getContext('2d'); sx.scale(k / 2, k / 2);
  const shine = (r, rough, metal = 0) => { sx.fillStyle = `rgb(0,${Math.round(rough * 255)},${Math.round(metal * 255)})`; sx.fillRect(r[0] - 6, r[1] - 6, r[2] + 12, r[3] + 12); };
  sx.fillStyle = 'rgb(0,180,0)'; sx.fillRect(0, 0, A, A);
  ctx.fillStyle = L.enamel; ctx.fillRect(0, 0, A, A);
  const rnd = mulberry(7);

  // the enamel of a face: a little uneven, darker at its edges, a cream line round it and a screw in each corner
  const face = (r, draw) => {
    const [x, y, w, h] = r;
    ctx.save(); ctx.translate(x, y); ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.clip();
    ctx.fillStyle = L.enamel; ctx.fillRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,255,255,0.07)'); g.addColorStop(1, 'rgba(0,0,0,0.16)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 60; i++) { ctx.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.035)'; ctx.fillRect(rnd() * w, rnd() * h, 20 + rnd() * 90, 1 + rnd() * 2); }
    ctx.strokeStyle = L.ink; ctx.globalAlpha = 0.55; ctx.lineWidth = 2; ctx.strokeRect(12, 12, w - 24, h - 24); ctx.globalAlpha = 1;
    for (const [px, py] of [[24, 24], [w - 24, 24], [24, h - 24], [w - 24, h - 24]]) {
      ctx.fillStyle = L.enamel; ctx.beginPath(); ctx.arc(px, py, 9, 0, 7); ctx.fill();
      ctx.fillStyle = L.chrome; ctx.beginPath(); ctx.arc(px, py, 6, 0, 7); ctx.fill();
      ctx.strokeStyle = '#3b3d40'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(px - 4, py - 2); ctx.lineTo(px + 4, py + 2); ctx.stroke();
    }
    draw(w, h); ctx.restore(); shine(r, 0.34);
  };
  const words = (text, x, y, px, font = FONT_MONO, color = L.ink, align = 'center') => { ctx.font = `${px}px ${font}`; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y); };

  // the panel with the port: the maker's name, a scale round the glass, a lamp and a name for each world
  face(R.up, (w, h) => {
    const cx = w / 2, cy = h / 2 - PORT.v * PX, r = PORT.r * PX;
    spaced(ctx, 3); words(P.brand, 44, 42, 26, FONT_TITLE, L.ink, 'left');
    spaced(ctx, 1); words(P.model, w - 44, 42, 15, FONT_MONO, L.stripe, 'right');
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.arc(cx, cy + 3, r + 22, 0, 7); ctx.fill();   // the bezel's shadow
    ctx.strokeStyle = L.ink; ctx.lineCap = 'round';
    for (let i = 0; i < 60; i++) { // the scale: a long tick each fifth
      const a = (i / 60) * Math.PI * 2, r0 = r + 26, r1 = r0 + (i % 5 ? 6 : 13);
      ctx.lineWidth = i % 5 ? 1.2 : 2.4; ctx.globalAlpha = i % 5 ? 0.5 : 0.9;
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    const ly = h / 2 - LAMPS.v * PX;
    ctx.fillStyle = L.stripe; ctx.fillRect(30, ly - 30, w - 60, 3);
    spaced(ctx, 2); words(P.port, 44, ly - 42, 11, FONT_MONO, L.ink, 'left');
    spaced(ctx, 0);
    cfg.worlds.forEach((wd, i) => {
      const lx = cx + (i - (n - 1) / 2) * LAMPS.gap * PX;
      ctx.fillStyle = '#0e1414'; ctx.beginPath(); ctx.arc(lx, ly, LAMPS.r * PX + 5, 0, 7); ctx.fill();
      ctx.strokeStyle = L.chrome; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(lx, ly, LAMPS.r * PX + 4, 0, 7); ctx.stroke();
      let px = 11; do { ctx.font = `${px}px ${FONT_MONO}`; px -= 1; } while (px > 6 && ctx.measureText(wd.name).width > LAMPS.gap * PX - 6);
      words(wd.name, lx, ly + 24, px + 1);
    });
  });
  // the desk: three knobs with their scales, four switches, each with its word
  face(R.desk, (w, h) => {
    const cy = h / 2 - 0.012 * PX;
    spaced(ctx, 1);
    KNOBS.forEach((u, i) => {
      const x = w / 2 + u * PX;
      ctx.strokeStyle = L.ink; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.85;
      for (let j = 0; j <= 10; j++) { const a = Math.PI * (0.75 + 1.5 * j / 10); ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * 27, cy + Math.sin(a) * 27); ctx.lineTo(x + Math.cos(a) * 33, cy + Math.sin(a) * 33); ctx.stroke(); }
      ctx.globalAlpha = 1; words(P.knobs[i] ?? '', x, h - 30, 11);
    });
    SWITCHES.forEach((u, i) => {
      const x = w / 2 + u * PX;
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.arc(x, cy + 2, 13, 0, 7); ctx.fill();
      words(P.switches[i] ?? '', x, h - 30, 11, FONT_MONO, i === SWITCHES.length - 1 ? L.stripe : L.ink);
    });
  });
  // the lower front: the loudspeaker's slots, and the plate that says what the machine is
  face(R.low, (w, h) => {
    ctx.fillStyle = '#0c1616';
    for (let j = 0; j < 13; j++) { const y = 54 + j * 20; ctx.beginPath(); ctx.roundRect(46, y, 250, 9, 4.5); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    for (let j = 0; j < 13; j++) ctx.fillRect(50, 54 + j * 20 + 9, 242, 1.5);
    const px = 326, pw = w - px - 40, py = 58, ph = 150; // the plate
    const g = ctx.createLinearGradient(0, py, 0, py + ph); g.addColorStop(0, '#d9bb78'); g.addColorStop(1, '#a98542');
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(px + 2, py + 3, pw, ph); ctx.fillStyle = g; ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = '#2a1d0a'; ctx.lineWidth = 1.5; ctx.strokeRect(px + 6, py + 6, pw - 12, ph - 12);
    const ink = '#2a1d0a', mid = px + pw / 2;
    spaced(ctx, 2); words(P.brand, mid, py + 34, 24, FONT_TITLE, ink);
    spaced(ctx, 1);
    const [first, ...rest] = P.name.split(' ');
    words(first, mid, py + 70, 15, FONT_MONO, ink); words(rest.join(' '), mid, py + 90, 15, FONT_MONO, ink);
    words(P.model, mid, py + 122, 13, FONT_MONO, ink);
    spaced(ctx, 0);
    let fs = 11; do { ctx.font = `${fs}px ${FONT_MONO}`; fs -= 1; } while (fs > 6 && ctx.measureText(P.made).width > pw);
    words(P.made, mid, py + ph + 24, fs + 1);
    ctx.fillStyle = L.stripe; ctx.fillRect(px, h - 86, pw, 5); ctx.fillStyle = L.ink; ctx.globalAlpha = 0.7; ctx.fillRect(px, h - 74, pw, 2); ctx.globalAlpha = 1;
    const jx = w / 2 + JACK[0] * PX, jy = h - (JACK[1] - FOOT) * PX; // where the headphones plug in
    ctx.fillStyle = '#0c1616'; ctx.beginPath(); ctx.arc(jx, jy, 9, 0, 7); ctx.fill();
    ctx.strokeStyle = L.chrome; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(jx, jy, 10, 0, 7); ctx.stroke();
  });

  // the walnut: its grain runs up the cheeks
  {
    const [x, y, w, h] = R.wood;
    ctx.save(); ctx.translate(x, y); ctx.beginPath(); ctx.rect(-8, -8, w + 16, h + 16); ctx.clip();
    ctx.fillStyle = L.wood; ctx.fillRect(-8, -8, w + 16, h + 16);
    for (let i = 0; i < 260; i++) {
      const gx = rnd() * w, bend = (rnd() - 0.5) * 16, top = rnd() * h * 0.7 - 40, len = h * (0.3 + rnd() * 0.9);
      ctx.strokeStyle = rnd() < 0.6 ? `rgba(30,14,4,${0.05 + rnd() * 0.16})` : `rgba(255,214,160,${0.03 + rnd() * 0.08})`; ctx.lineWidth = 0.6 + rnd() * 2.2;
      ctx.beginPath(); ctx.moveTo(gx, top); ctx.bezierCurveTo(gx + bend, top + len / 3, gx - bend, top + 2 * len / 3, gx + bend * 0.5, top + len); ctx.stroke();
    }
    ctx.restore(); shine(R.wood, 0.62);
  }
  const swatch = (r, color, rough, metal = 0) => { ctx.fillStyle = color; ctx.fillRect(r[0] - 6, r[1] - 6, r[2] + 12, r[3] + 12); shine(r, rough, metal); };
  swatch(R.brass, L.brass, 0.32, 0.8); swatch(R.knob, L.knob, 0.42); swatch(R.chrome, L.chrome, 0.28, 0.55); swatch(R.ink, L.ink, 0.6); swatch(R.cable, L.cable, 0.85);
  const shineTex = new THREE.CanvasTexture(s);
  return { map: texture(c), shine: shineTex };
}

// ── the machine's body: every part of it in one geometry ──
function bodyGeometry() {
  const parts = [];
  const add = (geo) => { parts.push(geo.index ? geo.toNonIndexed() : geo); return geo; };
  const wood = (w, h, d, pos) => add(into(new THREE.BoxGeometry(w, h, d), R.wood).translate(...pos));
  // the two cheeks: the face's outline, a finger proud of the enamel
  const side = new THREE.Shape([[B[0] + 0.015, 0.03], [B[0] + 0.015, B[1] + 0.012], [C[0] + 0.015, C[1] + 0.012], [D[0] + 0.014, D[1] + 0.02], [-BACK + 0.002, D[1] + 0.02], [-BACK + 0.002, 0.03]].map(([z, y]) => new THREE.Vector2(z, y)));
  for (const s of [-1, 1]) {
    const geo = new THREE.ExtrudeGeometry(side, { depth: T, bevelEnabled: false }).rotateY(-Math.PI / 2).translate(s > 0 ? W / 2 : -W / 2 + T, 0, 0);
    const p = geo.attributes.position, uv = geo.attributes.uv, [x, y, w, h] = R.wood;
    for (let i = 0; i < p.count; i++) uv.setXY(i, (x + ((p.getZ(i) + BACK) / 0.55 + (p.getX(i) * s > W / 2 - T / 2 ? 0 : 0.04)) * w * 0.95) / A, 1 - (y + (1 - p.getY(i) / 1.08) * h) / A);
    add(geo);
  }
  wood(IN, 0.022, BACK + 0.004, [0, D[1] - 0.001, (0.004 - BACK) / 2]);                 // the top
  wood(IN, D[1] - FOOT, 0.012, [0, (D[1] + FOOT) / 2, -BACK + 0.012]);                 // the back
  add(dab(new THREE.BoxGeometry(IN - 0.02, FOOT, BACK + B[0] - 0.04), R.knob).translate(0, FOOT / 2, (B[0] - BACK) / 2)); // the dark plinth
  // the enamel: the lower front, the desk, the panel
  add(into(new THREE.PlaneGeometry(IN, LOW.h), R.low).translate(0, FOOT + LOW.h / 2, B[0]));
  add(into(onPanel(new THREE.PlaneGeometry(IN, DESK.h), DESK), R.desk));
  add(into(onPanel(new THREE.PlaneGeometry(IN, UP.h), UP), R.up));
  // the port's brass bezel
  add(dab(onPanel(new THREE.TorusGeometry(PORT.r + 0.009, 0.014, 10, 56), UP, 0, PORT.v, 0.005), R.brass));
  // the knobs, each with its pointer at another hour
  KNOBS.forEach((u, i) => {
    const turn = [0.7, -0.4, 1.9][i % 3];
    add(dab(onPanel(new THREE.CylinderGeometry(0.02, 0.024, 0.022, 20).rotateX(Math.PI / 2), DESK, u, 0.012, 0.011), R.knob));
    add(dab(onPanel(new THREE.BoxGeometry(0.004, 0.016, 0.003).translate(0, 0.011, 0).rotateZ(turn), DESK, u, 0.012, 0.0225), R.ink));
  });
  // the toggle switches: a nut and a lever, some up and some down
  SWITCHES.forEach((u, i) => {
    const s = [1, 1, -1, 1][i % 4], lean = 0.5;
    add(dab(onPanel(new THREE.CylinderGeometry(0.009, 0.009, 0.006, 6).rotateX(Math.PI / 2), DESK, u, 0.012, 0.003), R.chrome));
    add(dab(onPanel(new THREE.CylinderGeometry(0.0055, 0.0035, 0.03, 8).rotateX(Math.PI / 2 - s * lean), DESK, u, 0.012 + s * Math.sin(lean) * 0.015, 0.004 + Math.cos(lean) * 0.015), R.chrome));
  });
  // the cable: out of the cheek, along the floor and up to the plug in the wall
  const sx = -0.44, wall = -BACK;
  const path = new THREE.CatmullRomCurve3([[-W / 2 + 0.005, 0.1, -0.17], [-W / 2 - 0.04, 0.03, -0.13], [-0.4, 0.008, -0.09], [sx - 0.02, 0.008, -0.17], [sx, 0.03, wall + 0.03], [sx, 0.2, wall + 0.022], [sx, 0.3, wall + 0.03]].map((p) => new THREE.Vector3(...p)));
  add(dab(new THREE.TubeGeometry(path, 40, 0.0055, 6), R.cable));
  add(dab(new THREE.BoxGeometry(0.085, 0.085, 0.01), R.ink).translate(sx, 0.3, wall + 0.005));
  add(dab(new THREE.BoxGeometry(0.036, 0.036, 0.03), R.knob).translate(sx, 0.3, wall + 0.025));
  return mergeGeometries(parts);
}

// ── the port: the glass over the world, and the pilot lamps, one geometry and one shader ──
function portGeometry(n) {
  const kind = (geo, k) => { geo.setAttribute('kind', new THREE.Float32BufferAttribute(new Float32Array(geo.attributes.position.count).fill(k), 1)); return geo.toNonIndexed(); };
  const rs = (PORT.r * PORT.r + PORT.dome * PORT.dome) / (2 * PORT.dome); // the glass is a cap of a sphere this big
  const glass = new THREE.SphereGeometry(rs, 40, 8, 0, Math.PI * 2, 0, Math.asin(PORT.r / rs)).rotateX(Math.PI / 2).translate(0, 0, PORT.dome - rs);
  const p = glass.attributes.position, uv = glass.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / PORT.r / 2 + 0.5, p.getY(i) / PORT.r / 2 + 0.5);
  const parts = [kind(onPanel(glass, UP, 0, PORT.v, 0.004), 0)];
  for (let i = 0; i < n; i++) parts.push(kind(onPanel(new THREE.CircleGeometry(LAMPS.r, 14), UP, (i - (n - 1) / 2) * LAMPS.gap, LAMPS.v, 0.002), i + 1));
  return mergeGeometries(parts);
}
function portMaterial(n, lite) {
  return new THREE.ShaderMaterial({
    defines: { N: n, ...(lite ? {} : { FULL: 1 }) },
    uniforms: {
      uTime: { value: 0 }, uSeed: { value: 0 }, uRing: { value: 0 }, uMoons: { value: 0 }, uGrow: { value: 1 }, uFlux: { value: 0 }, uOn: { value: 0 },
      uA: { value: new THREE.Color() }, uB: { value: new THREE.Color() }, uC: { value: new THREE.Color() },
      uLamps: { value: cfg.worlds.map((w) => new THREE.Color(w.colors[1]).lerp(new THREE.Color(w.colors[2]), 0.35)) },
    },
    vertexShader: 'attribute float kind; varying vec2 vUv; varying float vKind; void main() { vUv = uv; vKind = kind; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    // Every colour ends under 0.85 in linear light, so the port never passes the bloom's threshold (src/post.js).
    fragmentShader: `
      uniform float uTime, uSeed, uRing, uMoons, uGrow, uFlux, uOn;
      uniform vec3 uA, uB, uC, uLamps[N];
      varying vec2 vUv; varying float vKind;
      const vec3 SUN = vec3(-0.485, 0.485, 0.728);
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p) { vec2 i = floor(p), u = fract(p); u = u * u * (3.0 - 2.0 * u);
        return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y); }
      vec2 turn(vec2 v, float a) { float c = cos(a), s = sin(a); return vec2(c * v.x + s * v.y, c * v.y - s * v.x); }
      void main() {
        vec2 p = vUv * 2.0 - 1.0; float rad = length(p);
        if (vKind > 0.5) { // a pilot lamp: the lit one is the world in the port
          vec3 c = uLamps[0];
          for (int i = 1; i < N; i++) if (vKind > float(i) + 0.5) c = uLamps[i];
          float on = step(abs(vKind - 1.0 - uOn), 0.5), dome = sqrt(max(0.0, 1.0 - rad * rad));
          vec3 lamp = c * mix(0.06, 0.8, on) * (0.45 + 0.55 * dome) + vec3(0.02) + vec3(0.16) * smoothstep(0.35, 0.0, length(p - vec2(-0.3, 0.35)));
          gl_FragColor = vec4(min(lamp, vec3(0.85)), 1.0); return;
        }
        float roll = 0.35 + 0.45 * sin(uSeed * 1.7), R = (uRing > 0.5 ? 0.45 : 0.52) * uGrow + 1e-4;
        vec2 pr = turn(p, roll); // the planet's own frame: its rings and its moons lie across it
        vec3 col = mix(vec3(0.012, 0.01, 0.035), uA * 0.2 + vec3(0.02, 0.012, 0.05), smoothstep(1.1, 0.0, rad));
        #ifdef FULL
          vec2 gs = p * 13.0, id = floor(gs); float h = hash(id + uSeed);
          vec2 f = fract(gs) - 0.5 - (vec2(hash(id + 1.7), hash(id + 5.3)) - 0.5) * 0.6;
          col += vec3(0.5, 0.55, 0.65) * step(0.84, h) * smoothstep(0.1, 0.0, length(f)) * (0.6 + 0.4 * sin(uTime * (1.0 + 3.0 * h) + h * 40.0));
        #endif
        float ring = 0.0;
        if (uRing > 0.5) { float rr = length(vec2(pr.x, pr.y / 0.3)) / R; ring = 0.8 * smoothstep(1.3, 1.38, rr) * (1.0 - smoothstep(2.0, 2.08, rr)) * (0.62 + 0.38 * sin(rr * 34.0)); }
        vec3 ringCol = mix(uB, uC, 0.6) * 0.62;
        col = mix(col, ringCol, ring);
        vec2 q = p / R; float d = length(q);
        if (d < 1.0) {
          float z = sqrt(1.0 - d * d); vec3 n = vec3(q, z);
          vec3 m = vec3(turn(n.xy, roll), n.z); float a = uTime * 0.22 + uSeed, cs = cos(a), sn = sin(a);
          vec3 s = vec3(m.x * cs + m.z * sn, m.y, m.z * cs - m.x * sn); // the point of the planet under this pixel
          #ifdef FULL
            float w = noise(vec2(s.x * 3.0 + uSeed, s.y * 7.0)) + noise(vec2(s.z * 3.0 - uSeed, s.y * 7.0 + 9.0)) - 1.0;
          #else
            float w = 0.35 * sin(s.x * 5.0 + s.z * 3.0);
          #endif
          vec3 base = mix(uA, uB, smoothstep(0.15, 0.85, 0.5 + 0.5 * sin(s.y * 8.0 + 2.6 * w + uSeed)));
          base = mix(base, uC, 0.55 * smoothstep(0.55, 0.95, 0.5 + 0.5 * sin(s.y * 15.0 - 3.0 * w + s.x * 2.0)));
          float lam = max(dot(n, SUN), 0.0);
          vec3 lit = base * (0.07 + 0.9 * lam) + uC * 0.22 * (1.0 - z) * (1.0 - z) * lam;
          col = mix(col, lit, smoothstep(1.0, 0.95, d));
        }
        if (pr.y < 0.0) col = mix(col, ringCol, ring); // the near half of the ring passes in front
        for (int i = 0; i < 2; i++) {
          float fi = float(i); if (fi >= uMoons) break;
          float a = uTime * (0.45 - 0.16 * fi) + fi * 2.4 + uSeed * 3.0, mr = (0.13 - 0.035 * fi) * R + 1e-4;
          vec2 c = turn(vec2(cos(a), sin(a) * 0.3) * (1.5 + 0.36 * fi) * R, -roll);
          float dm = length(p - c) / mr;
          if (dm < 1.0 && !(sin(a) > 0.0 && d < 1.0)) { // the far half of its way round is behind the planet
            vec3 mn = vec3((p - c) / mr, sqrt(1.0 - dm * dm));
            col = mix(col, mix(uC, vec3(0.8), 0.35) * (0.05 + 0.85 * max(dot(mn, SUN), 0.0)), smoothstep(1.0, 0.85, dm));
          }
        }
        // while it tunes: a ring of light that crosses the glass, and a little snow
        col += vec3(0.3, 0.36, 0.45) * uFlux * (smoothstep(0.14, 0.0, abs(rad - (1.0 - uGrow))) + 0.1 * hash(p * 41.0 + uTime));
        // the glass: darker toward its rim, and the room's light on its shoulder
        col *= 0.3 + 0.7 * smoothstep(1.0, 0.72, rad);
        col += vec3(0.05, 0.056, 0.066) * smoothstep(0.36, 0.0, length(p - vec2(-0.42, 0.52)));
        gl_FragColor = vec4(min(col, vec3(0.85)), 1.0);
      }`,
  });
}

// ── the microphone on the top and the headphones on their peg: one geometry, coloured in its vertices ──
function micGeometry() {
  const M = cfg.mic, parts = [];
  const add = (geo, color, pos = [0, 0, 0]) => {
    geo = (geo.index ? geo.toNonIndexed() : geo).translate(...pos);
    const col = new THREE.Color(color), n = geo.attributes.position.count, a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) col.toArray(a, i * 3);
    geo.setAttribute('color', new THREE.BufferAttribute(a, 3)); parts.push(geo);
  };
  // the microphone: a round foot, a stem, a yoke and a pill of a head, leaning back
  const at = [0.17, D[1] + 0.01, -0.125], lift = (y) => [at[0], at[1] + y, at[2]];
  add(new THREE.CylinderGeometry(0.048, 0.058, 0.014, 28), M.color, lift(0.007));
  add(new THREE.CylinderGeometry(0.0055, 0.0055, 0.125, 10), M.grille, lift(0.0765));
  add(new THREE.TorusGeometry(0.037, 0.004, 6, 18, Math.PI).rotateZ(Math.PI), M.color, lift(0.176));
  const head = (geo, color) => add(geo.rotateX(-0.32), color, lift(0.182));
  head(new THREE.CapsuleGeometry(0.027, 0.046, 6, 18), M.grille);
  head(new THREE.CylinderGeometry(0.0285, 0.0285, 0.014, 18), M.color);
  head(new THREE.CylinderGeometry(0.0282, 0.0282, 0.004, 18).translate(0, 0.03, 0), M.color);
  head(new THREE.CylinderGeometry(0.004, 0.004, 0.082, 8).rotateZ(Math.PI / 2), M.color);
  add(new THREE.SphereGeometry(0.0055, 10, 8), M.pad, [at[0], at[1] + 0.016, at[2] + 0.047]); // its small red lamp
  // the headphones, hung by their band on a peg on the cheek
  const hx = -W / 2 - 0.05, hy = 0.8, hz = 0.03, r = 0.085;
  add(new THREE.CylinderGeometry(0.005, 0.005, 0.08, 8).rotateZ(Math.PI / 2), M.grille, [-W / 2 - 0.035, hy + r + 0.011, hz]);
  add(new THREE.SphereGeometry(0.008, 10, 8), M.grille, [-W / 2 - 0.075, hy + r + 0.011, hz]);
  add(new THREE.TorusGeometry(r, 0.0055, 8, 28, Math.PI).rotateY(Math.PI / 2), M.color, [hx, hy, hz]);
  add(new THREE.TorusGeometry(r, 0.009, 8, 14, Math.PI * 0.42).rotateZ(Math.PI * 0.29).rotateY(Math.PI / 2), M.pad, [hx, hy, hz]);
  for (const s of [-1, 1]) {
    add(new THREE.CylinderGeometry(0.043, 0.043, 0.03, 22).rotateX(Math.PI / 2), M.color, [hx, hy - 0.02, hz + s * (r - 0.004)]);
    add(new THREE.TorusGeometry(0.031, 0.011, 8, 20), M.pad, [hx, hy - 0.02, hz + s * (r - 0.024)]);
    add(new THREE.CylinderGeometry(0.03, 0.034, 0.008, 22).rotateX(-s * Math.PI / 2), M.grille, [hx, hy - 0.02, hz + s * (r + 0.014)]);
  }
  // their cord: down to the floor, round the cheek and up to its socket on the lower front
  const jack = [JACK[0], JACK[1], B[0]];
  const cord = new THREE.CatmullRomCurve3([[hx, hy - 0.06, hz + r], [hx - 0.012, 0.42, hz + r + 0.04], [hx + 0.01, 0.05, 0.24], [-0.2, 0.006, 0.33], [0.0, 0.006, 0.31], [jack[0] - 0.01, 0.05, B[0] + 0.03], [jack[0], jack[1], B[0] + 0.022]].map((p) => new THREE.Vector3(...p)));
  add(new THREE.TubeGeometry(cord, 48, 0.003, 5), M.color);
  add(new THREE.CylinderGeometry(0.006, 0.006, 0.024, 8).rotateX(Math.PI / 2), M.color, [jack[0], jack[1], B[0] + 0.012]);
  return mergeGeometries(parts);
}

// ── the chart on the wall: the worlds, drawn by hand, and the line that says what the corner remembers ──
function chartArt(lite) {
  const k = lite ? 0.5 : 1, CW = 1024, CH = 768, Bd = cfg.board, K = Bd.colors, H = cfg.homage, n = cfg.worlds.length;
  const c = document.createElement('canvas'); c.width = CW * k; c.height = CH * k;
  const ctx = c.getContext('2d'); ctx.scale(k, k);
  const rnd = mulberry(20);
  // the frame, and the paper inside it: a night that warms toward the foot
  ctx.fillStyle = K.frame; ctx.fillRect(0, 0, CW, CH);
  const F = 26;
  for (let i = 0; i < 90; i++) { ctx.fillStyle = rnd() < 0.5 ? 'rgba(255,220,170,0.05)' : 'rgba(0,0,0,0.12)'; ctx.fillRect(rnd() * CW - 60, rnd() * CH, 80 + rnd() * 260, 1.5); }
  const sky = ctx.createLinearGradient(0, F, 0, CH - F); K.sky.forEach((s, i) => sky.addColorStop(i / (K.sky.length - 1), s));
  ctx.fillStyle = sky; ctx.fillRect(F, F, CW - 2 * F, CH - 2 * F);
  ctx.save(); ctx.beginPath(); ctx.rect(F, F, CW - 2 * F, CH - 2 * F); ctx.clip();
  const glow = ctx.createRadialGradient(CW * 0.5, CH * 0.56, 40, CW * 0.5, CH * 0.56, CW * 0.55);
  glow.addColorStop(0, 'rgba(255,160,90,0.16)'); glow.addColorStop(1, 'rgba(255,160,90,0)'); ctx.fillStyle = glow; ctx.fillRect(0, 0, CW, CH);
  // the stars: dots, and a few drawn with four points
  for (let i = 0; i < 170; i++) { ctx.globalAlpha = 0.25 + rnd() * 0.6; ctx.fillStyle = rnd() < 0.8 ? K.ink : K.star; ctx.beginPath(); ctx.arc(F + rnd() * (CW - 2 * F), F + rnd() * (CH - 2 * F), 0.6 + rnd() * 1.7, 0, 7); ctx.fill(); }
  ctx.globalAlpha = 0.9; ctx.fillStyle = K.star;
  for (let i = 0; i < 9; i++) {
    const x = 70 + rnd() * (CW - 140), y = 150 + rnd() * (CH - 300), s = 6 + rnd() * 9;
    ctx.beginPath(); for (let j = 0; j < 8; j++) { const a = j * Math.PI / 4, r = j % 2 ? s * 0.22 : s; ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } ctx.closePath(); ctx.fill();
  }
  ctx.globalAlpha = 1;
  // a line drawn by a hand: never quite straight, never quite round
  const wobbly = (cx, cy, rx, ry, turn = 0, jit = 0.03) => {
    ctx.beginPath(); const p0 = rnd() * 6.28, p1 = rnd() * 6.28;
    for (let j = 0; j <= 64; j++) {
      const a = (j / 64) * Math.PI * 2, w = 1 + jit * Math.sin(a * 3 + p0) + jit * 0.6 * Math.sin(a * 7 + p1);
      const x = Math.cos(a) * rx * w, y = Math.sin(a) * ry * w;
      ctx.lineTo(cx + x * Math.cos(turn) - y * Math.sin(turn), cy + x * Math.sin(turn) + y * Math.cos(turn));
    }
    ctx.closePath();
  };
  // where each world is on the chart: a way that rises and falls across it
  const spots = cfg.worlds.map((w, i) => {
    const u = n > 1 ? i / (n - 1) : 0.5;
    return { w, x: 150 + u * (CW - 300), y: 395 + (i % 2 ? -78 : 62) + Math.sin(i * 2.1) * 16, r: 50 + ((i * 7) % 3) * 6 };
  });
  // the way between them, in dashes, with a small arrow on each leg
  ctx.strokeStyle = K.line; ctx.fillStyle = K.line; ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.setLineDash([3, 13]);
  for (let i = 0; i + 1 < spots.length; i++) {
    const a = spots[i], b = spots[i + 1], mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2 + (i % 2 ? 46 : -46);
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(mx, my, b.x, b.y); ctx.stroke();
    const ax = (a.x + 2 * mx + b.x) / 4, ay = (a.y + 2 * my + b.y) / 4, dir = Math.atan2(b.y - a.y, b.x - a.x);
    ctx.save(); ctx.setLineDash([]); ctx.translate(ax, ay); ctx.rotate(dir); ctx.beginPath(); ctx.moveTo(11, 0); ctx.lineTo(-7, -8); ctx.lineTo(-3, 0); ctx.lineTo(-7, 8); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  ctx.setLineDash([]);
  // the worlds
  spots.forEach(({ w, x, y, r }, i) => {
    const [dark, main, light] = w.colors, tilt = -0.3 + (i % 3) * 0.22;
    const ringPath = () => { ctx.beginPath(); ctx.ellipse(x, y, r * 1.75, r * 0.46, tilt, 0, Math.PI * 2); };
    if (w.ring) { ctx.strokeStyle = light; ctx.lineWidth = 9; ctx.globalAlpha = 0.85; ringPath(); ctx.stroke(); ctx.globalAlpha = 1; }
    ctx.save(); wobbly(x, y, r, r); ctx.clip();
    const g = ctx.createRadialGradient(x - r * 0.4, y - r * 0.45, r * 0.1, x, y, r * 1.15);
    g.addColorStop(0, light); g.addColorStop(0.35, main); g.addColorStop(1, dark); ctx.fillStyle = g; ctx.fillRect(x - r - 8, y - r - 8, 2 * r + 16, 2 * r + 16);
    ctx.strokeStyle = light; ctx.globalAlpha = 0.45; ctx.lineWidth = 5; // its bands, bent as on a ball
    for (let j = -2; j <= 2; j++) { ctx.beginPath(); ctx.ellipse(x, y + j * r * 0.36, r * 1.05, r * 0.2, tilt * 0.6, 0.1, Math.PI - 0.1); ctx.stroke(); }
    ctx.globalAlpha = 0.5; ctx.fillStyle = dark; ctx.beginPath(); ctx.ellipse(x - r * 0.3, y - r * 0.3, r * 1.04, r * 1.04, 0, 0, 7); ctx.rect(x + 2 * r, y - 2 * r, -4 * r, 4 * r); ctx.fill('evenodd'); // its night side
    ctx.restore(); ctx.globalAlpha = 1;
    ctx.strokeStyle = K.ink; ctx.lineWidth = 3.2; wobbly(x, y, r, r); ctx.stroke();
    if (w.ring) { // the near half of the ring, over the world
      ctx.save(); ctx.beginPath(); ctx.rect(x - 2.2 * r, y, 4.4 * r, r * 1.6); ctx.clip();
      ctx.strokeStyle = light; ctx.lineWidth = 9; ringPath(); ctx.stroke(); ctx.strokeStyle = K.ink; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(x, y, r * 1.75 + 5, r * 0.46 + 5, tilt, 0, 7); ctx.stroke(); ctx.restore();
    }
    for (let j = 0; j < (w.moons ?? 0); j++) {
      const a = -0.9 + j * 2.3 + i, mx = x + Math.cos(a) * r * (1.5 + 0.3 * j), my = y + Math.sin(a) * r * (1.1 + 0.2 * j), mr = 9 - 2 * j;
      ctx.fillStyle = light; wobbly(mx, my, mr, mr, 0, 0.06); ctx.fill(); ctx.strokeStyle = K.ink; ctx.lineWidth = 2; ctx.stroke();
    }
    // its number and its name, written with a marker
    ctx.fillStyle = K.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.save(); ctx.translate(x, y + (i % 2 ? -r - 44 : r + 46)); ctx.rotate((i % 2 ? -1 : 1) * 0.035);
    let px = 30; do { ctx.font = `${px}px ${FACES.marker}`; px -= 2; } while (px > 14 && ctx.measureText(w.name).width > 190);
    ctx.fillText(w.name, 0, 0);
    ctx.fillStyle = K.line; ctx.font = `15px ${FONT_MONO}`; ctx.fillText(`${i + 1}/${n}`, 0, i % 2 ? -27 : 27);
    ctx.restore();
  });
  // the title, the note under it, and at the foot the line that names the series and its makers
  ctx.textAlign = 'left'; ctx.fillStyle = K.ink; spaced(ctx, 7); ctx.font = `56px ${FONT_TITLE}`; ctx.fillText(Bd.title, F + 34, F + 64);
  spaced(ctx, 0); ctx.fillStyle = K.line; ctx.font = `24px ${FACES.marker}`; ctx.fillText(Bd.note, F + 38, F + 112);
  ctx.strokeStyle = K.ink; ctx.globalAlpha = 0.5; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(F + 34, CH - F - 90); ctx.lineTo(CW - F - 34, CH - F - 90); ctx.stroke(); ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.fillStyle = K.ink; ctx.font = `34px ${FACES.marker}`; ctx.fillText(H.line, CW / 2, CH - F - 58);
  spaced(ctx, 1); ctx.fillStyle = K.star; ctx.font = `17px ${FONT_MONO}`; ctx.fillText(`${H.by} · ${H.year}`, CW / 2, CH - F - 22);
  spaced(ctx, 0);
  ctx.restore();
  // the frame's inner edge
  ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 3; ctx.strokeRect(F - 1, F - 1, CW - 2 * F + 2, CH - 2 * F + 2);
  ctx.strokeStyle = 'rgba(255,225,180,0.22)'; ctx.lineWidth = 2; ctx.strokeRect(4, 4, CW - 8, CH - 8);
  return texture(c);
}

export function buildSimulator(g, { at = [2.26, 0, 3.8], lite = false, still = false, anisotropy = 4 } = {}) {
  const spot = hotspots.find((h) => h.action === 'simulate'), worlds = cfg?.worlds ?? [];
  if (!spot || !worlds.length) return () => {};
  const n = worlds.length;
  const holder = new THREE.Group(); holder.position.set(at[0], at[1], at[2] - BACK); holder.rotation.y = Math.PI; g.add(holder); // its back to the wall

  // the machine: the body and the port
  const machine = new THREE.Group(); machine.name = spot.name; holder.add(machine);
  const { map, shine } = atlas(lite); map.anisotropy = anisotropy;
  const body = new THREE.Mesh(bodyGeometry(), new THREE.MeshStandardMaterial({ map, roughnessMap: shine, metalnessMap: shine, roughness: 1, metalness: 1 }));
  body.castShadow = body.receiveShadow = true; machine.add(body);
  const port = new THREE.Mesh(portGeometry(n), portMaterial(n, lite));
  port.castShadow = port.receiveShadow = false; machine.add(port);

  // the microphone and the headphones
  const mic = hotspots.find((h) => h.name === `${spot.name}_mic`);
  if (mic) {
    const m = new THREE.Mesh(micGeometry(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.15 }));
    m.name = mic.name; m.castShadow = !lite; m.receiveShadow = true; holder.add(m);
  }
  // the chart: one box, its face the canvas, its other sides a spot of the frame
  const board = hotspots.find((h) => h.name === `${spot.name}_board`);
  if (board) {
    const geo = new THREE.BoxGeometry(...CHART, 0.024), uv = geo.attributes.uv;
    for (let i = 0; i < uv.count; i++) if (i < 16 || i > 19) uv.setXY(i, 0.5, 0.008);
    const tex = chartArt(lite); tex.anisotropy = anisotropy;
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85, emissiveMap: tex, emissive: '#ffffff', emissiveIntensity: 0.16 })); // a little of its own light, as the ▲ grid chart has: the corner is dark by night
    m.name = board.name; m.position.set(0, 1.75, 0.013 - BACK); m.castShadow = false; m.receiveShadow = true; holder.add(m);
  }

  // the world in the port. The hover's glow gives the port a copy of its material, so the
  // uniforms are always reached through the mesh.
  let cur = 0, shown = -1, t0 = -1e3, now = 0;
  const show = (i) => {
    const u = port.material.uniforms, w = worlds[i];
    u.uA.value.set(w.colors[0]); u.uB.value.set(w.colors[1]); u.uC.value.set(w.colors[2]);
    u.uRing.value = w.ring ? 1 : 0; u.uMoons.value = lite ? 0 : Math.min(2, w.moons ?? 0); u.uSeed.value = 1.3 + i * 2.17; u.uOn.value = i;
    shown = i;
  };
  show(0);
  const ease = (x) => x * x * (3 - 2 * x);
  g.userData.simulator = {
    get world() { return worlds[cur]; },
    label: () => `${cfg.label}: ${worlds[cur].name}`,
    hint: () => `${worlds[cur].line} · ${cfg.hint}`,
    next() { cur = (cur + 1) % n; if (still) show(cur); else t0 = now; },
  };
  return (t) => {
    now = t;
    const u = port.material.uniforms, k = (t - t0) / Math.max(0.1, cfg.tune ?? 0.9);
    if (shown !== cur && (still || k >= 0.5)) show(cur); else if (u.uOn.value !== shown) show(shown); // a copy of the material starts from the first world
    u.uTime.value = still ? 2 : t;
    const tuning = !still && k >= 0 && k < 1;
    u.uGrow.value = tuning ? (k < 0.5 ? 1 - ease(k * 2) : ease(k * 2 - 1)) : 1;
    u.uFlux.value = tuning ? Math.sin(Math.PI * k) : 0;
  };
}
