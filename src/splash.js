import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// The water balloon that hangs over the aquarium, and what its water does when a click bursts it.
//
// It is a small simulation, at real speed and in metres, of what a fast camera shows:
//
//   the burst    the rubber tears from where it was clicked and snaps back to the knot in a
//                twentieth of a second, a limp rag on the string; for that instant the water keeps
//                the balloon's shape, a fine spray torn off its skin;
//   the fall     the water falls as one body, g = 9.81 m/s², relaxing from a pear to a ball and
//                wobbling, half a metre in a third of a second;
//   the splash   it opens a crater in the tank's water; a crown rises round it, a thin sheet that
//                leans out, breaks into fingers and throws drops (each one a ballistic body with
//                the air's drag); the crater closes and a jet shoots up from its middle, necks and
//                lets go of a few big drops (Worthington's jet); air is carried under and comes
//                back up as bubbles;
//   the rings    every thing that falls into the water leaves rings, by Cauchy and Poisson's
//                solution for deep water: after a time τ the wave at a distance r has the
//                wavenumber k = gτ²/4r², so long waves lead and short ones trail. They run to the
//                glass and come back (mirror sources), and the buoys ride them (`height`).
//
// Then the water rests, and a new balloon is filled on the string, in the next colour.
//
// Draw calls: the bracket (1), the string with its knot (1) and the balloon, or the rag it leaves
// (1), always; while it lasts, the falling water (1), the crown and the jet (1), and one pool (1) of
// instanced quads for every drop, bubble, run on the glass and wet spot it leaves. On the laptop's
// look the room is drawn once more, at half size, for each frame of the second the splash lasts:
// the water bends that picture, as a lens does (`grab`).
// The phone's look gets a quarter of the drops, no such picture, and the rings' slope at the vertices.
// Everything moves from the room's clock, in fixed steps, with a seeded dice, so `just record`
// films the same splash every time. Under reduced motion a click only lets the water down:
// the balloon is gone, the rings spread, nothing flies.
//
// What is computed and what is drawn from a fit is said in README.md, "The water balloon".

const G = 9.81;
export const RIPPLES = 10;        // ring sources the surface carries: the fall, its four mirrors, the jet's fall back, four drops
const GROW = 1.1, GROW_T = 0.12;  // the crater's rim runs out from r0 to (1 + GROW) r0, most of it in GROW_T seconds
const UP = 2.0;                   // the crown's rim is thrown up at about UP m/s (more here, less there) and falls as anything falls
const LEAN = 0.2;                 // how far the rim leans out, of its height
const DEEP = 2.0;                 // the crater's depth, in its first radius
const JET0 = 0.3, JET_UP = 2.25;  // the jet: when the crater has closed, and how fast its tip leaves
const JET_T = 2 * JET_UP / G;     // how long its tip is in the air
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const crownRadius = (a, r0) => r0 * (1 + GROW * (1 - Math.exp(-a / GROW_T)));
// the rim is never a perfect ring: it is thrown harder here than there (the same sums in the crown's shader)
const lobesAt = (th) => 1 + 0.2 * Math.sin(th * 3 + 0.7) + 0.14 * Math.sin(th * 5 + 2.1) + 0.1 * Math.sin(th * 8 + 4.4) + 0.06 * Math.sin(th * 13 + 1) + 0.04 * Math.sin(th * 21 + 3.3) + 0.03 * Math.sin(th * 34 + 0.2);
const throwAt = (th) => 0.5 + 0.5 * lobesAt(th);                       // 0.72 to 1.28 of UP
const rimRise = (a, th) => Math.max(0, UP * throwAt(th) * a - 0.5 * G * a * a);
const rimTime = (th) => 2 * UP * throwAt(th) / G;                      // how long the rim is in the air there
const CROWN_T = 2 * UP * 1.29 / G;                                     // and the longest of them
const fingerAt = (th) => smooth(0.7, 0.98, 0.5 + 0.5 * Math.sin(th * 11 + 1.6 * Math.sin(th * 3 + 0.5) + 0.8 * Math.sin(th * 7)));
const LOBES_GLSL = 'float lobesAt(float th) { return 1.0 + 0.2 * sin(th * 3.0 + 0.7) + 0.14 * sin(th * 5.0 + 2.1) + 0.1 * sin(th * 8.0 + 4.4) + 0.06 * sin(th * 13.0 + 1.0) + 0.04 * sin(th * 21.0 + 3.3) + 0.03 * sin(th * 34.0 + 0.2); }';
const f = (n, d = 4) => n.toFixed(d);

function dice(a) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// ── the rings, in GLSL for the surface and in JavaScript for the buoys: the same sums ──
export const RIPPLE_GLSL = /* glsl */`
  uniform vec4 uRip[${RIPPLES}];   // x, z, when it fell, how high its waves are
  uniform vec2 uRipK[${RIPPLES}];  // the wavenumber it made most of, and how long its waves last
  uniform vec4 uImpact;            // the balloon's water: x, z, when, and the radius of the crater it opens (0: none)
  uniform vec4 uTank;              // the tank's water: x0, z0, how far across (x), how far along (z)
  uniform vec4 uSlosh;             // the tank's own two slow waves: when they began, how high, the share across, the share along
  uniform vec2 uSloshW;            // and how fast each swings, rad/s
  uniform float uNow;
  float ring(vec2 p, vec4 s, vec2 q) {
    float tau = uNow - s.z; if (s.w == 0.0 || tau <= 0.0) return 0.0;
    float r = length(p - s.xy) + 0.012;
    float k = ${f(G / 4)} * tau * tau / (r * r);       // the wave that is at r after tau (Cauchy, Poisson)
    float x = k / q.x;
    return s.w * x * exp(1.0 - x) * cos(k * r) * sqrt(0.05 / (r + 0.05)) * exp(-tau / q.y);
  }
  // the whole tank swings: half a wave across it, a whole wave along it (the fall is in the middle of its length)
  float slosh(vec2 p) {
    float tau = uNow - uSlosh.x; if (uSlosh.y == 0.0 || tau <= 0.0) return 0.0;
    vec2 q = (p - uTank.xy) / uTank.zw;
    return -uSlosh.y * exp(-tau / 4.5) * (uSlosh.z * cos(3.14159 * q.x) * sin(uSloshW.x * tau) + uSlosh.w * cos(6.28318 * q.y) * sin(uSloshW.y * tau));
  }
  float rings(vec2 p) { float h = slosh(p); for (int i = 0; i < ${RIPPLES}; i++) h += ring(p, uRip[i], uRipK[i]); return h; }
  // where the water fell: the crater (a round-bottomed bowl), the lip the crown stands on, the swell
  // the pushed water raises, which runs out ahead of the rings, and the mound the jet stands on and sinks into
  float crater(vec2 p) {
    float a = uNow - uImpact.z; if (uImpact.w == 0.0 || a <= 0.0 || a > 1.4) return 0.0;
    float r = length(p - uImpact.xy);
    float r0 = uImpact.w, rb = r0 * (1.0 + ${f(GROW, 2)} * (1.0 - exp(-a / ${f(GROW_T, 2)})));
    float q = r / (0.9 * rb);
    float hole = -${f(DEEP, 1)} * r0 * smoothstep(0.0, 0.13, a) * (1.0 - smoothstep(0.15, 0.32, a)) * pow(max(0.0, 1.0 - q * q), 0.7);
    float lip = 0.03 * exp(-pow((r - rb) / 0.022, 2.0)) * smoothstep(0.0, 0.025, a) * (1.0 - smoothstep(0.15, 0.5, a));
    float swell = 0.022 * exp(-pow((r - rb - 0.75 * a) / 0.06, 2.0)) * sqrt(rb / (r + 0.02)) * smoothstep(0.0, 0.06, a) * exp(-a / 0.45);
    float mound = 0.035 * exp(-r * r / (0.9 * r0 * r0)) * smoothstep(0.26, 0.36, a) * (1.0 - smoothstep(0.7, 1.15, a));
    return hole + lip + swell + mound;
  }`;

// ── how water looks from the room ──
// On the laptop's look it is a lens: `uScene` is the room as it was drawn without the splash, and the
// water shows it bent (a ball of water turns it upside down), dark towards its edge, with the lamps'
// glints. Without that picture (a phone, uGrab 0) it mirrors and gathers a made-up room (`around`).
const WATER_GLSL = /* glsl */`
  uniform vec3 uGlow, uAir, uWall, uLampAt, uHangAt;
  uniform float uLamp, uHang, uGrab;
  uniform sampler2D uScene; uniform vec2 uInvSize, uLens;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) { vec2 i = floor(p), u = fract(p); u = u * u * u * (u * (u * 6.0 - 15.0) + 10.0);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y); }
  float soft(vec2 p) { return 0.6 * noise(p) + 0.4 * noise(p * mat2(1.6, 1.2, -1.2, 1.6) + 9.7); } // two layers, turned: no grid shows
  float hash3(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
  float noise3(vec3 p) { vec3 i = floor(p), u = fract(p); u = u * u * (3.0 - 2.0 * u);
    return mix(mix(mix(hash3(i), hash3(i + vec3(1.0, 0.0, 0.0)), u.x), mix(hash3(i + vec3(0.0, 1.0, 0.0)), hash3(i + vec3(1.0, 1.0, 0.0)), u.x), u.y),
               mix(mix(hash3(i + vec3(0.0, 0.0, 1.0)), hash3(i + vec3(1.0, 0.0, 1.0)), u.x), mix(hash3(i + vec3(0.0, 1.0, 1.0)), hash3(i + vec3(1.0, 1.0, 1.0)), u.x), u.y), u.z); }
  vec3 around(vec3 d) {
    float y = d.y + 0.3 * (soft(d.xz * 2.3 + d.y) - 0.5);       // no room has a straight horizon
    vec3 c = uAir * (0.6 + 0.4 * y);
    c = mix(c, uWall, smoothstep(0.25, 0.9, d.x) * 0.7);       // the painted wall behind the tank
    c += uGlow * smoothstep(0.3, -0.9, y);                     // the lit tank below
    return c;
  }
  // the room behind, seen through water with this normal (in the camera's axes): size is the lens's radius, in metres
  vec3 behind(vec3 nView, vec3 at, float size) {
    vec2 off = nView.xy * size * 1.6 * uLens / max(0.05, length(cameraPosition - at));
    off *= min(1.0, 0.12 / max(length(off), 1e-4));            // from close by it would look out of the picture: no further than an eighth of it
    return texture2D(uScene, clamp(gl_FragCoord.xy * uInvSize - off, 0.003, 0.997)).rgb;
  }
  // body: how much of what is behind it the water hides or bends where you look straight through
  // tight: how small the lamps' glints are. size: the radius of the lens it is, in metres
  vec4 water(vec3 n, vec3 v, vec3 at, float body, float tight, float size) {
    float nv = max(dot(n, v), 0.0);
    float F = 0.02 + 0.98 * pow(1.0 - nv, 5.0);
    vec3 L = normalize(vec3(uLampAt.x, uLampAt.y, clamp(at.z, uLampAt.z - 0.65, uLampAt.z + 0.65)) - at);
    vec3 L2 = normalize(uHangAt - at);
    vec3 r = reflect(-v, n);
    float spec = uLamp * pow(max(dot(r, L), 0.0), tight) + uHang * pow(max(dot(r, L2), 0.0), tight * 1.2);
    if (uGrab > 0.5) {
      vec3 through = behind((viewMatrix * vec4(n, 0.0)).xyz, at, size) * vec3(0.9, 0.97, 1.0);
      through *= mix(0.3, 1.0, smoothstep(0.0, 0.45, nv));     // towards its edge the light is bent away
      vec3 c = mix(through, around(r), F * 0.8) + vec3(0.86, 0.95, 1.0) * spec * 2.0;
      float a = clamp(max(body, F) + spec, 0.0, 1.0);
      return vec4(c * a, a);
    }
    vec3 bent = normalize(-v - 1.25 * (n - v * nv));           // the other side, upside down
    float gather = uLamp * pow(max(dot(bent, L), 0.0), 10.0) + uHang * 0.5 * pow(max(dot(bent, L2), 0.0), 14.0); // light gathered on the far side
    vec3 c = mix(around(bent) * vec3(0.84, 0.95, 1.0), around(r), F) + vec3(0.86, 0.95, 1.0) * (spec * 2.2 + gather * 0.22);
    float a = clamp(mix(body * 0.5, 1.0, F) + spec + gather * 0.12, 0.0, 1.0);
    return vec4(c * a, a);
  }`;

// The pear a balloon full of water hangs in: u is 1 at the knot and -1 at the bottom.
const pearR = (u) => Math.sqrt(Math.max(0, 1 - u * u)) * (1 - 0.3 * smooth(-0.1, 1, u));
const pearY = (u) => 1.02 * u + 0.3 * smooth(0.25, 1, u) * u;
function pear(R, seg, rows) {
  const geo = new THREE.SphereGeometry(1, seg, rows), p = geo.attributes.position, n = geo.attributes.normal;
  for (let i = 0; i < p.count; i++) {
    const u = THREE.MathUtils.clamp(p.getY(i), -1, 1), s = Math.hypot(p.getX(i), p.getZ(i)), cx = s > 1e-6 ? p.getX(i) / s : 0, cz = s > 1e-6 ? p.getZ(i) / s : 0;
    const e = 0.002, dr = pearR(Math.min(1, u + e)) - pearR(Math.max(-1, u - e)), dy = pearY(Math.min(1, u + e)) - pearY(Math.max(-1, u - e)), l = Math.hypot(dr, dy) || 1;
    p.setXYZ(i, cx * pearR(u) * R, pearY(u) * R, cz * pearR(u) * R);
    if (s > 1e-6) n.setXYZ(i, cx * dy / l, -dr / l, cz * dy / l); else n.setXYZ(i, 0, Math.sign(u), 0);
  }
  return geo;
}
const paint = (geo, color, hold) => {
  const g = geo.index ? geo.toNonIndexed() : geo, n = g.attributes.position.count, c = new THREE.Color(color).toArray();
  g.setAttribute('color', new THREE.BufferAttribute(Float32Array.from({ length: n * 3 }, (_, i) => c[i % 3]), 3));
  g.setAttribute('hold', new THREE.BufferAttribute(new Float32Array(n).fill(hold), 1));
  g.deleteAttribute('uv');
  return g;
};

// `tank`: where the water is, in the room's own metres: its surface's height, the rim of the glass,
// the footprint of the glass (x0 the pane towards the room, x1 the one at the wall) and of the
// cabinet under it, the wall behind, the lamp's bar and the sand. `ripples` comes from `createRipples`.
export function buildSplash(parent, { cfg = {}, tank, ripples, lite = false, still = false, name = 'balloon' }) {
  const R = cfg.radius ?? 0.07, S = 0.07;                     // the balloon's radius, the string's length
  const R0 = 0.9 * R;                                         // the crater's first radius: about the falling water's own
  const colors = (cfg.colors?.length ? cfg.colors : ['#1682D4']).map((c) => new THREE.Color(c));
  const speed = cfg.speed ?? 1, refill = cfg.refill ?? 6;
  const at = new THREE.Vector3(tank.x0 + (tank.x1 - tank.x0) * (cfg.across ?? 0.36), tank.waterY + (cfg.height ?? 0.5) + 1.02 * R, (tank.z0 + tank.z1) / 2); // the balloon's middle
  const TOP = -S - 0.012, CY = TOP - pearY(1) * R;            // in the hook's frame: the balloon's top (its knot) and its middle
  const hook = new THREE.Vector3(at.x, at.y - CY, at.z);
  const group = new THREE.Group(); group.name = 'splash'; parent.add(group);
  const handle = { group, onImpact: null, onPop: null, scare: null }; // onPop, onImpact: the sounds (src/app.js); scare: the fish (src/props.js)
  ripples.setTank(tank);

  // ── the bracket on the wall: a plate, an arm, a brace and a brass hook ──
  const arm = tank.wall - hook.x + 0.03, wood = '#5a3d28', dark = '#3f2a1b';
  const brace = new THREE.BoxGeometry(0.2, 0.014, 0.02).rotateZ(-Math.PI / 4).translate(tank.wall - 0.075 - hook.x, 0.02 - 0.07, 0);
  const bracket = new THREE.Mesh(mergeGeometries([
    paint(new THREE.BoxGeometry(0.014, 0.2, 0.05).translate(tank.wall - 0.007 - hook.x, -0.045, 0), dark, 1),
    paint(new THREE.BoxGeometry(arm, 0.02, 0.028).translate(arm / 2 - 0.03, 0.02, 0), wood, 1),
    paint(brace, wood, 1),
    paint(new THREE.TorusGeometry(0.006, 0.0016, 6, 12, Math.PI * 1.5).rotateZ(Math.PI * 0.75).translate(0, 0.004, 0), '#b08a3c', 1),
  ]), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, metalness: 0.1 }));
  bracket.position.copy(hook); bracket.castShadow = true; bracket.receiveShadow = true; group.add(bracket);

  // ── what hangs from the hook and swings: the string with its knot, and on it the balloon or, once
  // it has burst, the rag of rubber it leaves. Each is its own mesh with its own real shape, so every
  // pass that draws the room (the shadows of the corners too) sees what is there ──
  const swing = new THREE.Group(); swing.position.copy(hook); group.add(swing);
  const rubberLook = { vertexColors: true, roughness: 0.22, metalness: 0, emissive: '#000000' };
  const cordGeo = mergeGeometries([
    paint(new THREE.CylinderGeometry(0.0042, 0.0085, 0.014, 10).translate(0, TOP + 0.006, 0), '#ffffff', 2),
    paint(new THREE.TorusGeometry(0.0052, 0.0024, 6, 12).rotateX(Math.PI / 2).translate(0, TOP + 0.0135, 0), '#ffffff', 2),
    paint(new THREE.CylinderGeometry(0.0009, 0.0009, S, 5).translate(0, -S / 2, 0), '#e8e2d2', 1),
  ]);
  const cord = new THREE.Mesh(cordGeo, new THREE.MeshStandardMaterial(rubberLook)); cord.castShadow = false; cord.raycast = () => {}; swing.add(cord);
  // the balloon: a pear of rubber, hung by its top. A burst tears it from uTear (the click), and for
  // that twentieth of a second its skin runs to the knot in the vertex shader; filling, it is scaled
  const geo = paint(pear(R, lite ? 20 : 32, lite ? 14 : 22).translate(0, CY - TOP, 0), '#ffffff', 0);
  const pop = { value: 0 }, tear = { value: new THREE.Vector3(-1, 0, 0) };
  const rubber = new THREE.MeshStandardMaterial({ ...rubberLook, side: THREE.DoubleSide });
  rubber.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, { uPop: pop, uTear: tear });
    s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nuniform float uPop; uniform vec3 uTear;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        if (uPop > 0.0) {
          float d = acos(clamp(dot(normalize(transformed - vec3(0.0, ${f(CY - TOP)}, 0.0)), uTear), -1.0, 1.0)) / 3.14159;
          float k = smoothstep(0.0, 0.25, uPop * 1.25 - d);
          transformed = mix(transformed, vec3(transformed.x * 0.12, transformed.y * 0.22, transformed.z * 0.12), k);
        }`);
  };
  rubber.customProgramCacheKey = () => 'splash-rubber';
  const balloon = new THREE.Mesh(geo, rubber); balloon.name = name; balloon.position.set(0, TOP, 0);
  balloon.castShadow = false; balloon.receiveShadow = false; swing.add(balloon);
  const hit = THREE.Mesh.prototype.raycast;
  balloon.raycast = function (...a) { if (state === 'ready') hit.apply(this, a); }; // nothing to click while it is gone
  // the rag: two limp, wrinkled strips of thick rubber under the knot, a few centimetres long
  const strip = (w, l, turn, seed) => {
    const g = new THREE.PlaneGeometry(w, l, 4, 10).translate(0, -l / 2, 0), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), k = -y / l, wide = 0.45 + 0.55 * Math.sin(Math.min(1, k * 1.15) * Math.PI * 0.8), tw = turn + k * 1.9 + seed;
      const px = x * wide + 0.0035 * k * Math.sin(k * 5 + seed), pz = 0.0022 * Math.sin(k * 17 + x * 300 + seed) * k + 0.002 * k * k * 6 * Math.cos(seed);
      p.setXYZ(i, px * Math.cos(tw) + pz * Math.sin(tw), y * (1 + 0.12 * Math.sin(x * 400 + seed)), -px * Math.sin(tw) + pz * Math.cos(tw));
    }
    g.computeVertexNormals(); return g;
  };
  const rag = new THREE.Mesh(mergeGeometries([strip(0.015, 0.036, 0.2, 1.3), strip(0.011, 0.026, 1.5, 4.1), strip(0.008, 0.019, 2.9, 2.2)]),
    new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.55, side: THREE.DoubleSide }));
  rag.position.set(0, TOP + 0.002, 0); rag.visible = false; rag.castShadow = false; rag.raycast = () => {}; swing.add(rag);
  let colorAt = 0;
  function tint(c) { // the balloon and the knot take the colour; the string keeps its own
    for (const g of [geo, cordGeo]) {
      const col = g.attributes.color, hold = g.attributes.hold;
      for (let i = 0; i < col.count; i++) if (hold.getX(i) !== 1) col.setXYZ(i, c.r, c.g, c.b);
      col.needsUpdate = true;
    }
    for (const m of [balloon.material, balloon.userData.baseMat]) m?.emissive.copy(c).multiplyScalar(0.07); // a little light comes through the rubber
  }
  tint(colors[0]);

  // ── the light the water takes: the tank's lamp and its glow below, the room's lamp, the air ──
  const light = {
    uGlow: { value: new THREE.Color() }, uAir: { value: new THREE.Color() }, uWall: { value: new THREE.Color() },
    uLampAt: { value: new THREE.Vector3(...tank.lamp) }, uHangAt: { value: new THREE.Vector3(...(tank.hang ?? [0, 2.4, 0.9])) },
    uLamp: { value: 1 }, uHang: { value: 1 },
    uScene: { value: null }, uInvSize: { value: new THREE.Vector2(1, 1) }, uLens: { value: new THREE.Vector2(1, 1) }, uGrab: { value: 0 },
  };
  let wasDay = null;
  function setDay(day) {
    if (day === wasDay) return; wasDay = day;
    light.uGlow.value.set(day ? '#5fb6cf' : '#49b4d6').multiplyScalar(day ? 1.2 : 1.25);
    light.uAir.value.set(day ? '#9fb0bf' : '#3a3530').multiplyScalar(day ? 1.0 : 0.35);
    light.uWall.value.set(cfg.wall ?? '#8fb6d6').multiplyScalar(day ? 1.0 : 0.2);
    light.uLamp.value = day ? 0.7 : 1; light.uHang.value = day ? 0 : 0.8;
  }
  setDay(false);
  // what each of the water's meshes needs before it is drawn: the size of the picture it is drawn into
  const size = new THREE.Vector2();
  const lens = (renderer, scene, camera) => {
    const t = renderer.getRenderTarget();
    if (t) size.set(t.width, t.height); else renderer.getDrawingBufferSize(size);
    light.uInvSize.value.set(1 / size.x, 1 / size.y);
    light.uLens.value.set(camera.projectionMatrix.elements[0] / 2, camera.projectionMatrix.elements[5] / 2);
  };

  // ── the falling water: the balloon's own shape, let go ──
  const fall = { uAt: { value: new THREE.Vector3() }, uAge: { value: 0 }, uTear: tear, uSurf: { value: tank.waterY }, ...light, ...ripples.uniforms };
  const blobGeo = pear(R * 0.955, lite ? 24 : 44, lite ? 16 : 30);
  const blob = new THREE.Mesh(blobGeo, new THREE.ShaderMaterial({
    uniforms: fall, transparent: true, premultipliedAlpha: true, depthWrite: false,
    vertexShader: /* glsl */`
      uniform vec3 uAt, uTear; uniform float uAge; varying vec3 vN, vW; varying float vSkin;
      void main() {
        vec3 dir = normalize(position);
        float ease = smoothstep(0.0, 0.4, uAge), free = smoothstep(0.0, 0.08, uAge);
        vec3 p = mix(position, dir * ${f(R * 1.0)}, ease * 0.85);               // the pear relaxes towards a ball
        // and wobbles, free of its skin: three slow lobes that turn at their own speeds
        float wob = 0.4 * sin(dir.y * 4.0 + uAge * 31.0) + 0.35 * sin(dot(dir, vec3(3.1, 1.7, -2.3)) * 2.6 - uAge * 23.0) + 0.25 * sin(dot(dir, vec3(-1.3, 2.2, 2.9)) * 3.4 + uAge * 17.0);
        p *= 1.0 + 0.085 * wob * free;
        float tail = smoothstep(0.25, 1.0, dir.y);                             // the top is left a little behind
        p.y *= dir.y < 0.0 ? 1.0 - 0.14 * ease : 1.0 + 0.45 * uAge * tail;     // and the air flattens what leads
        p.xz *= 1.0 - 0.2 * uAge * tail * tail;
        vN = normalize(mix(normal, dir, ease * 0.85) + 0.3 * wob * dir.yzx * free);
        vSkin = acos(clamp(dot(dir, uTear), -1.0, 1.0)) / 3.14159;
        vW = uAt + p;
        gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.0);
      }`,
    fragmentShader: /* glsl */`
      uniform float uAge, uSurf; uniform vec3 uAt; varying vec3 vN, vW; varying float vSkin;
      ${WATER_GLSL}
      ${RIPPLE_GLSL}
      void main() {
        if (vW.y < uSurf + crater(vW.xz) + 0.004) discard;                       // what is under the surface is the tank's water now
        if (vSkin > uAge * ${f(1.25 / 0.055, 2)} + 0.03) discard;                  // and what the rubber still covers is the balloon
        vec3 v = normalize(cameraPosition - vW);
        // the skin the rubber left: fine ripples that run from the tear and calm down
        float rough = (1.0 - smoothstep(0.04, 0.26, uAge)) * smoothstep(0.0, 0.2, uAge * 22.0 - vSkin);
        vec3 n = normalize(vN + rough * 0.3 * (vec3(soft(vW.xy * 150.0), soft(vW.yz * 150.0), soft(vW.zx * 150.0)) - 0.5));
        if (dot(n, v) < 0.0) n = reflect(n, v);
        float under = 1.0 - smoothstep(${f(-R * 0.6)}, ${f(R * 1.2)}, uAt.y - uSurf);     // as it goes under it is the tank's water, less and less a lens of its own
        gl_FragColor = water(n, v, vW, 0.96, 140.0, ${f(R)} * (1.0 - 0.85 * under));
      }`,
  }));
  blob.frustumCulled = false; blob.visible = false; blob.renderOrder = 5; blob.raycast = () => {}; blob.onBeforeRender = lens; group.add(blob);

  // ── the crown and the jet: two sheets of revolution, shaped in the vertex shader from the time since the fall ──
  const sheetGeo = (() => {
    const grid = (nu, nv, part) => {
      const pos = [], idx = [];
      for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) pos.push(i / nu, j / nv, part);
      for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); return g;
    };
    return mergeGeometries(lite ? [grid(60, 10, 0), grid(14, 16, 1)] : [grid(192, 24, 0), grid(28, 40, 1)]);
  })();
  const crown = { uAt: { value: new THREE.Vector3() }, uAge: { value: 0 }, uRim: { value: tank.rimY }, uTank: ripples.uniforms.uTank, ...light };
  const sheet = new THREE.Mesh(sheetGeo, new THREE.ShaderMaterial({
    uniforms: crown, transparent: true, premultipliedAlpha: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      uniform vec3 uAt; uniform float uAge; varying vec3 vN, vW, vUp; varying vec3 vUv3; varying float vPhase, vSize;
      const float TAU = 6.28318;
      ${LOBES_GLSL}
      vec3 crownAt(float u, float v) {
        float a = uAge, th = u * TAU;
        float rb = ${f(R0)} * (1.0 + ${f(GROW, 2)} * (1.0 - exp(-a / ${f(GROW_T, 2)})));
        float fast = ${f(UP, 2)} * (0.5 + 0.5 * lobesAt(th));                                 // how hard the rim is thrown here
        float rise = max(0.0, fast * a - ${f(G / 2)} * a * a);                               // up, and down again as anything falls
        float phase = a * ${f(G / 2)} / fast;                                                // 0 as it leaves, 1 as it lands
        float finger = smoothstep(0.7, 0.98, 0.5 + 0.5 * sin(th * 11.0 + 1.6 * sin(th * 3.0 + 0.5) + 0.8 * sin(th * 7.0)));
        float h = rise * pow(v, 0.8) + 0.04 * finger * smoothstep(0.15, 0.6, phase) * pow(v, 6.0) * step(1e-4, rise); // the rim gathers into thin threads
        float rough = 0.006 * sin(th * 23.0 + v * 7.0 - a * 31.0) + 0.004 * sin(th * 37.0 - v * 11.0 + a * 17.0) + 0.003 * sin(th * 61.0 + v * 5.0 + a * 9.0); // never smooth
        float r = rb + ${f(LEAN, 2)} * rise * v * (0.5 + 0.5 * v) + rough * v * smoothstep(0.02, 0.1, a);
        return uAt + vec3(cos(th) * r, h, sin(th) * r);
      }
      float jetRadius(float v, float a) {
        float rad = mix(0.034, 0.0065, pow(v, 0.6));                                        // a column, thinner upwards
        float neck = smoothstep(0.06, 0.2, a) * v * v;                                      // it necks before it breaks (Rayleigh, Plateau)
        rad *= 1.0 + neck * (0.3 * sin(v * 17.0 - a * 6.0) + 0.18 * sin(v * 29.0 + a * 4.0 + 1.3));
        rad += 0.008 * exp(-pow((v - 0.9) / 0.08, 2.0)) * (1.0 - smoothstep(0.19, 0.21, a)); // the drop at its tip, until it lets go
        float end = max(0.0, (v - 0.93) / 0.07);
        return rad * sqrt(max(0.0, 1.0 - end * end)) * smoothstep(0.0, 0.04, a);            // a round end
      }
      vec3 jetAt(float u, float w) {
        float a = uAge - ${f(JET0, 2)}, th = u * TAU; if (a <= 0.0) return uAt - vec3(0.0, 0.05, 0.0);
        float v = 1.0 - (1.0 - w) * (1.0 - w);                                              // more rows where its tip is
        float tip = max(0.0, ${f(JET_UP, 2)} * a - ${f(G / 2)} * a * a) * (1.0 - 0.28 * smoothstep(0.2, 0.3, a)); // up 26 cm and back; shorter when its tip has let go
        float rad = jetRadius(v, a);
        vec2 bend = (vec2(0.045, -0.025) * v * v * sin(a * 5.0 + 0.5) + 0.012 * v * vec2(sin(v * 9.0 + a * 14.0), cos(v * 7.0 - a * 11.0))) * tip; // never quite straight
        return uAt + vec3(cos(th) * rad + bend.x, tip * v - 0.02, sin(th) * rad + bend.y);
      }
      vec3 at(float u, float v, float part) { return part < 0.5 ? crownAt(u, v) : jetAt(u, v); }
      void main() {
        float e = 0.004;
        vec3 p = at(position.x, position.y, position.z);
        vec3 du = at(position.x + e, position.y, position.z) - p, dv = at(position.x, min(1.0, position.y + e), position.z) - at(position.x, min(1.0, position.y + e) - e, position.z);
        vN = normalize(cross(dv, du) + vec3(0.0, 1e-7, 0.0));                              // outwards, on both sheets
        vUp = normalize(dv + vec3(0.0, 1e-7, 0.0));
        vW = p; vUv3 = position;
        if (position.z < 0.5) { vPhase = uAge * ${f(G / 2)} / (${f(UP, 2)} * (0.5 + 0.5 * lobesAt(position.x * TAU))); vSize = 0.035; }
        else { float w = position.y; vPhase = 0.0; vSize = max(0.004, jetRadius(1.0 - (1.0 - w) * (1.0 - w), uAge - ${f(JET0, 2)})); }
        gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: /* glsl */`
      uniform float uAge, uRim; uniform vec4 uTank; varying vec3 vN, vW, vUp; varying vec3 vUv3; varying float vPhase, vSize;
      ${WATER_GLSL}
      void main() {
        vec3 v = normalize(cameraPosition - vW), n = normalize(vN);
        vec2 q = (vW.xz - uTank.xy) / uTank.zw;
        if (vW.y < uRim + 0.004 && (q.x < 0.0 || q.x > 1.0 || q.y < 0.0 || q.y > 1.0)) discard; // the glass stands where it stands
        float body = 0.5, keep = 1.0, froth = 0.0, tight = 110.0;
        if (vUv3.z < 0.5) { // the crown: thick and churned at its foot, a film above, a bead on every free edge; it tears into round holes, then threads
          float th = vUv3.x * 6.28318, w = vUv3.y;
          vec2 ring = vec2(cos(th), sin(th));
          float holes = 0.7 * noise3(vec3(ring * 4.2, w * 6.0 - uAge * 1.5)) + 0.3 * noise3(vec3(ring * 9.5, w * 13.0 + uAge * 2.0) + 5.3);
          float open = smoothstep(0.45, 1.05, vPhase) * (0.3 + 0.7 * w) * (1.0 - 0.7 * smoothstep(0.9, 1.0, w)); // the bead on the rim lasts
          float gap = holes - open;
          if (gap < 0.0) discard;
          float bead = max(smoothstep(0.86, 0.96, w), (1.0 - smoothstep(0.0, 0.1, gap)) * step(0.001, open));
          body = mix(mix(0.8, 0.5, smoothstep(0.0, 0.7, w)), 0.94, bead);
          keep = smoothstep(0.0, 0.012, uAge) * smoothstep(0.0, 0.025, gap + 0.025 * step(open, 0.001));
          if (w > 0.86) { float s = clamp((w - 0.93) / 0.07, -1.0, 1.0); n = normalize(n * sqrt(1.0 - s * s) + normalize(vUp) * s); } // the bead is round
          froth = smoothstep(0.45, 0.8, noise3(vec3(ring * 19.0, w * 6.0 - uAge * 26.0))) * (1.0 - smoothstep(0.0, 0.45, w)) * smoothstep(0.0, 0.04, uAge);
          tight = mix(60.0, 140.0, w);
          // a sheet of water is never flat: it is thicker here, thinner there, and what shows through it swims
          vec3 at3 = vec3(ring * 11.0, w * 15.0 - uAge * 5.0);
          n = normalize(n + 0.45 * (vec3(noise3(at3), noise3(at3 + 7.3), noise3(at3 + 13.1)) - 0.5));
        } else {            // the jet: a closed column, so only the side that faces you
          if (dot(n, v) < 0.0) discard;
          body = 0.95; tight = 120.0; keep = smoothstep(0.008, 0.04, vUv3.y);   // its foot is in the mound
        }
        if (dot(n, v) < 0.0) n = -n;
        gl_FragColor = (water(n, v, vW, body, tight, vSize) + vec4(uAir * 1.3 + uGlow * 0.22 + 0.03, 1.0) * froth * 0.3) * keep;
      }`,
  }));
  sheet.frustumCulled = false; sheet.visible = false; sheet.renderOrder = 5; sheet.raycast = () => {}; sheet.onBeforeRender = lens; group.add(sheet);

  // ── the drops, the spray, the bubbles, the runs on the glass and the wet spots: one pool of quads ──
  const N = Math.max(40, lite ? (cfg.liteDrops ?? 500) : (cfg.drops ?? 2000));
  const P = { x: new Float32Array(N * 3), v: new Float32Array(N * 3), m: new Float32Array(N * 4), life: new Float32Array(N), age: new Float32Array(N), kind: new Uint8Array(N) };
  // SMALL: a drop thrown up by a drop, which throws up nothing itself. WET: where a drop came to rest.
  const DROP = 0, MIST = 1, BUBBLE = 2, RUN = 3, SMALL = 4, WET = 6;
  let alive = 0, wets = 0;
  const quad = new THREE.InstancedBufferGeometry();
  quad.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); quad.setIndex([0, 1, 2, 0, 2, 3]);
  const aX = new THREE.InstancedBufferAttribute(P.x, 3), aV = new THREE.InstancedBufferAttribute(P.v, 3), aM = new THREE.InstancedBufferAttribute(P.m, 4);
  for (const a of [aX, aV, aM]) a.setUsage(THREE.DynamicDrawUsage);
  quad.setAttribute('iPos', aX); quad.setAttribute('iVel', aV); quad.setAttribute('iMisc', aM); quad.instanceCount = 0;
  const dropUniforms = { uPixel: { value: 0.002 }, uShutter: { value: cfg.shutter ?? 0.0035 }, uNow: ripples.uniforms.uNow, ...light };
  const drops = new THREE.Mesh(quad, new THREE.ShaderMaterial({
    uniforms: dropUniforms, transparent: true, premultipliedAlpha: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec3 iPos, iVel; attribute vec4 iMisc;   // iMisc: its radius, how much of it shows, its kind, its own number
      uniform float uPixel, uShutter, uNow;
      varying vec2 vP, vDir; varying vec3 vAt, vFace; varying vec4 vM; varying float vHalf, vR, vPx, vWob;
      void main() {
        float kind = iMisc.z;
        vFace = vec3(0.0); vWob = 0.0;
        if (kind > 5.5) { // a wet spot lies flat on what the drop fell on (iVel: that face's normal), a little out of round
          vec3 t1 = normalize(cross(iVel, vec3(0.31, 0.2, 0.93))), t2 = cross(iVel, t1);
          float c = cos(iMisc.w * 40.0), s = sin(iMisc.w * 40.0);
          vec2 o = vec2(position.x * (1.0 + 0.35 * c), position.y * (1.0 - 0.25 * c)) * iMisc.x;
          vec3 w = iPos + t1 * (o.x * c - o.y * s) + t2 * (o.x * s + o.y * c);
          vP = position.xy; vDir = vec2(0.0, 1.0); vHalf = 0.0; vR = 1.0; vPx = 0.0; vAt = w; vFace = iVel; vM = vec4(1.0, iMisc.y, kind, iMisc.w);
          gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
          return;
        }
        vec4 c = viewMatrix * vec4(iPos, 1.0);
        vec3 vv = (viewMatrix * vec4(iVel, 0.0)).xyz;
        float px = -c.z * uPixel;                                  // a pixel, in metres, where the drop is
        bool slow = kind > 1.5 && kind < 2.5;                      // a bubble: too slow to smear
        float r = max(iMisc.x, px * 0.6);                          // never much thinner than a pixel: a finer drop is drawn fainter
        float sp = length(vv.xy);
        vec2 dir = sp > 1e-4 ? vv.xy / sp : vec2(0.0, 1.0);
        float hl = slow ? 0.0 : sp * uShutter * 0.5;               // the streak an open shutter leaves
        if (kind > 0.5 && kind < 1.5) hl *= 0.5;
        if (kind > 2.5 && kind < 3.5) hl = iMisc.x * 2.4;          // a run on the glass: the bead, and the wet line above it
        // a drop in the air is never a ball for long: it swings between flat and long, faster the smaller it is
        if (kind < 0.5 || (kind > 3.5 && kind < 4.5)) vWob = 0.2 * sin(uNow * min(420.0, 0.75 / iMisc.x) + iMisc.w * 60.0) * smoothstep(0.0008, 0.003, iMisc.x);
        vP = vec2(position.x * (r * 1.25 + px), position.y * (hl + r * 1.25 + px));
        vDir = dir; vHalf = hl; vR = r; vPx = px; vAt = iPos;
        vM = vec4(iMisc.x / r, iMisc.y, kind, iMisc.w);
        gl_Position = projectionMatrix * vec4(c.xy + dir * vP.y + vec2(dir.y, -dir.x) * vP.x, c.z, 1.0);
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vP, vDir; varying vec3 vAt, vFace; varying vec4 vM; varying float vHalf, vR, vPx, vWob;
      ${WATER_GLSL}
      void main() {
        float kind = vM.z;
        vec3 v = normalize(cameraPosition - vAt);
        if (kind > 5.5) { // a wet spot: what it lies on a shade darker, and a sheen where the light skims it
          float q = length(vP), wet = (1.0 - smoothstep(0.55, 1.0, q)) * vM.y;
          if (wet <= 0.003) discard;
          float sheen = pow(1.0 - abs(dot(v, vFace)), 3.0), level = abs(vFace.y);
          gl_FragColor = vec4(around(reflect(-v, vFace)) * sheen * 0.4 * wet, wet * (mix(0.2, 0.42, level) + 0.25 * sheen));
          return;
        }
        float along = vP.y - clamp(vP.y, -vHalf, vHalf), wide = 1.0;
        if (kind > 2.5 && kind < 3.5) wide = mix(0.3, 1.0, smoothstep(-vHalf, vHalf, vP.y)); // a run: its bead leads, its line thins behind
        vec2 d = vec2(vP.x / ((1.0 - vWob) * wide), along / (1.0 + vWob));
        float q = length(d) / vR;
        float edge = 1.0 - smoothstep(1.0 - vPx / vR, 1.0 + 0.5 * vPx / vR, q);
        if (edge <= 0.0) discard;
        vec2 n2 = d / vR; float nz = sqrt(max(0.0, 1.0 - dot(n2, n2)));
        vec3 nView = vec3(vec2(vDir.y, -vDir.x) * n2.x + vDir * n2.y, nz);
        // smeared by the shutter, a drop is brightest in its middle and fades to both ends; finer than a pixel, it is fainter
        float streak = 1.0 - smoothstep(0.2, 1.0, abs(vP.y) / (vHalf + vR)) * smoothstep(0.6, 2.5, vHalf / vR);
        float smear = smoothstep(0.4, 1.6, vHalf / vR);            // how much of a streak it is
        float show = edge * vM.y * mix(1.0, vM.x, 0.75) * mix(1.0, vR / (vR + vHalf), 0.5) * streak * mix(1.0, sqrt(max(0.0, 1.0 - q * q)), smear);
        if (kind > 1.5 && kind < 2.5) {         // a bubble under water: a ball of air, bright where the light skims it, a glint on top
          float rim = smoothstep(0.35, 1.0, q), top = pow(max(0.0, dot(normalize(vec3(nView.xy, nz)), normalize(vec3(0.25, 0.8, 0.55)))), 14.0);
          float m = (0.14 + 0.6 * rim * rim) * edge * vM.y * mix(1.0, vM.x, 0.5);
          gl_FragColor = vec4(vec3(0.74, 0.93, 1.0) * (0.35 + 0.5 * uLamp) * m + vec3(top) * 0.8 * edge * vM.y, min(1.0, m + top * 0.6));
        } else if (kind > 0.5 && kind < 1.5) {  // the spray: too fine to have a shape
          gl_FragColor = vec4(around(vec3(0.0, -1.0, 0.0)) * 0.5 + uAir, 1.0) * 0.2 * show * (1.0 - q * q);
        } else {                                // a drop: a lens, clear in its middle, dark at its edge, with the lamps' glints
          float turn = vM.w * 37.0;             // no two hang the same way
          vec3 tilted = normalize(nView + 0.3 * nz * vec3(cos(turn), sin(turn), 0.0));
          vec3 n = normalize(tilted * mat3(viewMatrix));
          float nv = max(dot(n, v), 0.0);
          vec3 L = normalize(vec3(uLampAt.x, uLampAt.y, clamp(vAt.z, uLampAt.z - 0.65, uLampAt.z + 0.65)) - vAt), L2 = normalize(uHangAt - vAt);
          vec3 r = reflect(-v, n);
          float spec = uLamp * pow(max(dot(r, L), 0.0), 48.0) + uHang * pow(max(dot(r, L2), 0.0), 70.0);
          float dim = smoothstep(0.45, 1.0, q) * (1.0 - smear);    // a still drop's edge is dark; a streak has no edge
          float big = uGrab * smoothstep(1.2, 2.6, vR / max(vPx, 1e-5)) * (1.0 - 0.6 * smear); // big enough on the screen to be seen through
          vec3 bent = normalize(-v - 1.25 * (n - v * nv));
          float gather = uLamp * pow(max(dot(bent, L), 0.0), 12.0) + uHang * 0.5 * pow(max(dot(bent, L2), 0.0), 16.0);
          float m = 0.06 + 0.08 * dim;                             // a small one hardly shows but for its glint
          vec3 c = around(bent) * vec3(0.84, 0.95, 1.0) * mix(1.0, 0.12, dim) * m + vec3(0.86, 0.95, 1.0) * (spec * 2.0 + gather * 0.25);
          vec4 fine = vec4(c, min(1.0, m + spec + gather * 0.2));
          vec4 lensed = fine;
          if (big > 0.0) { vec3 through = behind(tilted, vAt, vR) * vec3(0.9, 0.97, 1.0) * mix(1.0, 0.6, dim); float m2 = 0.9 - 0.25 * dim; lensed = vec4(through * m2 + vec3(0.86, 0.95, 1.0) * spec * 2.0, m2); }
          gl_FragColor = mix(fine, lensed, big) * show;
        }
      }`,
  }));
  drops.frustumCulled = false; drops.visible = false; drops.renderOrder = 6; drops.raycast = () => {}; group.add(drops);
  drops.onBeforeRender = (renderer, scene, camera) => { lens(renderer, scene, camera); dropUniforms.uPixel.value = 2 / (camera.projectionMatrix.elements[5] * size.y); };

  function emit(kind, x, y, z, vx, vy, vz, radius, life, shows = 1) {
    if (alive >= N) return -1;
    const i = alive++;
    P.x[i * 3] = x; P.x[i * 3 + 1] = y; P.x[i * 3 + 2] = z; P.v[i * 3] = vx; P.v[i * 3 + 1] = vy; P.v[i * 3 + 2] = vz;
    P.m[i * 4] = radius; P.m[i * 4 + 1] = shows; P.m[i * 4 + 2] = kind; P.m[i * 4 + 3] = rnd();
    P.life[i] = life; P.age[i] = 0; P.kind[i] = kind;
    return i;
  }
  function kill(i) {
    const j = --alive; if (i === j) return;
    for (let k = 0; k < 3; k++) { P.x[i * 3 + k] = P.x[j * 3 + k]; P.v[i * 3 + k] = P.v[j * 3 + k]; }
    for (let k = 0; k < 4; k++) P.m[i * 4 + k] = P.m[j * 4 + k];
    P.life[i] = P.life[j]; P.age[i] = P.age[j]; P.kind[i] = P.kind[j];
  }
  // a drop that lands on wood, on the wall or on the floor stays there a while, a wet spot (nx, ny, nz: that face)
  function land(i, x, y, z, nx, ny, nz) {
    const rad = P.m[i * 4];
    if (rad < 0.001 || wets >= N * 0.2) { kill(i); return; }
    P.x[i * 3] = x; P.x[i * 3 + 1] = y; P.x[i * 3 + 2] = z; P.v[i * 3] = nx; P.v[i * 3 + 1] = ny; P.v[i * 3 + 2] = nz;
    P.kind[i] = WET; P.m[i * 4 + 2] = WET; P.m[i * 4] = Math.min(0.014, rad * 3) * (nx ? 0.6 : 1); P.m[i * 4 + 1] = 0; P.age[i] = 0; P.life[i] = 7 + rnd() * 5; wets++;
  }
  // how big a drop is: most are under a millimetre, a few are five (its radius, in metres)
  const dropSize = () => 0.0005 * Math.exp(2.4 * Math.pow(rnd(), 2.2));
  // air let go under the water at (x, y, z): fine bubbles, thrown no deeper than half the tank
  function fizz(n, x, y, z, wide, deep, push) {
    for (let i = 0; i < n; i++) {
      const th = rnd() * 6.283, rr = Math.sqrt(rnd()) * wide, sw = rnd();
      emit(BUBBLE, x + Math.cos(th) * rr, y - 0.008 - rnd() * deep, z + Math.sin(th) * rr, Math.cos(th) * rnd() * 0.4, -rnd() * push, Math.sin(th) * rnd() * 0.4, 0.0004 + 0.003 * sw * sw * sw * sw, 5);
    }
  }

  // ── the life of one burst ──
  const share = N / 2000;                     // the pool's size sets how much of each there is
  let rnd = dice(7), bursts = 0;
  let state = 'ready', now = 0, last = null, acc = 0;
  let t0 = -1e9, tHit = -1e9, hitAt = null, fallen = false, jetted = false, landed = false, sunk = false, slot = 0;
  let sprayAcc = 0, tailAcc = 0, crownAcc = 0, bubbleAcc = 0;
  const dropY0 = at.y, bottom = 1.02 * R * 0.955;
  const fallTime = Math.sqrt(2 * Math.max(0.01, dropY0 - bottom - tank.waterY) / G);
  const inTank = (x, z) => x > tank.x0 && x < tank.x1 && z > tank.z0 && z < tank.z1;
  const onCabinet = (x, z) => x > tank.cab.x0 && x < tank.cab.x1 && z > tank.cab.z0 && z < tank.cab.z1;
  const bar = tank.bar;                       // the lamp's bar over the water: drops land on it too
  const tmp = new THREE.Vector3();

  function burst(hitPoint) {
    if (state !== 'ready') return false;
    state = 'burst'; t0 = now; fallen = jetted = landed = sunk = false; sprayAcc = tailAcc = crownAcc = bubbleAcc = 0; rnd = dice(7 + bursts++);
    if (hitPoint) { tmp.copy(hitPoint); balloon.worldToLocal(tmp); tmp.y -= CY - TOP; if (tmp.lengthSq() > 1e-8) tear.value.copy(tmp.normalize()); }
    else tear.value.set(-0.94, -0.3, 0.17).normalize();
    rag.material.color.copy(colors[colorAt]).multiplyScalar(0.55); // thick again, the rubber is darker
    handle.onPop?.();
    if (still) { // reduced motion: the water is let down, the rings spread, nothing flies
      pop.value = 0; balloon.visible = false; rag.visible = true; rag.scale.setScalar(1); state = 'gone'; fallen = jetted = landed = sunk = true; tHit = now;
      ripples.impact(at.x, at.z, now, 0.5, tank, R0); hitAt = new THREE.Vector3(at.x, tank.waterY, at.z); handle.scare?.(hitAt); handle.onImpact?.(hitAt.clone());
      return true;
    }
    fall.uAt.value.copy(at); fall.uAge.value = 0; blob.visible = true;
    return true;
  }

  function step(h) {
    now += h;
    const a0 = now - t0;                                            // since the burst
    if (state === 'burst') {
      pop.value = Math.min(1, a0 / 0.055);
      // the spray the rubber tears off the water's skin as it snaps back: fine, and thrown where the tear's edge runs
      sprayAcc += 6000 * share * h;
      const front = pop.value * 1.25, c = tmp, tv = tear.value;
      while (sprayAcc >= 1) {
        sprayAcc--;
        const u = rnd() * 2 - 1, th = rnd() * 6.283, rr = pearR(u) * R;
        c.set(Math.cos(th) * rr, pearY(u) * R, Math.sin(th) * rr);
        const l = c.length() || 1, d = Math.acos(THREE.MathUtils.clamp(c.dot(tv) / l, -1, 1)) / Math.PI;
        if (Math.abs(d - front + 0.08) > 0.14) continue;          // only where the rubber is leaving just now
        const s = 0.15 + rnd() * 0.7, away = 0.3 + rnd() * 0.9;   // off the skin, and along it after the rubber
        emit(MIST, at.x + c.x, at.y + c.y, at.z + c.z, c.x / l * s - tv.x * away, c.y / l * s - tv.y * away + 0.2, c.z / l * s - tv.z * away, 0.0003 + rnd() * 0.0006, 0.18 + rnd() * 0.3);
      }
      if (a0 >= 0.055) { state = 'gone'; pop.value = 0; balloon.visible = false; rag.visible = true; rag.scale.setScalar(1); } // the skin is at the knot: from here on it is the rag
    }
    if (blob.visible) {
      const y = dropY0 - 0.5 * G * a0 * a0;
      fall.uAge.value = a0; fall.uAt.value.set(at.x, y, at.z);
      // its tail breaks into a few drops that fall behind it
      if (a0 > 0.1 && a0 < fallTime) {
        tailAcc += 70 * share * h;
        while (tailAcc >= 1) { tailAcc--; emit(DROP, at.x + (rnd() - 0.5) * 0.03, y + R * (1 + 0.45 * a0) * (0.8 + rnd() * 0.4), at.z + (rnd() - 0.5) * 0.03, (rnd() - 0.5) * 0.15, -G * a0 * (0.72 + rnd() * 0.2), (rnd() - 0.5) * 0.15, 0.0012 + rnd() * rnd() * 0.003, 3); }
      }
      if (a0 > fallTime + 0.055) blob.visible = false;
    }
    if (!fallen && a0 >= fallTime && !still && t0 > -1e8) {
      fallen = true; tHit = now; hitAt = new THREE.Vector3(at.x, tank.waterY, at.z);
      crown.uAt.value.copy(hitAt); sheet.visible = true;
      ripples.impact(at.x, at.z, now, 1, tank, R0);
      handle.scare?.(hitAt); handle.onImpact?.(hitAt.clone());
    }
    const a = now - tHit;                                           // since the water met the water
    if (fallen && hitAt && !still && a < 1.4) {
      crown.uAge.value = a;
      const rb = crownRadius(a, R0), spread = R0 * GROW / GROW_T * Math.exp(-a / GROW_T); // the crown's foot: where it is, how fast it runs out
      // the first spray, fast and flat, in the first hundredths of a second
      if (a < 0.035) for (let i = 0, n = Math.round(4200 * share * h); i < n; i++) {
        const th = rnd() * 6.283, s = 1.6 + rnd() * 3.2, up = 0.3 + rnd() * 1.6, fine = rnd() < 0.65;
        emit(fine ? MIST : SMALL, hitAt.x + Math.cos(th) * R0, hitAt.y + 0.005, hitAt.z + Math.sin(th) * R0, Math.cos(th) * s, up, Math.sin(th) * s, fine ? 0.0004 + rnd() * 0.0007 : 0.0006 + rnd() * 0.0012, 0.3 + rnd() * (fine ? 0.35 : 1.5));
      }
      // the drops the crown lets go. Early, its rim throws them ahead of itself, most from where it is
      // thrown hardest; then the sheet tears, and every piece of it goes on as a drop with the speed
      // the sheet had there, so the water of the crown rains back into the tank
      if (a > 0.012 && a < CROWN_T) {
        crownAcc += share * h * (a < 0.12 ? 2400 : 1900);
        while (crownAcc >= 1) {
          crownAcc--;
          let th = rnd() * 6.283; if (throwAt(th) < 0.75 + rnd() * 0.5) th = rnd() * 6.283; // more from where the rim is thrown harder
          const fast = UP * throwAt(th), phase = a / rimTime(th);
          if (phase >= 1) continue;                               // there the rim is already down
          const rise = rimRise(a, th), climb = fast - G * a, early = a < 0.12;
          const w = early ? 1 : Math.pow(rnd(), 0.6), w8 = Math.pow(w, 0.8);
          if (!early && rnd() > smooth(0.45, 1.05, phase) * (0.3 + 0.7 * w) + 0.12) continue; // only where it is tearing
          const r = rb + LEAN * rise * w * (0.5 + 0.5 * w), y = hitAt.y + rise * w8 + (early ? 0.02 * fingerAt(th) : 0);
          const thrown = early ? 1 : 0.12;
          const off = spread + LEAN * climb * w + thrown * (0.1 + rnd() * rnd() * 1.0), up = climb * w8 + thrown * (0.15 + rnd() * 0.9), side = (rnd() - 0.5) * 0.3;
          emit(DROP, hitAt.x + Math.cos(th) * r, y, hitAt.z + Math.sin(th) * r, Math.cos(th) * off - Math.sin(th) * side, up, Math.sin(th) * off + Math.cos(th) * side, dropSize(), 3);
        }
      }
      // the crown is down: its last water runs down the glass it reached
      if (!landed && a >= CROWN_T) {
        landed = true;
        for (let i = 0, n = Math.round(22 * share); i < n; i++) {
          const front = rnd() < 0.7, z = hitAt.z + (rnd() - 0.5) * 0.5;
          emit(RUN, (front ? tank.x0 : tank.x1) + (rnd() < 0.5 ? -0.006 : 0.006), tank.waterY + 0.005 + rnd() * (tank.rimY - tank.waterY), z, 0, -0.02 - rnd() * 0.06, 0, 0.0016 + rnd() * 0.0016, 3 + rnd() * 3);
        }
      }
      // the air: a little is carried under by the fall, most is caught when the crater closes over
      // itself, and some where the crown comes down. Fine bubbles, which rise and fizz at the surface
      if (a < 0.1) { bubbleAcc += 500 * share * h; while (bubbleAcc >= 1) { bubbleAcc--; fizz(1, hitAt.x, hitAt.y - 0.02, hitAt.z, rb * 0.6, 0.06, 1.2); } }
      else if (a > 0.17 && a < 0.36) { bubbleAcc += 1700 * share * h; while (bubbleAcc >= 1) { bubbleAcc--; fizz(1, hitAt.x, hitAt.y - 0.01, hitAt.z, rb * 0.7 * (1 - smooth(0.17, 0.4, a) * 0.6), 0.09, 1.1); } }
      else if (a > 0.36 && a < CROWN_T + 0.08) { bubbleAcc += 380 * share * h; while (bubbleAcc >= 1) { bubbleAcc--; const th = rnd() * 6.283; fizz(1, hitAt.x + Math.cos(th) * rb, hitAt.y, hitAt.z + Math.sin(th) * rb, 0.03, 0.03, 0.4); } }
      // the jet lets go of its tip: a big drop, a few behind it
      const aj = a - JET0;
      if (!jetted && aj >= 0.2) {
        jetted = true;
        const tip = JET_UP * aj - 0.5 * G * aj * aj, vy = JET_UP - G * aj;
        const bx = 0.045 * Math.sin(aj * 5 + 0.5) * tip, bz = -0.025 * Math.sin(aj * 5 + 0.5) * tip; // where the bent jet's tip is
        for (let i = 0; i < 4; i++) { const w = 0.95 - i * 0.14; emit(DROP, hitAt.x + bx * w * w + (rnd() - 0.5) * 0.004, hitAt.y + tip * w, hitAt.z + bz * w * w + (rnd() - 0.5) * 0.004, bx * 2 + (rnd() - 0.5) * 0.1, vy * (1 - i * 0.12) + 0.3 - i * 0.06, bz * 2 + (rnd() - 0.5) * 0.1, i ? 0.0035 + rnd() * 0.002 : 0.0085, 3); }
      }
      // the jet is down: it falls back into its mound, which sends out one more ring and a few drops
      if (!sunk && aj >= JET_T) {
        sunk = true; sheet.visible = false;
        ripples.second(hitAt.x, hitAt.z, now);
        fizz(Math.round(40 * share), hitAt.x, hitAt.y, hitAt.z, 0.03, 0.05, 0.8);
        for (let i = 0, n = Math.round(18 * share); i < n; i++) { const th = rnd() * 6.283, s = 0.1 + rnd() * 0.5; emit(SMALL, hitAt.x + Math.cos(th) * 0.02, hitAt.y + 0.004, hitAt.z + Math.sin(th) * 0.02, Math.cos(th) * s, 0.3 + rnd() * 0.9, Math.sin(th) * s, 0.0007 + rnd() * 0.0014, 2); }
      }
    }

    // every drop: gravity, the air, and what it meets
    let wet = 0;
    for (let i = alive - 1; i >= 0; i--) {
      const kd = P.kind[i], ix = i * 3;
      P.age[i] += h;
      if (P.age[i] > P.life[i]) { kill(i); continue; }
      if (kd === WET) { wet++; P.m[i * 4 + 1] = smooth(0, 0.06, P.age[i]) * (1 - smooth(P.life[i] * 0.55, P.life[i], P.age[i])); continue; } // it dries
      let x = P.x[ix], y = P.x[ix + 1], z = P.x[ix + 2], vx = P.v[ix], vy = P.v[ix + 1], vz = P.v[ix + 2];
      const rad = P.m[i * 4];
      if (kd === BUBBLE) {
        const drag = 10, rise = 0.12 + rad * 70;                    // a bigger bubble rises faster
        vx -= vx * drag * h; vz -= vz * drag * h; vy += ((rise - vy) * drag) * h;
        const w = P.m[i * 4 + 3] * 40;
        x += (vx + 0.03 * Math.sin(now * 9 + w)) * h; y += vy * h; z += (vz + 0.03 * Math.cos(now * 8 + w)) * h;
        x = THREE.MathUtils.clamp(x, tank.x0 + 0.012, tank.x1 - 0.012); z = THREE.MathUtils.clamp(z, tank.z0 + 0.012, tank.z1 - 0.012);
        if (y < tank.floorY + 0.03) { y = tank.floorY + 0.03; vy = 0; }
        P.m[i * 4 + 1] = smooth(0, 0.05, P.age[i]);
        if (y >= tank.waterY + ripples.height(x, z, now) - 0.004) { kill(i); continue; } // it breaks at the surface
      } else if (kd === RUN) {
        y += vy * h; vy = Math.max(vy - 0.25 * h, -0.22);            // a drop on the glass runs down, slowly, and thins
        P.m[i * 4 + 1] = 1 - smooth(P.life[i] * 0.5, P.life[i], P.age[i]);
        if (y < tank.cabY + 0.004) { kill(i); continue; }
      } else {
        // the air's drag on a ball of water: a = -(3/8) Cd (ρair/ρwater) |v| v / r
        const sp = Math.hypot(vx, vy, vz), k = 0.375 * 0.47 * (1.2 / 1000) / Math.max(rad, kd === MIST ? 0.00012 : 0.0005) * sp;
        vx -= vx * k * h; vy -= (G + vy * k) * h; vz -= vz * k * h;
        const nx = x + vx * h, ny = y + vy * h, nz = z + vz * h;
        if (kd === MIST) P.m[i * 4 + 1] = (1 - smooth(P.life[i] * 0.4, P.life[i], P.age[i])) * 0.8;
        else {
          // the glass: a drop that meets a pane below its rim stays on it and runs down
          const band = ny < tank.rimY + 0.012 && ny > tank.cabY + 0.02 && nz > tank.z0 && nz < tank.z1;
          let pane = null;
          if (band && (x - tank.x0) * (nx - tank.x0) < 0) pane = [tank.x0 + (vx > 0 ? -0.006 : 0.006), ny, nz];
          else if (band && (x - tank.x1) * (nx - tank.x1) < 0) pane = [tank.x1 + (vx > 0 ? -0.006 : 0.006), ny, nz];
          else if (ny < tank.rimY + 0.012 && ny > tank.cabY + 0.02 && nx > tank.x0 && nx < tank.x1 && ((z - tank.z0) * (nz - tank.z0) < 0 || (z - tank.z1) * (nz - tank.z1) < 0)) pane = [nx, ny, (Math.abs(nz - tank.z0) < Math.abs(nz - tank.z1) ? tank.z0 : tank.z1) + (vz > 0 ? -0.006 : 0.006)];
          if (pane && ny > tank.waterY - 0.002) {
            P.x[ix] = pane[0]; P.x[ix + 1] = pane[1]; P.x[ix + 2] = pane[2]; P.v[ix] = 0; P.v[ix + 1] = -0.02 - rnd() * 0.05; P.v[ix + 2] = 0;
            P.kind[i] = RUN; P.m[i * 4 + 2] = RUN; P.m[i * 4] = Math.max(rad, 0.0018); P.age[i] = 0; P.life[i] = 3 + rnd() * 3;
            continue;
          }
          // the lamp's bar over the water
          if (bar && vy < 0 && y > bar.y && ny <= bar.y && nx > bar.x0 && nx < bar.x1 && nz > bar.z0 && nz < bar.z1) { land(i, nx, bar.y + 0.0012, nz, 0, 1, 0); continue; }
          // the tank's water: a ring, and a drop that is not small throws up smaller ones
          if (inTank(nx, nz) && ny <= tank.waterY + ripples.height(nx, nz, now) && vy < 0) {
            if (kd === DROP && rad > 0.0026) ripples.drop(slot++, nx, nz, now, Math.min(0.004, rad * 0.7));
            if (kd === DROP && rad > 0.0012) for (let j = 0, n = rad > 0.005 ? 7 : rad > 0.0026 ? 2 : rnd() < 0.5 ? 1 : 0; j < n; j++) { const th = rnd() * 6.283, s = 0.15 + rnd() * 0.45; emit(SMALL, nx, tank.waterY + 0.003, nz, Math.cos(th) * s, 0.4 + rnd() * (rad > 0.005 ? 1.4 : 0.7), Math.sin(th) * s, 0.0005 + rnd() * 0.0011, 2); }
            kill(i); continue;
          }
          // the cabinet's top, the wall, the floor: it lands and leaves a wet spot
          if (ny <= tank.cabY && y > tank.cabY && onCabinet(nx, nz)) { land(i, nx, tank.cabY + 0.0015, nz, 0, 1, 0); continue; }
          if (nx >= tank.wall - 0.004) { land(i, tank.wall - 0.0025, ny, nz, -1, 0, 0); continue; }
          if (ny <= 0.004) { land(i, nx, 0.0025, nz, 0, 1, 0); continue; }
          if (ny < tank.cabY && onCabinet(nx, nz)) { kill(i); continue; }
        }
        x = nx; y = ny; z = nz;
      }
      P.x[ix] = x; P.x[ix + 1] = y; P.x[ix + 2] = z; P.v[ix] = vx; P.v[ix + 1] = vy; P.v[ix + 2] = vz;
    }
    wets = wet;

    // a new balloon, filled on the string; the rag of the old one has shrivelled away just before it comes
    if (state === 'gone' && rag.visible) rag.scale.setScalar(THREE.MathUtils.clamp((refill - a0) / 0.35, 0.001, 1));
    if (state === 'gone' && a0 >= refill) {
      state = 'filling'; colorAt = (colorAt + 1) % colors.length; tint(colors[colorAt]); balloon.visible = true; balloon.scale.setScalar(still ? 1 : 0.06); rag.visible = false;
    }
    if (state === 'filling') {
      const k = still ? 1 : Math.min(1, (a0 - refill) / 1.5);
      balloon.scale.setScalar(0.06 + 0.94 * (1 - Math.pow(1 - k, 3)) + 0.035 * Math.sin(k * 21) * (1 - k) * k * 4); // it swells, and settles with a quiver
      if (k >= 1) { balloon.scale.setScalar(1); state = 'ready'; }
    }
  }

  // ── the room as it is without the splash, drawn small once a frame while the splash lasts: what the water bends ──
  let scenePic = null;
  const half = new THREE.Vector2();
  handle.grab = (renderer, scene, camera) => {
    const on = !lite && !still && (blob.visible || sheet.visible || (drops.visible && now - t0 < 2.2));
    light.uGrab.value = on ? 1 : 0;
    if (!on) return;
    renderer.getDrawingBufferSize(half); const w = Math.max(2, half.x >> 1), h = Math.max(2, half.y >> 1);
    if (!scenePic) { scenePic = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType }); light.uScene.value = scenePic.texture; }
    else if (scenePic.width !== w || scenePic.height !== h) scenePic.setSize(w, h);
    const shown = [blob.visible, sheet.visible, drops.visible], was = renderer.getRenderTarget(), skin = state === 'burst' && balloon.visible;
    blob.visible = sheet.visible = drops.visible = false; if (skin) balloon.visible = false; // nor the rubber that is leaving it: water does not show its own balloon
    renderer.setRenderTarget(scenePic); renderer.clear(); renderer.render(scene, camera); renderer.setRenderTarget(was);
    [blob.visible, sheet.visible, drops.visible] = shown; if (skin) balloon.visible = true;
  };
  handle.shaped = [blob, sheet, drops];       // shaped in their shaders: a pass that draws the room with its own material must leave them out

  const H = 1 / 180;
  handle.update = (t) => {
    const dt = last == null ? 0 : Math.min(0.1, Math.max(0, t - last)) * speed; last = t;
    acc += dt;
    while (acc >= H) { step(H); acc -= H; }
    ripples.uniforms.uNow.value = now;
    setDay(!!parent.userData.day);
    // what hangs swings a little from the hook; the rag, light and loose, whips after the burst and comes to rest (still under reduced motion)
    if (!still) {
      const a0 = Math.max(0, now - t0), loose = Math.exp(-a0 / 1.4) * (a0 < 30 ? 1 : 0);
      swing.rotation.z = (0.012 + 0.07 * loose) * Math.sin(t * 2.6 + 0.4);
      swing.rotation.x = 0.008 * Math.sin(t * 2.1);
      if (rag.visible) {
        rag.rotation.z = 1.1 * Math.exp(-a0 / 0.45) * Math.sin(a0 * 19) + 0.2 * Math.exp(-a0 / 1.6) * Math.sin(a0 * 8 + 1);
        rag.rotation.x = 0.7 * Math.exp(-a0 / 0.5) * Math.sin(a0 * 15 + 1.2);
      }
    }
    drops.visible = alive > 0; quad.instanceCount = alive;
    if (alive > 0) {
      aX.clearUpdateRanges(); aV.clearUpdateRanges(); aM.clearUpdateRanges();
      aX.addUpdateRange(0, alive * 3); aV.addUpdateRange(0, alive * 3); aM.addUpdateRange(0, alive * 4);
      aX.needsUpdate = aV.needsUpdate = aM.needsUpdate = true;
    }
  };
  handle.burst = burst;
  handle.balloon = balloon;
  Object.defineProperty(handle, 'state', { get: () => ({ state, alive, wets, now, sinceBurst: now - t0, sinceFall: now - tHit, fallTime }) });
  return handle;
}

// The rings on the tank's surface: `uniforms` go to the surface's shader (with RIPPLE_GLSL), and
// `height` is the same sum in JavaScript, for the buoys and for the drops that land. `flow` is how
// fast the surface runs away from the crater, for what floats on it.
export function createRipples() {
  const uniforms = {
    uRip: { value: Array.from({ length: RIPPLES }, () => new THREE.Vector4()) },
    uRipK: { value: Array.from({ length: RIPPLES }, () => new THREE.Vector2(70, 2)) },
    uImpact: { value: new THREE.Vector4() }, uNow: { value: 0 },
    uTank: { value: new THREE.Vector4(0, 0, 1, 1) }, uSlosh: { value: new THREE.Vector4() }, uSloshW: { value: new THREE.Vector2(7.8, 5.9) },
  };
  const ring = (x, z, s, q, now) => {
    const tau = now - s.z; if (s.w === 0 || tau <= 0) return 0;
    const r = Math.hypot(x - s.x, z - s.y) + 0.012, k = (G / 4) * tau * tau / (r * r), u = k / q.x;
    return s.w * u * Math.exp(1 - u) * Math.cos(k * r) * Math.sqrt(0.05 / (r + 0.05)) * Math.exp(-tau / q.y);
  };
  return {
    uniforms,
    // the tank's own slow waves: ω² = g k tanh(k d), for half a wave across it and a whole wave along it
    setTank(tank) {
      const D = tank.x1 - tank.x0, L = tank.z1 - tank.z0, d = Math.max(0.05, tank.waterY - tank.floorY);
      const w = (k) => Math.sqrt(G * k * Math.tanh(k * d));
      uniforms.uTank.value.set(tank.x0, tank.z0, D, L); uniforms.uSloshW.value.set(w(Math.PI / D), w(2 * Math.PI / L));
    },
    height(x, z, now = uniforms.uNow.value) {
      let h = 0;
      for (let i = 0; i < RIPPLES; i++) h += ring(x, z, uniforms.uRip.value[i], uniforms.uRipK.value[i], now);
      const sl = uniforms.uSlosh.value, tk = uniforms.uTank.value, sw = uniforms.uSloshW.value, tau = now - sl.x;
      if (sl.y !== 0 && tau > 0) h -= sl.y * Math.exp(-tau / 4.5) * (sl.z * Math.cos(Math.PI * (x - tk.x) / tk.z) * Math.sin(sw.x * tau) + sl.w * Math.cos(2 * Math.PI * (z - tk.y) / tk.w) * Math.sin(sw.y * tau));
      const m = uniforms.uImpact.value, a = now - m.z;
      if (m.w !== 0 && a > 0 && a <= 1.4) {
        const r = Math.hypot(x - m.x, z - m.y), r0 = m.w, rb = crownRadius(a, r0), q = r / (0.9 * rb);
        h += -DEEP * r0 * smooth(0, 0.13, a) * (1 - smooth(0.15, 0.32, a)) * Math.pow(Math.max(0, 1 - q * q), 0.7)
          + 0.03 * Math.exp(-(((r - rb) / 0.022) ** 2)) * smooth(0, 0.025, a) * (1 - smooth(0.15, 0.5, a))
          + 0.022 * Math.exp(-(((r - rb - 0.75 * a) / 0.06) ** 2)) * Math.sqrt(rb / (r + 0.02)) * smooth(0, 0.06, a) * Math.exp(-a / 0.45)
          + 0.035 * Math.exp(-r * r / (0.9 * r0 * r0)) * smooth(0.26, 0.36, a) * (1 - smooth(0.7, 1.15, a));
      }
      return h;
    },
    // the water the crater pushes aside runs outwards: as fast as the crater's rim where the rim is,
    // slower farther out (what leaves a ring has to cross a longer one), and with it what floats. In m/s.
    flow(x, z, now = uniforms.uNow.value) {
      const m = uniforms.uImpact.value, a = now - m.z;
      if (m.w === 0 || a <= 0 || a > 1) return null;
      const dx = x - m.x, dz = z - m.y, r = Math.hypot(dx, dz) || 1e-4, rb = crownRadius(a, m.w);
      const u = m.w * GROW / GROW_T * Math.exp(-a / GROW_T) * (r < rb ? r / rb : rb / r);
      return [dx / r * u, dz / r * u];
    },
    // one small thing falls in: rings of a few centimetres that last a second
    drop(i, x, z, now, amp) { const j = 6 + (i % (RIPPLES - 6)); uniforms.uRip.value[j].set(x, z, now, amp); uniforms.uRipK.value[j].set(190, 0.9); },
    // the jet falls back into its mound: one more ring from the middle, smaller and shorter
    second(x, z, now) { uniforms.uRip.value[5].set(x, z, now, 0.007); uniforms.uRipK.value[5].set(95, 1.6); },
    // the balloon's water falls in: the crater, rings that reach the four panes and come back, and the tank's slow swing
    impact(x, z, now, amp, tank, r0 = 0.06) {
      const a = 0.02 * amp, set = (i, sx, sz, k) => { uniforms.uRip.value[i].set(sx, sz, now, a * k); uniforms.uRipK.value[i].set(46, 3.2); };
      set(0, x, z, 1); set(1, 2 * tank.x0 - x, z, 0.8); set(2, 2 * tank.x1 - x, z, 0.8); set(3, x, 2 * tank.z0 - z, 0.8); set(4, x, 2 * tank.z1 - z, 0.8);
      uniforms.uImpact.value.set(x, z, now, amp >= 1 ? r0 : 0);
      this.setTank(tank);
      uniforms.uSlosh.value.set(now, 0.005 * amp, Math.cos(Math.PI * (x - tank.x0) / (tank.x1 - tank.x0)), 0.7);
    },
  };
}
