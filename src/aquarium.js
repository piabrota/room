import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { RIPPLE_GLSL } from './splash.js';

// The aquarium on the marola wall: a rimless tank of 1.60 × 0.50 × 0.48 m on the sideboard, open at
// the top so the buoys ride its surface, with a lamp bar across it. Inside: a bed of sand with the
// light's ripples moving on it (caustics), stones, plants that sway, a stream of bubbles from a
// stone in the corner, a few big fish (Microsoft's Barramundi, CC0, `just fish`) and a school of
// small ones. Everything moves from the room's clock (`update(t)`), so `just record` films the
// same fish every time, and nothing moves under reduced motion (invariant 8).
//
// Draw calls: the glass, its trim, the back, the water, the sand, the stones, the plants, the
// bubbles, the big fish (one instanced mesh), the school (another) and the lamp: 11 or so.
//
// The tank's own frame: x across it (0 its middle, +x towards the wall), y up from the sideboard's
// top, z along it. `at` is where that frame sits in the room.

const SAND = 0.035;          // the sand's height at the front; it rises to the back
const GLSL_CAUSTIC = /* glsl */`
  float caustic(vec2 p, float t) {
    float c = 0.0; vec2 q = p;
    for (int i = 0; i < 3; i++) {
      q += vec2(sin(q.y * 1.3 + t * 0.6 + float(i)), cos(q.x * 1.1 - t * 0.5 + float(i) * 1.7)) * 0.55;
      c += 1.0 - abs(sin(q.x) * sin(q.y));
    }
    return pow(c / 3.0, 6.0);
  }`;

function mulberry(a) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export function buildAquarium(parent, { at, L = 1.6, D = 0.5, H = 0.48, cfg = {}, lite = false, loadFish = () => Promise.resolve(null), name = 'tank', lampX = 0.02, ripples = null }) {
  const r = mulberry(11);
  const group = new THREE.Group(); group.name = name; group.position.copy(at); parent.add(group); // its +x is the room's: the wall
  const waterY = H - 0.04;
  const time = { value: 0 };
  const noRay = (m) => { m.raycast = () => {}; return m; };
  const add = (geo, mat, { shadow = false, receive = true, order = 0 } = {}) => {
    const m = new THREE.Mesh(geo, mat); m.castShadow = shadow; m.receiveShadow = receive; m.renderOrder = order; group.add(m); return m;
  };

  // ── the glass: five panes, open at the top; the trim of black silicone along the bottom and the edges ──
  const glassMat = new THREE.MeshPhysicalMaterial({ color: '#cfe9f2', roughness: 0.04, metalness: 0, transparent: true, opacity: 0.1, depthWrite: false, side: THREE.DoubleSide, forceSinglePass: true }); // one pass: a blended double side draws twice
  const t = 0.008;
  const panes = mergeGeometries([
    new THREE.BoxGeometry(t, H, L).translate(-D / 2, H / 2, 0),         // front
    new THREE.BoxGeometry(t, H, L).translate(D / 2, H / 2, 0),          // back
    new THREE.BoxGeometry(D, H, t).translate(0, H / 2, -L / 2),         // the ends
    new THREE.BoxGeometry(D, H, t).translate(0, H / 2, L / 2),
  ]);
  noRay(add(panes, glassMat, { order: 4, receive: false }));
  const trim = mergeGeometries([
    new THREE.BoxGeometry(D + 0.02, 0.012, L + 0.02).translate(0, 0.006, 0),
    ...[-1, 1].flatMap((sx) => [-1, 1].map((sz) => new THREE.BoxGeometry(0.012, H, 0.012).translate(sx * D / 2, H / 2, sz * L / 2))),
    ...[-1, 1].map((sx) => new THREE.BoxGeometry(0.01, 0.01, L).translate(sx * D / 2, H - 0.005, 0)),
    ...[-1, 1].map((sz) => new THREE.BoxGeometry(D, 0.01, 0.01).translate(0, H - 0.005, sz * L / 2)),
  ]);
  add(trim, new THREE.MeshStandardMaterial({ color: '#101214', roughness: 0.5 }));

  // ── the back: a deep blue that fades to black at the bottom, as aquarium backgrounds are ──
  const bc = document.createElement('canvas'); bc.width = 16; bc.height = 256;
  const bctx = bc.getContext('2d'), grad = bctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#2a6f93'); grad.addColorStop(0.55, '#0d3550'); grad.addColorStop(1, '#03121c');
  bctx.fillStyle = grad; bctx.fillRect(0, 0, 16, 256);
  const backTex = new THREE.CanvasTexture(bc); backTex.colorSpace = THREE.SRGBColorSpace;
  const back = add(new THREE.PlaneGeometry(L - 0.01, H - 0.01).rotateY(-Math.PI / 2).translate(D / 2 - 0.006, H / 2, 0), new THREE.MeshStandardMaterial({ map: backTex, emissiveMap: backTex, emissive: '#ffffff', emissiveIntensity: 0.18, roughness: 1 }));
  back.material.toneMapped = true;

  // ── the sand: higher at the back, with the ripples of the light moving on it ──
  const sandGeo = new THREE.PlaneGeometry(D - 0.012, L - 0.012, lite ? 10 : ripples ? 40 : 20, lite ? 32 : ripples ? 128 : 64).rotateX(-Math.PI / 2);
  const sp = sandGeo.attributes.position;
  for (let i = 0; i < sp.count; i++) {
    const x = sp.getX(i), z = sp.getZ(i);
    sp.setY(i, SAND + 0.05 * (x / D + 0.5) + 0.006 * Math.sin(z * 23 + x * 9) + 0.004 * (r() - 0.5));
  }
  sandGeo.computeVertexNormals();
  const sc = document.createElement('canvas'); sc.width = sc.height = lite ? 128 : 256;
  const sctx = sc.getContext('2d'); sctx.fillStyle = '#8f7a58'; sctx.fillRect(0, 0, sc.width, sc.height);
  for (let i = 0; i < sc.width * sc.height * 0.35; i++) { const v = 90 + r() * 80; sctx.fillStyle = `rgb(${v},${v * 0.9 | 0},${v * 0.72 | 0})`; sctx.fillRect(r() * sc.width, r() * sc.height, 1.4, 1.4); }
  const sandTex = new THREE.CanvasTexture(sc); sandTex.colorSpace = THREE.SRGBColorSpace; sandTex.wrapS = sandTex.wrapT = THREE.RepeatWrapping; sandTex.repeat.set(2, 6);
  const sandMat = new THREE.MeshStandardMaterial({ map: sandTex, roughness: 1 });
  // `ripples` (src/splash.js): the rings a splash leaves are lenses too. A crest gathers the lamp's light on
  // the sand under it and a trough spreads it: 1 - d (n - 1)/n ∇²h, for water d deep (taken at the vertices)
  sandMat.onBeforeCompile = (s) => {
    s.uniforms.uTime = time;
    if (ripples) Object.assign(s.uniforms, ripples.uniforms);
    s.vertexShader = s.vertexShader.replace('#include <common>', `#include <common>\nvarying vec2 vCaust; varying float vRing;\n${ripples ? RIPPLE_GLSL + 'float lens(vec2 p) { return rings(p) + crater(p); }' : ''}`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>\nvCaust = (modelMatrix * vec4(transformed, 1.0)).xz; vRing = 0.0;
        ${ripples ? `float e = 0.012, lap = (lens(vCaust + vec2(e, 0.0)) + lens(vCaust - vec2(e, 0.0)) + lens(vCaust + vec2(0.0, e)) + lens(vCaust - vec2(0.0, e)) - 4.0 * lens(vCaust)) / (e * e);
        vRing = clamp(-${((waterY - SAND - 0.03) * 0.25).toFixed(3)} * lap, -0.85, 2.0);` : ''}`);
    s.fragmentShader = s.fragmentShader.replace('#include <common>', `#include <common>\nuniform float uTime; varying vec2 vCaust; varying float vRing;\n${GLSL_CAUSTIC}`)
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += vec3(0.45, 0.8, 0.95) * (0.18 * caustic(vCaust * 22.0, uTime) * (1.0 + vRing) + 0.1 * max(0.0, vRing));');
  };
  sandMat.customProgramCacheKey = () => (ripples ? 'aquarium-sand-rings' : 'aquarium-sand');
  add(sandGeo, sandMat);

  // ── stones: a few rounded rocks, pushed out of shape, half sunk in the sand ──
  const rocks = [];
  for (const [x, z, s] of [[0.1, -0.5, 0.07], [0.14, -0.4, 0.045], [0.06, 0.25, 0.09], [-0.12, 0.42, 0.04], [0.15, 0.55, 0.06], [-0.05, -0.15, 0.03]]) {
    const ico = new THREE.IcosahedronGeometry(s, lite ? 2 : 3); ico.deleteAttribute('normal'); ico.deleteAttribute('uv');
    const geo = mergeVertices(ico), p = geo.attributes.position, b = [r() * 6, r() * 6, r() * 6];
    for (let i = 0; i < p.count; i++) { // pushed out of round by a few slow bumps, then flattened
      const x0 = p.getX(i) / s, y0 = p.getY(i) / s, z0 = p.getZ(i) / s;
      const k = 0.88 + 0.12 * Math.sin(x0 * 3 + b[0]) * Math.sin(y0 * 2.5 + b[1]) + 0.07 * Math.sin(z0 * 4 + b[2]);
      p.setXYZ(i, p.getX(i) * k * 1.3, p.getY(i) * k * 0.7, p.getZ(i) * k);
    }
    const col = new Float32Array(p.count * 3), a = new THREE.Color('#857563'), c2 = new THREE.Color('#4f4a42'), c = new THREE.Color();
    for (let i = 0; i < p.count; i++) c.copy(a).lerp(c2, 0.5 + 0.5 * Math.sin(p.getX(i) * 90 + b[1]) * Math.sin(p.getZ(i) * 70 + p.getY(i) * 50)).toArray(col, i * 3);
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.computeVertexNormals(); geo.rotateY(r() * 6); geo.translate(x, SAND + 0.05 * (x / D + 0.5) + s * 0.2, z);
    rocks.push(geo);
  }
  add(mergeGeometries(rocks), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }), { shadow: true });

  // ── plants: tall blades in clumps along the back, swaying from their foot (the higher, the more) ──
  const blades = [], clumps = lite ? 5 : 9;
  const greens = ['#2f6b2a', '#3d8a34', '#4f9a3a', '#245a26', '#6aa84f'].map((c) => new THREE.Color(c));
  for (let c = 0; c < clumps; c++) {
    const cz = -L / 2 + 0.1 + (c + r() * 0.6) * ((L - 0.2) / clumps), cx = 0.08 + r() * 0.12;
    const n = lite ? 5 : 8, tall = 0.18 + r() * 0.2;
    for (let b = 0; b < n; b++) {
      const h = tall * (0.6 + r() * 0.5), w = 0.008 + r() * 0.008, seg = 6;
      const geo = new THREE.PlaneGeometry(w, h, 1, seg).translate(0, h / 2, 0);
      const p = geo.attributes.position, lean = (r() - 0.5) * 0.5, col = greens[(r() * greens.length) | 0];
      const colors = new Float32Array(p.count * 3), sway = new Float32Array(p.count);
      for (let i = 0; i < p.count; i++) {
        const k = p.getY(i) / h;
        p.setX(i, p.getX(i) * (1 - k * 0.7) + lean * k * k * h); // narrowing to a point, and bending
        col.toArray(colors, i * 3); sway[i] = k * k;
        colors[i * 3] *= 0.6 + 0.4 * k; colors[i * 3 + 1] *= 0.6 + 0.4 * k; colors[i * 3 + 2] *= 0.6 + 0.4 * k;
      }
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geo.setAttribute('sway', new THREE.BufferAttribute(sway, 1));
      geo.rotateY(r() * Math.PI); geo.translate(cx + (r() - 0.5) * 0.05, SAND + 0.05 * (cx / D + 0.5) - 0.005, cz + (r() - 0.5) * 0.06);
      blades.push(geo);
    }
  }
  const plantMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, side: THREE.DoubleSide });
  plantMat.onBeforeCompile = (s) => {
    s.uniforms.uTime = time;
    s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nuniform float uTime; attribute float sway;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        float ph = position.z * 9.0 + position.x * 5.0;
        transformed.x += sway * 0.018 * sin(uTime * 1.1 + ph);
        transformed.z += sway * 0.03 * sin(uTime * 0.8 + ph * 0.7);`);
  };
  plantMat.customProgramCacheKey = () => 'aquarium-plant';
  add(mergeGeometries(blades), plantMat);

  // ── bubbles: from a stone in the back corner, rising and wobbling, round again ──
  const NB = lite ? 30 : 60, bpos = new Float32Array(NB * 3), bseed = new Float32Array(NB);
  for (let i = 0; i < NB; i++) { bpos.set([0.17, SAND + 0.06, L / 2 - 0.12], i * 3); bseed[i] = r(); }
  const bgeo = new THREE.BufferGeometry();
  bgeo.setAttribute('position', new THREE.BufferAttribute(bpos, 3)); bgeo.setAttribute('seed', new THREE.BufferAttribute(bseed, 1));
  const bubbles = new THREE.Points(bgeo, new THREE.ShaderMaterial({
    uniforms: { uTime: time, uTop: { value: waterY - SAND - 0.07 } }, transparent: true, depthWrite: false,
    vertexShader: `attribute float seed; uniform float uTime, uTop; varying float a;
      void main() {
        float rise = mod(seed * uTop + uTime * (0.09 + 0.05 * seed), uTop);
        vec3 p = position + vec3(0.01 * sin(uTime * 7.0 + seed * 40.0), rise, 0.01 * cos(uTime * 6.0 + seed * 23.0));
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        a = smoothstep(uTop, uTop - 0.02, rise);
        gl_PointSize = (2.0 + 4.0 * fract(seed * 7.3)) * (1.6 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `varying float a;
      void main() { float d = length(gl_PointCoord - 0.5); float ring = smoothstep(0.5, 0.38, d) - 0.6 * smoothstep(0.36, 0.1, d);
        gl_FragColor = vec4(vec3(0.85, 0.95, 1.0) * 0.6, ring * a * 0.7); }`,
  }));
  bubbles.frustumCulled = false; bubbles.renderOrder = 3; noRay(bubbles); group.add(bubbles);

  // ── the water: a tint over everything inside, deeper with depth ──
  const wc = document.createElement('canvas'); wc.width = 4; wc.height = 64;
  const wctx = wc.getContext('2d'), wg = wctx.createLinearGradient(0, 0, 0, 64);
  wg.addColorStop(0, 'rgba(90,180,200,0.16)'); wg.addColorStop(1, 'rgba(15,70,85,0.38)');
  wctx.fillStyle = wg; wctx.fillRect(0, 0, 4, 64);
  const waterTex = new THREE.CanvasTexture(wc); waterTex.colorSpace = THREE.SRGBColorSpace;
  const waterBox = new THREE.BoxGeometry(D - 0.014, waterY - 0.012, L - 0.014).translate(0, (waterY + 0.012) / 2, 0);
  // the sides take the gradient top to bottom; the top face (index 2) is the surface's job
  waterBox.groups = waterBox.groups.filter((gr) => gr.materialIndex !== 2 && gr.materialIndex !== 3);
  noRay(add(waterBox, new THREE.MeshBasicMaterial({ map: waterTex, transparent: true, depthWrite: false, side: THREE.DoubleSide, forceSinglePass: true }), { order: 2, receive: false }));

  // ── the lamp: a slim bar across the top on two feet, its light shining down into the water ──
  const lampMat = new THREE.MeshStandardMaterial({ color: '#1b1e22', roughness: 0.4, metalness: 0.6 });
  add(mergeGeometries([
    new THREE.BoxGeometry(0.07, 0.014, L * 0.86).translate(lampX, H + 0.05, 0),
    ...[-1, 1].map((s) => new THREE.BoxGeometry(D + 0.02, 0.008, 0.012).translate(0, H + 0.004, s * L * 0.4)),
    ...[-1, 1].map((s) => new THREE.BoxGeometry(0.008, 0.05, 0.012).translate(lampX, H + 0.028, s * L * 0.4)),
  ]), lampMat);
  const led = add(new THREE.BoxGeometry(0.05, 0.003, L * 0.84).translate(lampX, H + 0.0415, 0), new THREE.MeshStandardMaterial({ color: '#000000', emissive: '#d9f0ff', emissiveIntensity: 0.85 }));
  led.castShadow = false;
  // a spot that looks straight down, so it lights the water and the sand and not the wall above
  const light = new THREE.SpotLight('#cfeaff', 3.2, 1.4, 1.2, 0.8, 2); light.position.set(0, H + 0.03, 0);
  light.target.position.set(0, 0, 0); group.add(light, light.target);

  // ── a proxy box, so the pointer finds the tank between the fish and through the glass ──
  const proxy = new THREE.Mesh(new THREE.BoxGeometry(D, H, L).translate(0, H / 2, 0), new THREE.MeshBasicMaterial({ visible: false }));
  proxy.userData.proxy = true; group.add(proxy);

  // ── the school: small fish of a few shapes, a blue stripe, a red tail, swimming together ──
  const NS = lite ? (cfg.liteSchool ?? 9) : (cfg.school ?? 16);
  const sColors = cfg.schoolColors ?? { back: '#5fd0ff', belly: '#d9dde2', tail: '#e0473a' };
  const small = schoolFishGeometry(sColors);
  const school = new THREE.InstancedMesh(small, wiggle(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.35, metalness: 0.1, side: THREE.DoubleSide }), time, { len: 0.04, amp: 0.006, k: 140, speed: 22, key: 'school' }), NS);
  school.castShadow = false; school.frustumCulled = false; noRay(school); group.add(school);
  const offsets = Array.from({ length: NS }, () => [(r() - 0.5) * 0.09, (r() - 0.5) * 0.07, (r() - 0.5) * 0.16, r() * 6.28]);

  // ── the big fish: the Barramundi, tinted a little each, arrives with the furniture ──
  const NF = lite ? (cfg.liteFish ?? 3) : (cfg.fish ?? 5);
  const tints = (cfg.tints ?? ['#ffffff']).map((c) => new THREE.Color(c));
  const paths = Array.from({ length: NF }, (_, i) => ({
    len: 0.12 + r() * 0.07,                       // 12 to 19 cm
    ax: 0.06 + r() * 0.06, az: 0.4 + r() * 0.2,   // an ellipse across and along the tank
    cx: (r() - 0.5) * 0.04, cz: (r() - 0.5) * 0.2,
    y: SAND + 0.13 + (i / Math.max(1, NF - 1)) * (waterY - SAND - 0.24) + (r() - 0.5) * 0.03,
    w: (0.18 + r() * 0.12) * (i % 2 ? 1 : -1),    // turns a second; half of them go the other way
    p: r() * 6.28, bob: r() * 6.28,
  }));
  let fish = null, fishLen = 1, fishHead = 1;
  loadFish().then((gltf) => {
    let src = null; gltf?.scene.traverse((o) => { if (o.isMesh && !src) src = o; });
    if (!src) return;
    gltf.scene.updateMatrixWorld(true);
    const geo = src.geometry.clone(); geo.applyMatrix4(src.matrixWorld);
    geo.computeBoundingBox(); const bb = geo.boundingBox;
    // lie it along +z, its middle on the origin, its belly-to-back on y
    geo.translate(-(bb.min.x + bb.max.x) / 2, -(bb.min.y + bb.max.y) / 2, -(bb.min.z + bb.max.z) / 2);
    geo.rotateY(Math.PI); // the model's head looks to -z (its thin tail is at +z): turned, it swims to +z
    fishLen = bb.max.z - bb.min.z; fishHead = 1;
    const mat = src.material.clone(); mat.roughness = 0.35; mat.metalness = 0.2; mat.emissiveMap = mat.map; mat.emissive = new THREE.Color('#9fc4d0'); mat.emissiveIntensity = 0.25;
    fish = new THREE.InstancedMesh(geo, wiggle(mat, time, { len: fishLen, amp: 0.035 * fishLen, k: 9 / fishLen, speed: 7, key: 'fish', head: fishHead }), NF);
    for (let i = 0; i < NF; i++) fish.setColorAt(i, tints[i % tints.length].clone().multiplyScalar(1.7)); // brighter than the dark photographed skin, as a lit tank shows them
    fish.castShadow = false; fish.frustumCulled = false; group.add(fish);
    update(time.value);
  });

  const m4 = new THREE.Matrix4(), pos = new THREE.Vector3(), q = new THREE.Quaternion(), e = new THREE.Euler(0, 0, 0, 'YXZ'), scl = new THREE.Vector3();
  const lim = { x: D / 2 - 0.05, z: L / 2 - 0.08 };
  const spots = paths.map(() => new THREE.Vector3()), turn = paths.map(() => new THREE.Euler(0, 0, 0, 'YXZ'));
  // A splash frightens them (`scare`, from src/splash.js): each fish darts away from where the water
  // fell and down, its head turned the way it flees, in a seventh of a second, and drifts back to
  // its round over some ten more. `flee` moves `pos` and returns how frightened the fish still is.
  const fright = { x: 0, z: 0, t: -1e9 };
  function flee(tt, reach) {
    const a = tt - fright.t; if (a <= 0 || a > 14) return 0;
    const k = THREE.MathUtils.smoothstep(a, 0, 0.14) * Math.exp(-Math.max(0, a - 0.14) / 3);
    let dx = pos.x - fright.x, dz = pos.z - fright.z; const d = Math.hypot(dx, dz) || 1; dx /= d; dz /= d;
    const near = Math.exp(-d / 0.45) * reach;                     // the nearer, the further it darts
    pos.x += dx * near * k * 0.5; pos.z += dz * near * k; pos.y -= 0.035 * near / reach * k;
    e.set(0.5 * k * near / reach, Math.atan2(dx * 0.5, dz), 0);    // where it flees to, nose down
    return k * Math.min(1, near / reach * 1.6);
  }
  const mixAngle = (a, b, k) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * k;
  function swim(i, f, tt) {
    const a = f.p + f.w * tt;
    pos.set(f.cx + f.ax * Math.sin(a), f.y + 0.015 * Math.sin(tt * 0.4 + f.bob), f.cz + f.az * Math.cos(a));
    const fear = flee(tt, 0.2 + 0.05 * (i % 3)), fleeYaw = e.y, fleePitch = e.x;
    pos.x = THREE.MathUtils.clamp(pos.x, -lim.x, lim.x); pos.z = THREE.MathUtils.clamp(pos.z, -lim.z, lim.z);
    const vx = f.ax * Math.cos(a) * f.w, vz = -f.az * Math.sin(a) * f.w, vy = 0.006 * Math.cos(tt * 0.4 + f.bob);
    e.set(-Math.atan2(vy, Math.hypot(vx, vz)) * 0.8, Math.atan2(vx, vz), Math.sin(tt * 0.9 + f.bob) * 0.05);
    if (fear > 0) { e.y = mixAngle(e.y, fleeYaw, fear); e.x += fleePitch * fear; }
    spots[i].copy(pos); turn[i].copy(e);
  }
  // two fish that meet pass one above the other: each pair closer than a body pushes apart in height
  function separate() {
    for (let i = 0; i < spots.length; i++) for (let j = i + 1; j < spots.length; j++) {
      const d = spots[i].distanceTo(spots[j]), near = 0.11;
      if (d >= near) continue;
      const push = (near - d) * 0.5 * (spots[i].y >= spots[j].y ? 1 : -1);
      spots[i].y += push; spots[j].y -= push;
    }
    for (let i = 0; i < spots.length; i++) {
      spots[i].y = THREE.MathUtils.clamp(spots[i].y, SAND + 0.1, waterY - 0.06);
      const s = paths[i].len / fishLen; scl.set(s, s, s);
      fish.setMatrixAt(i, m4.compose(spots[i], q.setFromEuler(turn[i]), scl));
    }
  }
  const lead = { ax: 0.1, az: 0.5, cx: 0, cz: 0, w: -0.32, y: SAND + 0.2, p: 1.2 };
  function schoolAt(i, tt) {
    const [ox, oy, oz, ph] = offsets[i];
    const a = lead.p + lead.w * tt + oz * 1.6;
    const sway = 0.02 * Math.sin(tt * 0.7 + ph);
    pos.set(lead.cx + (lead.ax + ox) * Math.sin(a) + sway, lead.y + oy + 0.03 * Math.sin(tt * 0.3) + 0.008 * Math.sin(tt * 1.3 + ph), lead.cz + (lead.az + ox * 0.5) * Math.cos(a));
    const fear = flee(tt, 0.26), fleeYaw = e.y;
    pos.x = THREE.MathUtils.clamp(pos.x, -lim.x, lim.x); pos.z = THREE.MathUtils.clamp(pos.z, -lim.z, lim.z); pos.y = Math.max(pos.y, SAND + 0.08);
    const vx = (lead.ax + ox) * Math.cos(a) * lead.w, vz = -(lead.az + ox * 0.5) * Math.sin(a) * lead.w;
    e.set(0, Math.atan2(vx, vz) + 0.15 * Math.sin(tt * 2.1 + ph), 0);
    if (fear > 0) e.y = mixAngle(e.y, fleeYaw, fear);
    const s = 0.9 + 0.3 * ((ph * 7) % 1); scl.set(s, s, s);
    school.setMatrixAt(i, m4.compose(pos, q.setFromEuler(e), scl));
  }

  function update(tt) {
    time.value = tt;
    for (let i = 0; i < NS; i++) schoolAt(i, tt);
    school.instanceMatrix.needsUpdate = true;
    if (fish) { paths.forEach((f, i) => swim(i, f, tt)); separate(); fish.instanceMatrix.needsUpdate = true; }
  }
  update(0);
  // (x, z) in the tank's own frame, at the room's time `tt`
  const scare = (x, z, tt) => { fright.x = x; fright.z = z; fright.t = tt; };
  return { group, update, waterY, rimY: H, scare, sandY: SAND + 0.05, lamp: [lampX, H + 0.04, 0], toRoom: (v) => group.localToWorld(v) };
}

// A fish's body swings from side to side, more towards the tail: a wave along it, in the vertex
// shader of its own material (so it keeps the room's light and fog), each instance out of step.
function wiggle(mat, time, { len, amp, k, speed, key, head = 1 }) {
  mat.onBeforeCompile = (s) => {
    s.uniforms.uTime = time;
    s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nuniform float uTime;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        float along = clamp(0.5 - ${head.toFixed(1)} * position.z / ${len.toFixed(4)}, 0.0, 1.0); // 0 at the head, 1 at the tail
        float ph = float(gl_InstanceID) * 1.7;
        transformed.x += sin(position.z * ${k.toFixed(2)} - uTime * ${speed.toFixed(1)} + ph) * ${amp.toFixed(4)} * (0.25 + along * along * 1.6);`);
  };
  mat.customProgramCacheKey = () => `aquarium-${key}`;
  return mat;
}

// A small fish of 4 cm, drawn from an ellipsoid and a forked tail, its head to +z: the back
// carries a bright stripe, the belly is silver, the tail red.
function schoolFishGeometry({ back, belly, tail }) {
  const body = new THREE.SphereGeometry(1, 12, 8);
  body.scale(0.0055, 0.009, 0.02);
  const cBack = new THREE.Color(back), cBelly = new THREE.Color(belly), cTail = new THREE.Color(tail);
  const p = body.attributes.position, col = new Float32Array(p.count * 3), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i) / 0.009, z = p.getZ(i) / 0.02;
    c.copy(cBelly).lerp(new THREE.Color('#5a6670'), THREE.MathUtils.smoothstep(y, 0.4, 0.9));
    if (y > 0.05 && y < 0.45) c.copy(cBack);                         // the stripe
    if (z < -0.35 && y < 0.15) c.lerp(cTail, 0.8);                    // the red at the back
    c.toArray(col, i * 3);
  }
  body.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const tailGeo = new THREE.BufferGeometry();
  tailGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, -0.017, 0, 0.008, -0.03, 0, 0, -0.026, 0, 0, -0.017, 0, 0, -0.026, 0, -0.008, -0.03], 3));
  tailGeo.setAttribute('color', new THREE.Float32BufferAttribute(Array(6).fill(cTail.toArray()).flat(), 3));
  tailGeo.computeVertexNormals();
  const b = body.toNonIndexed(); b.deleteAttribute('uv');
  return mergeGeometries([b, tailGeo]);
}
