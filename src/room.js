import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { door as doorText, tapes, hotspots, theme, people, outside, cv, contact, emailText, closedSource, body as bodyLook, grid, playlist, shell as look, models as modelFiles, stack as tapeStack, deck, catalogue } from './config.js';
import { chartTexture } from './grid.js';
import { buildOutside } from './outside.js';
import { buildSea, buildLoop, buildRecords } from './props.js';
import { ROOM, WIN, SILL, buildShell, woodBox, contactShadows } from './shell.js';
import { createFurniture } from './furniture.js';
import { creditsPlate } from './credits.js';
import { buildSimulator } from './simulator.js';
import { fontsReady, frameArt, eyeArt, photoArt, spineArt, noteArt, quoteArt, noiseTex, plasticArt, paperArt, folderArt } from './art.js';
import { buildTapeStack, buildVCR, buildMixtape } from './vhs.js';
import { lived } from './config.js';
import { buildLived } from './lived.js';

// Photographed surfaces (Poly Haven, CC0; CREDITS.md): colour, normal and roughness, or only
// some of them (`maps`). The small files (a phone, a small screen, a slow line) are the colour alone, at 512 px.
const loader = new THREE.TextureLoader();
let anisotropy = 8, lite = false, small = false; // the quality's look and files (src/quality.js), set by loadRoom before anything is built
function pbr(name, repeat = [1, 1], rot = 0, maps = ['diff', 'nor', 'rough']) {
  const map = (k, srgb) => { const t = loader.load(`/textures/pbr/${name}_${k}.jpg`); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); t.rotation = rot; t.anisotropy = anisotropy; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };
  const out = {};
  if (maps.includes('diff')) out.map = map(small ? 'diff.lite' : 'diff', true);
  if (!small && maps.includes('nor')) out.normalMap = map('nor');
  if (!small && maps.includes('rough')) out.roughnessMap = map('rough');
  return out;
}

// Loads your GLB if it exists, otherwise builds the placeholder room
// from config. Either way it returns the same handles, so the rest of
// the app doesn't care where the geometry came from.
export async function loadRoom(scene, url, onProgress = () => {}, quality = { shadowSize: 1024, anisotropy: 8, dust: 400 }) {
  anisotropy = quality.anisotropy; lite = quality.name === 'lite'; small = (quality.files ?? (lite ? 'lite' : 'full')) === 'lite';
  let root, animated = [], ready = Promise.resolve(), furnish = () => {};
  try {
    const head = await fetch(url, { method: 'HEAD' });
    if (!head.ok || !(head.headers.get('content-type') || '').match(/gltf|octet|model/)) throw 0;
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    const gltf = await loader.loadAsync(url, (e) => e.total && onProgress(e.loaded / e.total));
    root = gltf.scene;
    root.userData.cameras = gltf.cameras;
    useBakedLighting(root);
  } catch {
    await fontsReady();
    ({ root, animated, ready, furnish } = placeholderRoom());
  }
  onProgress(1);
  scene.add(root);

  const find = (n) => root.getObjectByName(n);
  const v = new THREE.Vector3();
  const lamp = new THREE.PointLight(0xffc98a, 5, 5, 1.7);
  lamp.position.copy(find('lamp_bulb')?.getWorldPosition(v) ?? find('lamp')?.getWorldPosition(v) ?? v.set(-0.55, 1.25, -1.6));
  lamp.castShadow = true; lamp.shadow.mapSize.setScalar(quality.shadowSize); lamp.shadow.bias = -0.002; lamp.shadow.radius = 4;
  scene.add(lamp);
  const lampFull = lamp.intensity;
  const tvLight = new THREE.PointLight(0x88aaff, 0, 3, 2); // tinted by the playing tape
  const screen = find('screen');
  tvLight.position.copy(screen ? screen.getWorldPosition(v) : v.set(0, 1.15, -1.3)).add(new THREE.Vector3(0, 0, 0.4));
  scene.add(tvLight);
  const neon = new THREE.PointLight(theme.accent, 1.2, 2.5, 2); // the sign's red spill on the wall
  neon.position.copy(find('sign')?.getWorldPosition(v) ?? v.set(0, 2, -1.9)).add(new THREE.Vector3(0, 0, 0.3));
  scene.add(neon);
  const moon = new THREE.DirectionalLight(0x9db4ff, 0.55); // through the window
  moon.position.set(2.6, 2.6, -3); moon.target.position.set(0.5, 0, 0.5);
  scene.add(moon, moon.target);
  const sky = new THREE.HemisphereLight(0x55628a, 0x1a1410, 0.8);
  scene.add(sky);
  // the day: the sun comes in through the window, warm, and the sky fills the room
  const sun = new THREE.DirectionalLight(0xfff0d8, 0);
  sun.position.set(3.6, 4.2, -4.5); sun.target.position.set(0.2, 0, 0.8);
  sun.castShadow = true; sun.shadow.mapSize.setScalar(quality.shadowSize); sun.shadow.bias = -0.001;
  Object.assign(sun.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 0.5, far: 14 });
  scene.add(sun, sun.target);
  // the lamp of the room, hanging from the ceiling rose: dim and warm in the evening, off by day
  const hang = new THREE.PointLight(0xffc48a, 0, 7.5, 1.5);
  const chandelier = find('chandelier');
  if (chandelier) { hang.position.copy(chandelier.getWorldPosition(v)).y -= 0.52; scene.add(hang); }
  // the standing lamp by the sofa (src/lived.js): its shade glows in the evening, and on the laptop's look it lights its corner
  const stand = new THREE.PointLight(0xffb878, 0, 3.2, 2);
  const shade = find('stand_shade');
  if (shade && !lite) { stand.position.copy(shade.getWorldPosition(v)).y -= 0.04; scene.add(stand); }
  // The walls are light, so the night is made of lamps, not of a sky that fills the room: a little
  // blue from the window, the hanging lamp dim, the desk lamp's pool on the desk.
  const NIGHT = { sky: [0x46578c, 0x15100c, 0.24], moon: 0.3, sun: 0, neon: 1.1, lamp: 0.45, hang: 2.4, stand: 0.22, env: Math.min(scene.environmentIntensity ?? 0.12, 0.12), bg: scene.background?.clone(), fog: scene.fog?.color.clone() };
  const DAY = { sky: [0xdbe8f7, 0x8a6e52, 1.5], moon: 0, sun: 4.2, neon: 0.5, lamp: 0.35, hang: 0, stand: 0, env: 0.4, bg: new THREE.Color('#a9c3dc'), fog: new THREE.Color('#9fb3c6') };
  const dust = buildDust(quality.dust); scene.add(dust);
  let day = false;
  function setDay(on) {
    dust.material.uniforms.bright.value = on ? 1 : 0.18; // by day the sun lights it; at night only the moon
    day = on; root.userData.day = on; const m = on ? DAY : NIGHT;
    sky.color.set(m.sky[0]); sky.groundColor.set(m.sky[1]); sky.intensity = m.sky[2];
    moon.intensity = m.moon; sun.intensity = m.sun; neon.intensity = m.neon; hang.intensity = m.hang;
    if (root.userData.hangGlow) root.userData.hangGlow.emissiveIntensity = m.hang ? 1.6 : 0;
    stand.intensity = m.stand; if (root.userData.standGlow) root.userData.standGlow.emissiveIntensity = m.stand ? 0.5 : 0;
    // a lamp in daylight adds little; at full power, 0.35 m from the fax's page, it burns it white
    lamp.userData.full = lampFull * m.lamp; if (lamp.intensity) lamp.intensity = lamp.userData.full;
    scene.environmentIntensity = m.env;
    if (m.bg) scene.background = m.bg; if (m.fog && scene.fog) scene.fog.color.copy(m.fog);
    root.userData.outside?.setDay?.(on);
  }

  const bulb = find('lamp_bulb');
  const handle = {
    root, find, lamp, tvLight, screen, vcr: find('vcr'),
    furnish,        // asks for the furniture that is files: called once the room is on screen
    ready,          // the furniture that is files has arrived, or failed and left its stand-in (src/furniture.js)
    onChange: null, // called when a piece of it arrives after the room is on screen: draw the shadows again
    get day() { return day; }, setDay,
    // the door: 0 shut, 1 open (about 100°); the light beyond shows only while it is ajar
    setDoor(k) {
      const leaf = find('door_leaf'), glow = find('door_beyond'); if (!leaf) return;
      leaf.rotation.y = -1.75 * k; if (glow) glow.visible = k > 0.001;
    },
    setRain(on) { const r = root.getObjectByName('rain_glass'); if (r) r.visible = on; },
    update(t) {
      for (const a of animated) a(t); if (!still) dust.material.uniforms.time.value = t;
      if (bulb) bulb.visible = lamp.intensity > 0; // the bulb is lit only while the lamp is on
      if (root.userData.lampGlow) root.userData.lampGlow.material.emissiveIntensity = lamp.intensity > 0 ? 0.9 : 0;
      if (root.userData.arrived) { root.userData.arrived = false; if (root.userData.hangGlow) root.userData.hangGlow.emissiveIntensity = hang.intensity ? 1.6 : 0; handle.onChange?.(); }
    },
  };
  return handle;
}

// Dust in the window's light: 400 motes drifting in the air between the
// window and the desk, one draw call. They move with the room's clock, so
// `just record` films the same motes every time, and they stay still
// under reduced motion (invariant 8).
const still = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
function buildDust(n = 400) {
  let s = 7; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const base = [], seed = [];
  for (let i = 0; i < n; i++) { base.push(-1.1 + rnd() * 2.6, 0.7 + rnd() * 2.1, -1.85 + rnd() * 2.2); seed.push(rnd()); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(base, 3));
  geo.setAttribute('seed', new THREE.Float32BufferAttribute(seed, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, bright: { value: 0.18 } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    vertexShader: `attribute float seed; uniform float time; varying float a;
      void main() {
        vec3 p = position;
        p.y = 0.7 + mod(p.y - 0.7 - time * (0.004 + 0.01 * seed), 2.1);               // a slow fall, round again
        p += 0.04 * vec3(sin(time * 0.31 + seed * 40.0), sin(time * 0.23 + seed * 17.0), cos(time * 0.27 + seed * 29.0));
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        a = 0.35 + 0.65 * fract(seed * 7.13);
        gl_PointSize = (1.2 + 2.0 * fract(seed * 3.7)) * (2.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `uniform float bright; varying float a;
      void main() { float d = length(gl_PointCoord - 0.5); gl_FragColor = vec4(vec3(1.0, 0.93, 0.8) * 0.5 * a * bright * smoothstep(0.5, 0.0, d), 1.0); }`,
  });
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; pts.name = 'dust';
  return pts;
}

// If you bake lighting in Blender (Cycles -> Bake -> Combined into the
// base color texture), lighting is already in the pixels. Swapping to
// unlit materials makes it look exactly like the render and runs fast.
// Name a mesh with the suffix "_live" to keep it lit in real time.
function useBakedLighting(root) {
  root.traverse((o) => {
    if (!o.isMesh || o.name.endsWith('_live')) return;
    const m = o.material;
    if (m?.map) o.material = new THREE.MeshBasicMaterial({ map: m.map, transparent: m.transparent });
  });
}

// ─────────────────────────────────────────────────────────────
// The placeholder room. Static furniture is merged by colour, so the
// whole room stays well under 100 draw calls; anything that can be
// hovered is its own named mesh or group.
// ─────────────────────────────────────────────────────────────
// Where the furniture stands, in metres. The desk is under the window, against the back wall:
// a writing desk of 2.20 × 0.90, its top 0.805 above the floor.
const DESK = { x: 0.2, z: -1.51, w: 2.2, d: 0.9, top: 0.805 };
// The television stands on a wooden riser with the video recorder in its slot: a 21-inch set,
// 0.58 wide and 0.60 tall, its screen 0.45 × 0.34.
// The glass of its tube bulges: `glass` is where its middle is on the set, and how fast it falls away (per metre², across and up).
const TV = { x: 0.0, z: -1.544, rise: 0.147, h: 0.596, screen: [0.49, 0.362], glass: { at: [0.003, 0.372, 0.2577], fall: [0.659, 0.552] } };
// The bookcase, left of the window: 1.20 × 1.90 × 0.36, and the heights of its six shelves.
const CASE = { x: -2.15, z: -1.81, w: 1.2, h: 1.9, d: 0.36, levels: [0.101, 0.359, 0.617, 0.884, 1.179, 1.529] };

const LEAF = { roughness: 0.7 }, leafTime = { value: 0 };
function placeholderRoom() {
  const g = new THREE.Group();
  const animated = [];
  const mats = new Map();
  const std = (color, opts = {}) => {
    const key = color + JSON.stringify(opts);
    if (!mats.has(key)) mats.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.75, ...opts }));
    return mats.get(key);
  };
  // static parts, merged per material at the end
  const statics = new Map();
  const part = (geo, pos, color, { rot, opts } = {}) => {
    geo = geo.clone();
    if (rot) geo.rotateX(rot[0]).rotateY(rot[1]).rotateZ(rot[2]);
    geo.translate(...pos);
    const own = color?.isMaterial; // a material of its own (the wood), or a colour
    const key = own ? color.uuid : color + JSON.stringify(opts ?? {});
    if (!statics.has(key)) statics.set(key, { mat: own ? color : std(color, opts), geos: [] });
    statics.get(key).geos.push(geo);
  };
  const box = (size, pos, color, o) => part(new THREE.BoxGeometry(...size), pos, color, o);
  const rbox = (size, pos, color, o) => part(new RoundedBoxGeometry(...size, 2, Math.min(...size) * 0.25), pos, color, o);
  const mesh = (name, geo, mat, pos, parent = g) => {
    const m = new THREE.Mesh(geo, mat); m.name = name; m.position.set(...pos);
    m.castShadow = m.receiveShadow = true; parent.add(m); return m;
  };
  // several pieces of one material as one mesh: [[geometry, position], …]
  const fuse = (pieces, mat, parent = g, name = '') => mesh(name, mergeGeometries(pieces.map(([geo, pos]) => {
    const q = geo.index ? geo.toNonIndexed() : geo; q.translate(...pos); return q;
  })), mat, [0, 0, 0], parent);
  const named = (name) => { const grp = new THREE.Group(); grp.name = name; g.add(grp); return grp; };
  const art = (kind) => hotspots.filter((h) => h.art?.kind === kind);
  // the furniture that is files: each `place` leaves a holder with a stand-in, and the model takes its place
  const F = createFurniture(modelFiles, { lite, small, anisotropy, onChange: () => { g.userData.arrived = true; } });
  const sbox = (s, size, pos, color, opts) => mesh('', new THREE.BoxGeometry(...size), std(color, opts), pos, s); // a stand-in's box

  // ── the shell: an old apartment (src/shell.js) ──
  const ROSE = [0.2, 0.9], DOOR = { x: -1.55, w: 0.9, h: 2.08 };
  const { wood, fz, woodPer } = buildShell({ mesh, part, std, pbr, lite, look, rose: ROSE, doorGap: [DOOR.x - DOOR.w / 2 - 0.09, DOOR.x + DOOR.w / 2 + 0.09] });
  const wb = (w, h, d, pos, o) => part(woodBox(w, h, d, { per: woodPer, ...o }), pos, wood); // a piece of the dark wood
  const brass = std(look.brass, { metalness: 0.8, roughness: 0.3 });

  // ── the desk: walnut, under the window; an apron with three drawers, four square legs ──
  const top = DESK.top, deskZ = DESK.z;
  const walnut = new THREE.MeshStandardMaterial({ color: '#e6a970', ...pbr('american_walnut_veneer', [1, 1]), roughness: 0.85, normalScale: new THREE.Vector2(0.6, 0.6) });
  const wal = (w, h, d, pos, o) => part(woodBox(w, h, d, { per: 1.4, grain: 'u', ...o }), pos, walnut);
  {
    const { x, z, w, d } = DESK, a = 0.11, ay = top - 0.047 - a / 2; // the apron, and its middle
    wal(w, 0.035, d, [x, top - 0.0175, z]); wal(w - 0.03, 0.012, d - 0.03, [x, top - 0.041, z]);     // the top, and the moulding under its edge
    wal(w - 0.16, a, 0.02, [x, ay, z - d / 2 + 0.07]); wal(w - 0.16, a, 0.02, [x, ay, z + d / 2 - 0.07]); // the apron, back and front
    for (const sx of [-1, 1]) wal(0.02, a, d - 0.16, [x + sx * (w / 2 - 0.07), ay, z]);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) wal(0.055, top - 0.035, 0.055, [x + sx * (w / 2 - 0.075), (top - 0.035) / 2, z + sz * (d / 2 - 0.075)]);
    const dw = (w - 0.34) / 3; // three drawers in the front apron, a brass knob on each
    for (const k of [-1, 0, 1]) {
      wal(dw - 0.02, a - 0.024, 0.014, [x + k * dw, ay, z + d / 2 - 0.058]);
      part(new THREE.SphereGeometry(0.013, 12, 8), [x + k * dw, ay, z + d / 2 - 0.04], look.brass, { opts: { metalness: 0.8, roughness: 0.3 } });
    }
  }

  // the television, on a riser of the same wood with the video recorder in its slot
  const tvY = top + TV.rise;
  wal(0.66, 0.022, 0.52, [TV.x, tvY - 0.011, TV.z]);
  for (const sx of [-1, 1]) wal(0.022, TV.rise - 0.022, 0.52, [TV.x + sx * 0.319, (top + tvY - 0.022) / 2, TV.z], { along: 'z' });
  F.place('tv', g, { at: [TV.x, tvY, TV.z], fit: { h: TV.h }, standin: (s) => {
    sbox(s, [0.58, TV.h - 0.03, 0.44], [0, TV.h / 2 + 0.015, -0.035], '#2b2b2d', { roughness: 0.6 });
    sbox(s, [0.5, 0.39, 0.02], [0, TV.glass.at[1], 0.19], '#101012', { roughness: 0.3 });
  } });
  // the picture lies on the glass: a sheet bent like it, a few millimetres in front, its edge behind the set's own frame
  const sheet = new THREE.PlaneGeometry(...TV.screen, 16, 12), sp = sheet.attributes.position;
  for (let i = 0; i < sp.count; i++) sp.setZ(i, -TV.glass.fall[0] * sp.getX(i) ** 2 - TV.glass.fall[1] * sp.getY(i) ** 2);
  const screen = mesh('screen', sheet, new THREE.MeshBasicMaterial({ color: 0x111111 }), [TV.x + TV.glass.at[0], tvY + TV.glass.at[1], TV.z + TV.glass.at[2] + 0.004]);
  screen.castShadow = false;
  // the video recorder in the riser's slot, at its real size, its slot and its clock toward the room (src/vhs.js)
  const vcr = buildVCR(deck, { lite, anisotropy }); vcr.position.set(TV.x, top, TV.z + 0.108); g.add(vcr); animated.push(vcr.userData.update);

  // the tapes: two piles on the desk beside it, most in their card sleeves (src/vhs.js), each with the band of
  // its GitHub account. Each pile's sleeves open away from the other, and a cassette needs 0.21 m of free desk
  // there to slide out. The piles are turned a little toward the chair, so the spines read from the desk shot.
  const pile = buildTapeStack(tapes, tapeStack, { lite, anisotropy, accounts: catalogue?.accounts }); pile.position.set(0.82, top, -1.27); pile.rotation.y = -0.2; g.add(pile); animated.push(pile.userData.update);

  // the desk lamp: an architect's lamp clamped to the back of the desk, its shade over the papers
  // (the file's own origin is the middle of its footprint: the clamp is 0.3 behind it, the bulb 0.18 before it and 0.69 up)
  const LAMP = { at: [-0.6, top, -1.7], rot: Math.PI + 0.1, bulb: [-0.005, 0.69, -0.18] };
  const lamp = F.place('lamp', g, { at: LAMP.at, rot: LAMP.rot, name: 'lamp', anchor: 'origin', standin: (s) => {
    mesh('', new THREE.CylinderGeometry(0.012, 0.012, 0.56, 8).rotateX(-0.35), brass, [0, 0.27, 0.2], s);
    mesh('', new THREE.CylinderGeometry(0.01, 0.01, 0.36, 8).rotateX(1.25), brass, [0, 0.6, -0.02], s);
    mesh('', new THREE.ConeGeometry(0.09, 0.11, 20, 1, true), std('#c8551e', { side: THREE.DoubleSide, roughness: 0.5 }), [0, 0.72, -0.18], s);
  }, tune: (m, o) => {
    o.castShadow = !/light/.test(m.name); // the bulb does not shade its own light
    if (/light/.test(m.name)) g.userData.lampGlow = o; // the mesh, not the material: a hover gives the mesh a copy of it (src/interact.js)
    // The light sits inside the shade, 2 cm from its enamel, which would be thousands of times white: a white-hot
    // disc, and sparks that the bloom spreads over the frame. What the lamp's own surfaces send back is capped at
    // a warm white just above the bloom's threshold: a lit shade with a soft halo, never a burn (`just blow-light`).
    m.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <opaque_fragment>', 'outgoingLight = min( outgoingLight, vec3( 1.6, 1.33, 0.98 ) );\n#include <opaque_fragment>'); };
  } });
  // where the light is: a small bulb, inside the file's own when it is there
  const bulb = mesh('lamp_bulb', new THREE.SphereGeometry(0.014, 12, 8), new THREE.MeshBasicMaterial({ color: '#ffe2b0' }), LAMP.bulb, lamp);
  bulb.castShadow = false;

  // the fax: the address on the page it printed, and a LinkedIn button
  for (const h of art('fax')) {
    const fax = named(h.name); fax.position.set(-0.84, top, -1.56); fax.rotation.y = 0.5;
    const faxPlastic = new THREE.MeshStandardMaterial({ map: plasticArt('#cfc8ba', 11), bumpMap: noiseTex(256, 30, 11), bumpScale: 0.4, roughness: 0.62 });
    fuse([[new RoundedBoxGeometry(0.32, 0.09, 0.26, 2, 0.02), [0, 0.045, 0]], [new RoundedBoxGeometry(0.3, 0.05, 0.12, 2, 0.015), [0, 0.1, -0.06]]], faxPlastic, fax);
    mesh('', new THREE.PlaneGeometry(0.1, 0.03), new THREE.MeshBasicMaterial({ color: '#9fb88a' }), [-0.06, 0.0905, 0.07], fax).rotation.x = -Math.PI / 2; // the display
    fuse(Array.from({ length: 12 }, (_, k) => [new THREE.BoxGeometry(0.018, 0.008, 0.016), [0.04 + (k % 3) * 0.024, 0.093, 0.03 + Math.floor(k / 3) * 0.022]]), std('#4a4740'), fax); // the keys
    const page = mesh('', new THREE.PlaneGeometry(0.21, 0.27), new THREE.MeshStandardMaterial({ map: paperArt({ lines: ['FAX', '', `to: you`, `from: ${contact.name}`, '', emailText, '', contact.linkedin.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')], stamp: 'RECEIVED' }), side: THREE.DoubleSide, color: '#d2cbbd', roughness: 0.9 }), [0, 0.24, -0.1], fax); // off-white: the lamp is 0.35 m away
    page.rotation.x = -0.32; page.castShadow = false;
    const li = new THREE.Group(); li.name = 'fax_linkedin'; li.position.set(0.12, 0.092, -0.03); fax.add(li);
    mesh('', new THREE.CylinderGeometry(0.018, 0.018, 0.012, 20), std('#0a66c2', { roughness: 0.4, emissive: '#0a66c2', emissiveIntensity: 0.25 }), [0, 0.006, 0], li);
    const tag = document.createElement('canvas'); tag.width = tag.height = 64; const tc = tag.getContext('2d');
    tc.fillStyle = '#0a66c2'; tc.fillRect(0, 0, 64, 64); tc.fillStyle = '#fff'; tc.font = 'bold 40px Arial, sans-serif'; tc.textAlign = 'center'; tc.textBaseline = 'middle'; tc.fillText('in', 32, 34);
    const tagTex = new THREE.CanvasTexture(tag); tagTex.colorSpace = THREE.SRGBColorSpace;
    const cap = mesh('', new THREE.CircleGeometry(0.017, 20), new THREE.MeshBasicMaterial({ map: tagTex }), [0, 0.0125, 0], li); cap.rotation.x = -Math.PI / 2; cap.castShadow = false;
  }

  // the note: the inspiration
  for (const h of art('note')) {
    const note = mesh(h.name, new THREE.PlaneGeometry(0.16, 0.12), new THREE.MeshStandardMaterial({ map: noteArt({ glyph: h.art.glyph, lines: [h.label.replace(/^.*?: /, ''), h.hint], theme }), roughness: 0.9 }), [-0.2, top + 0.002, -1.16]);
    note.rotation.set(-Math.PI / 2, 0, 0.18); note.castShadow = false;
  }
  for (const h of art('credits')) g.add(creditsPlate(h.name, h.art, [3.08, 1.47, ROOM.z0 + 0.007])); // the credits plate, on the back wall beside the people's board (src/credits.js)

  // ── under the desk: a file marked closed source, a letter half out of it ──
  for (const h of art('folder')) {
    const f = named(h.name); f.position.set(0.72, 0.014, -0.92); f.rotation.y = -0.35;
    mesh('', new THREE.BoxGeometry(0.32, 0.012, 0.24), [std('#c9a764'), std('#c9a764'), new THREE.MeshStandardMaterial({ map: folderArt({ title: closedSource.label }), roughness: 0.85 }), std('#c9a764'), std('#c9a764'), std('#c9a764')], [0, 0, 0], f);
    const letter = mesh('letter_closed-source', new THREE.PlaneGeometry(0.2, 0.28), new THREE.MeshStandardMaterial({ map: paperArt({ lines: closedSource.letter.lines, stamp: 'CONFIDENTIAL', size: 13 }), roughness: 0.9 }), [0.13, 0.008, 0.06], f);
    letter.rotation.set(-Math.PI / 2, 0, 0.5); letter.castShadow = false;
  }

  // ── the bots: two small robots on the desk, eyes that blink ──
  art('bot').forEach((h, i) => {
    const bot = named(h.name);
    bot.position.set(i === 0 ? 1.14 : -0.5, top, i === 0 ? -1.72 : -1.3);
    bot.rotation.y = i === 0 ? -0.5 : 0.45;
    const shell = std(h.art.color, { roughness: 0.4, metalness: 0.2 });
    const dark = std('#15171d', { roughness: 0.5 });
    mesh('', new RoundedBoxGeometry(0.16, 0.12, 0.12, 2, 0.03), shell, [0, 0.08, 0], bot);
    mesh('', new RoundedBoxGeometry(0.2, 0.15, 0.15, 3, 0.045), shell, [0, 0.22, 0], bot);
    mesh('', new RoundedBoxGeometry(0.15, 0.08, 0.01, 2, 0.004), dark, [0, 0.225, 0.075], bot);
    const eyeMat = new THREE.MeshBasicMaterial({ color: i === 0 ? '#5dffa0' : '#9fd8ff', toneMapped: false });
    const eyes = [-0.035, 0.035].map((x) => mesh('', new THREE.SphereGeometry(0.014, 10, 8), eyeMat, [x, 0.228, 0.082], bot));
    mesh('', new THREE.CylinderGeometry(0.004, 0.004, 0.08, 6), dark, [0, 0.33, 0], bot);
    mesh('', new THREE.SphereGeometry(0.016, 10, 8), eyeMat, [0, 0.375, 0], bot);
    if (i === 1) for (const s of [-1, 1]) { // hermes has wings
      const wing = mesh('', new THREE.BoxGeometry(0.005, 0.06, 0.1), std('#e8ecf3'), [s * 0.105, 0.24, -0.01], bot);
      wing.rotation.z = s * 0.5;
    }
    const phase = i * 1.7;
    animated.push((t) => {
      const blink = (t + phase) % 4.2 < 0.12 ? 0.15 : 1;
      eyes.forEach((e) => { e.scale.y = blink; });
      bot.children[1].rotation.y = Math.sin(t * 0.6 + phase) * 0.12;
    });
  });

  // ── the right of the back wall: the eye, the letter board beside it, the people below ──
  const RX = 2.56;
  for (const h of art('quote')) {
    const board = named(h.name); board.position.set(RX + 0.42, 2.3, -1.975);
    mesh('', new THREE.BoxGeometry(0.62, 0.44, 0.025), std('#5a3d28', { roughness: 0.7 }), [0, 0, 0], board);
    mesh('', new THREE.PlaneGeometry(0.58, 0.4), new THREE.MeshStandardMaterial({ map: quoteArt({ text: h.art.text, by: h.art.by, theme }), roughness: 0.95 }), [0, 0, 0.0135], board).castShadow = false;
  }
  for (const h of hotspots.filter((x) => x.name === 'sign')) {
    const sign = named(h.name); sign.position.set(RX - 0.36, 2.3, -1.97);
    box([0.62, 0.62, 0.02], [RX - 0.36, 2.3, -1.985], '#111');
    const face = mesh('', new THREE.PlaneGeometry(0.56, 0.56), new THREE.MeshStandardMaterial({ map: eyeArt(theme), emissiveMap: eyeArt(theme), emissive: '#ffffff', emissiveIntensity: 1.6, toneMapped: false }), [0, 0, 0.002], sign);
    face.castShadow = false;
    animated.push((t) => { face.material.emissiveIntensity = 1.5 + Math.sin(t * 2.1) * 0.05 + (Math.sin(t * 13.7) > 0.995 ? -0.6 : 0); });
  }

  // ── the window on Rio: the glass in the frame of src/shell.js, and the city behind it ──
  const { x: wx, y: wy, w: ww, h: wh } = WIN;
  const glass = mesh('window', new THREE.PlaneGeometry(ww - 0.1, wh - 0.1), new THREE.MeshPhysicalMaterial({ color: '#9fb6d8', roughness: 0.35, metalness: 0.1, transparent: true, opacity: 0.07, depthWrite: false }), [wx, wy, fz - 0.01]);
  glass.renderOrder = 3; glass.castShadow = false;
  const view = buildOutside(g, { center: new THREE.Vector3(wx, wy, fz - 0.02), aim: outside?.aim, night: outside?.night, day: outside?.day, small });
  animated.push(view); g.userData.outside = view;

  // piabrota RADIO on the sill: a radio cassette player, its dial lit while it plays
  const RADIO = { x: 1.07, w: 0.46 };
  const radio = F.place('radio', g, { at: [RADIO.x, SILL.y, SILL.z - 0.02], rot: -0.12, name: 'radio', fit: { w: RADIO.w }, standin: (s) => {
    sbox(s, [RADIO.w, 0.16, 0.1], [0, 0.08, 0], '#1b1b1d', { roughness: 0.5 });
  } });
  mesh('radio_dial', new THREE.PlaneGeometry(0.2, 0.012), new THREE.MeshStandardMaterial({ color: '#2a2622', emissive: '#ffb066', emissiveIntensity: 0, roughness: 0.4 }), [0, 0.139, 0.064], radio).castShadow = false;
  F.place('aloe', g, { at: [wx - ww / 2 + 0.32, SILL.y, SILL.z - 0.01], rot: 0.6, fit: { h: 0.25 } });

  // the mixtape beside it: a cassette leaning on the glass, the owner's playlist (config.playlist)
  for (const h of art('mixtape')) {
    const tape = buildMixtape(playlist.tape, { lite, anisotropy, theme, scale: 1.6 }); tape.name = h.name; g.add(tape); // a big one, to be seen from the room
    tape.position.set(0.47, SILL.y + tape.userData.foot, SILL.z - 0.035); tape.rotation.set(-0.1, 0.22, 0);
    animated.push(tape.userData.update);
  }

  // ── the board: people pinned as polaroids, under the eye ──
  const bx = RX - 0.25, by = 1.45;
  rbox([0.95, 0.62, 0.03], [bx, by, -1.985], '#8a6a46', { opts: { roughness: 1 } });
  art('photo').forEach((h, i) => {
    const p = people.find((x) => `photo_${x.id}` === h.name) ?? { name: h.label.replace('@', ''), line: h.hint };
    const lanes = Object.values(theme.lanes);
    const ph = mesh(h.name, new THREE.PlaneGeometry(0.22, 0.258), new THREE.MeshStandardMaterial({ map: photoArt({ name: p.name, line: p.line, color: lanes[i % lanes.length], theme }), roughness: 0.6 }), [bx - 0.28 + i * 0.28, by + (i % 2 ? -0.04 : 0.05), -1.965]);
    ph.rotation.z = [0.06, -0.04, 0.08, -0.07][i % 4]; ph.castShadow = false;
    const pin = mesh('', new THREE.SphereGeometry(0.012, 8, 6), std(theme.accent), [0, 0.11, 0.008], ph); pin.castShadow = false;
  });

  // ── tyler-durden-bot's board, square, on the back wall above the bookshelf of the works with a
  // DOI (config.wip): the owner's pixel portrait as it is, drawn sharp, and a ring of red bulbs that
  // blink at random by night, one draw call ──
  for (const h of art('wip')) {
    const BW = 0.72, BH = 0.72;
    const board = named(h.name); board.position.set(-2.15, 2.47, -1.975);
    mesh('', new THREE.BoxGeometry(BW + 0.08, BH + 0.08, 0.035), std('#2a1d16', { roughness: 0.7 }), [0, 0, 0], board);
    const logo = loader.load(h.art.logo); logo.colorSpace = THREE.SRGBColorSpace; logo.magFilter = THREE.NearestFilter; logo.anisotropy = anisotropy;
    const face = mesh('', new THREE.PlaneGeometry(BW, BH), new THREE.MeshStandardMaterial({ map: logo, roughness: 0.85, emissive: h.art.lights?.color ?? '#ff2a1a', emissiveIntensity: 0 }), [0, 0, 0.018], board);
    face.castShadow = false;
    const n = h.art.lights?.count ?? 26, red = new THREE.Color(h.art.lights?.color ?? '#ff2a1a');
    const bulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.018, 8, 6), new THREE.MeshBasicMaterial({ toneMapped: false }), n);
    bulbs.castShadow = bulbs.receiveShadow = false; board.add(bulbs);
    // the bulbs go round the frame, evenly along its edge
    const per = 2 * (BW + BH) + 0.32, m4 = new THREE.Matrix4();
    for (let i = 0; i < n; i++) {
      let d = (i / n) * per; const w = BW + 0.08, hh = BH + 0.08; let x, y;
      if (d < w) { x = -w / 2 + d; y = hh / 2; } else if ((d -= w) < hh) { x = w / 2; y = hh / 2 - d; } else if ((d -= hh) < w) { x = w / 2 - d; y = -hh / 2; } else { d -= w; x = -w / 2; y = -hh / 2 + Math.min(d, hh); }
      bulbs.setMatrixAt(i, m4.makeTranslation(x, y, 0.03)); bulbs.setColorAt(i, red);
    }
    const dim = red.clone().multiplyScalar(0.12), lit = red.clone().multiplyScalar(1.3), tmp = new THREE.Color();
    const hash = (k) => { const v = Math.sin(k * 12.9898) * 43758.5453; return v - Math.floor(v); };
    let last = -1;
    animated.push((t) => {
      if (g.userData.day) { // by day the bulbs are off: they blink only at night (the owner, 9 November 2026)
        if (last !== -2) { last = -2; for (let i = 0; i < n; i++) bulbs.setColorAt(i, dim); bulbs.instanceColor.needsUpdate = true; face.material.emissiveIntensity = 0; }
        return;
      }
      if (still) { if (last !== -3) { last = -3; for (let i = 0; i < n; i++) bulbs.setColorAt(i, lit); bulbs.instanceColor.needsUpdate = true; } return; }
      const step = Math.floor(t * 9); if (step === last) return; last = step; // nine changes a second, the room's clock
      const burst = hash(Math.floor(t * 1.5) + 0.5) > 0.82, dark = burst && step % 3 === 0; // now and then they all flash
      for (let i = 0; i < n; i++) {
        const on = dark ? false : burst || hash(step * 31.7 + i * 7.3) > 0.42;
        bulbs.setColorAt(i, tmp.copy(on ? lit : dim));
      }
      bulbs.instanceColor.needsUpdate = true;
      face.material.emissiveIntensity = burst && !dark ? 0.12 : 0.02 * hash(step);
    });
  }

  // ── ▲ grid: a chart of the coast's triangle mesh on the right wall; its shot opens the map ──
  for (const h of hotspots.filter((x) => x.name === 'chart')) {
    const chart = named(h.name); chart.position.set(3.37, 1.62, 1.55); chart.rotation.y = -Math.PI / 2;
    mesh('', new THREE.BoxGeometry(1.12, 0.86, 0.025), std('#1b2733', { roughness: 0.6 }), [0, 0, -0.012], chart);
    mesh('', new THREE.PlaneGeometry(1.04, 0.78), (() => { const t = chartTexture(grid); return new THREE.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: '#ffffff', emissiveIntensity: 0.28, roughness: 0.85 }); })(), [0, 0, 0.002], chart).castShadow = false;
  }

  // ── the door, on the front wall: a lock of four digits (config.door, src/lock.js) ──
  // The leaf hangs on a hinge (`door_leaf`, turned by room.setDoor); behind it a warm light and the
  // lines of `door.beyond`, which show only when it swings open.
  for (const h of hotspots.filter((x) => x.name === 'door')) {
    const door = named(h.name); door.position.set(DOOR.x, 0, ROOM.z1 - 0.02); door.rotation.y = Math.PI;
    const dw = DOOR.w, dh = DOOR.h, pw = woodPer;
    const hinge = new THREE.Group(); hinge.name = 'door_leaf'; hinge.position.set(-dw / 2, 0, 0); door.add(hinge);
    // the leaf: a frame of stiles and rails round four raised panels, all in the dark wood, one mesh
    const leaf = [[woodBox(dw, dh, 0.034, { per: pw }), [dw / 2, dh / 2, 0.02]]];
    for (const sx of [0.065, dw - 0.065]) leaf.push([woodBox(0.13, dh, 0.012, { per: pw }), [sx, dh / 2, 0.043]]);
    for (const y of [0.11, 0.98, 1.24, dh - 0.07]) leaf.push([woodBox(dw - 0.26, y < 0.2 ? 0.22 : 0.14, 0.012, { per: pw }), [dw / 2, y, 0.043]]);
    leaf.push([woodBox(0.1, dh - 0.3, 0.012, { per: pw }), [dw / 2, dh / 2 + 0.04, 0.043]]);
    for (const [px, py, w2, h2] of [[0.26, 0.565, 0.24, 0.66], [dw - 0.26, 0.565, 0.24, 0.66], [0.26, 1.63, 0.24, 0.62], [dw - 0.26, 1.63, 0.24, 0.62]]) leaf.push([woodBox(w2, h2, 0.01, { per: pw }), [px, py, 0.042]]);
    fuse(leaf, wood, hinge);
    // the architrave round it
    fuse([...[-1, 1].map((sx) => [woodBox(0.09, dh + 0.09, 0.03, { per: pw }), [sx * (dw / 2 + 0.045), (dh + 0.09) / 2, 0.005]]),
      [woodBox(dw + 0.24, 0.1, 0.036, { per: pw }), [0, dh + 0.05, 0.008]]], wood, door);
    // the brass: the knob, its spindle and the escutcheon
    fuse([[new THREE.SphereGeometry(0.03, 16, 12), [dw - 0.065, 1.0, 0.085]],
      [new THREE.CylinderGeometry(0.012, 0.012, 0.05, 12).rotateX(Math.PI / 2), [dw - 0.065, 1.0, 0.06]],
      [new THREE.BoxGeometry(0.05, 0.16, 0.006), [dw - 0.065, 1.03, 0.052]]], brass, hinge);
    mesh('', new THREE.BoxGeometry(0.05, 0.075, 0.01), std('#2a2c31', { metalness: 0.6, roughness: 0.4 }), [dw - 0.065, 1.2, 0.054], hinge); // the keypad plate
    const tag = paperArt({ lines: ['LOCKED', '', '_ _ _ _'], w: 128, h: 96, size: 14 });
    mesh('', new THREE.PlaneGeometry(0.16, 0.12), new THREE.MeshStandardMaterial({ map: tag, roughness: 0.9 }), [dw / 2, 1.42, 0.058], hinge).castShadow = false;
    // beyond: a warm light, 1 cm in front of the wall, hidden by the closed leaf
    const beyond = paperArt({ lines: doorText.beyond, w: 256, h: 512, size: 22 });
    const glow = mesh('door_beyond', new THREE.PlaneGeometry(dw - 0.02, dh - 0.02), new THREE.MeshBasicMaterial({ map: beyond, color: new THREE.Color(1.0, 0.86, 0.62), fog: false }), [0, dh / 2, -0.01], door);
    glow.castShadow = glow.receiveShadow = false; glow.visible = false;
  }

  // ── the bookcase: the works with a DOI at eye level, the encyclopaedia above and below ──
  const { x: sx, z: sz, w: sw, h: sh, d: sd, levels } = CASE;
  const shelf = F.place('bookcase', g, { at: [sx, 0, sz], name: 'shelf', fit: { w: sw, h: sh, d: sd }, stretch: true, standin: (s) => {
    const c = '#8a7560';
    for (const k of [-1, 1]) sbox(s, [0.035, sh, sd], [k * (sw / 2 - 0.0175), sh / 2, 0], c);
    for (const y of [...levels, sh]) sbox(s, [sw - 0.07, 0.03, sd], [0, y - 0.015, 0], c);
  } });
  // an invisible box so the whole case is hoverable
  const proxy = mesh('', new THREE.BoxGeometry(sw + 0.04, sh + 0.04, sd + 0.06), new THREE.MeshBasicMaterial({ visible: false }), [0, sh / 2, 0.03], shelf);
  proxy.userData.proxy = true; proxy.castShadow = proxy.receiveShadow = false;
  art('book').forEach((h, i) => {
    const hgt = 0.235 + ((i * 37) % 7) * 0.009, th = 0.04 + ((i * 13) % 3) * 0.007;
    const spine = spineArt({ title: h.label, color: h.art.color, theme });
    const cover = std(h.art.color, { roughness: 0.7 });
    const b = mesh(h.name, new THREE.BoxGeometry(th, hgt, 0.2), [cover, cover, cover, cover, new THREE.MeshStandardMaterial({ map: spine, roughness: 0.7 }), cover], [sx - 0.43 + i * 0.064, levels[4] + hgt / 2, sz + 0.03]);
    b.rotation.z = i === 5 ? -0.14 : 0;
    if (i === 5) b.position.x += 0.035;
  });
  // beside them, the papers on aiXiv (config.papers): bound preprints, thin, white covers, each one
  // draw call like the reads below
  art('paper').forEach((h, i) => {
    const hgt = 0.26, th = 0.024;
    const geo = new THREE.BoxGeometry(th, hgt, 0.21), uv = geo.attributes.uv;
    for (let v = 0; v < uv.count; v++) if (v < 16 || v >= 20) uv.setXY(v, 0.02, 0.5);
    const b = mesh(h.name, geo, new THREE.MeshStandardMaterial({ map: spineArt({ title: h.art.spine, color: h.art.color, ink: h.art.ink, by: h.art.by, theme }), roughness: 0.8 }), [sx + 0.05 + i * (th + 0.004), levels[4] + hgt / 2, sz + 0.025]);
    b.castShadow = true;
  });
  // under them, "how I read" (config.reads): ten ebooks as spines in their covers' colours, each
  // one draw call: its box's other faces read the corner of its spine, the cover's colour
  let rx = sx - 0.52, lyingH = 0;
  art('read').forEach((h, i) => {
    const hgt = 0.215 + ((i * 29) % 5) * 0.008, th = 0.03 + ((i * 7) % 3) * 0.005;
    const geo = new THREE.BoxGeometry(th, hgt, 0.17), uv = geo.attributes.uv;
    for (let v = 0; v < uv.count; v++) if (v < 16 || v >= 20) uv.setXY(v, 0.02, 0.5); // every face but the spine (+z): plain colour
    const b = mesh(h.name, geo, new THREE.MeshStandardMaterial({ map: spineArt({ title: h.art.spine, color: h.art.color, ink: h.art.ink, by: h.art.by, theme }), roughness: 0.65 }), [rx + th / 2, levels[3] + hgt / 2, sz + 0.06]);
    b.castShadow = true; rx += th + 0.003;
  });
  // the rest of it: two runs of an encyclopaedia, a clock, a vase, records and boxes at the bottom
  for (const [dx, lv, turn] of [[0.33, 4, 0], [0.22, 2, 0]]) F.place('books', g, { at: [sx + dx, levels[lv], sz + 0.02], rot: turn, fit: { h: 0.235 } });
  F.place('vase', g, { at: [sx + 0.4, sh, sz], fit: { h: 0.3 } });
  F.place('alarm', g, { at: [sx + 0.36, levels[3], sz + 0.04], rot: 0.35, fit: { h: 0.15 } });
  for (let i = 0; i < 14; i++) box([0.005, 0.24, 0.3], [sx - 0.5 + i * 0.016 + (i % 4) * 0.002, levels[1] + 0.12, sz + 0.01], i % 3 ? '#1b1b1b' : '#3a2d2a'); // records, on edge
  const card = (size, pos, color) => part(new RoundedBoxGeometry(...size, 2, 0.008), pos, color, { opts: { roughness: 0.92 } }); // a card box: square, its corners a little worn
  card([0.34, 0.2, 0.26], [sx + 0.3, levels[1] + 0.1, sz], '#7a6448'); card([0.335, 0.02, 0.255], [sx + 0.3, levels[1] + 0.205, sz], '#6b563d');
  // on the top shelf, in the middle of the shelf shot, "what I read" (config.goodreads): the books of the owner's Goodreads, paper
  // books of many sizes, the ones he is reading lying on the pile at the end. One draw call each,
  // like the reads; a card box closes the row
  let gx = sx - 0.53, lying = 0;
  art('gread').forEach((h, i) => {
    const reading = /reading/.test(h.hint) && lying < 2;
    const hgt = 0.2 + ((i * 31) % 6) * 0.011, th = 0.026 + ((i * 11) % 4) * 0.006, dp = 0.14 + ((i * 5) % 3) * 0.012;
    const geo = new THREE.BoxGeometry(th, hgt, dp), uv = geo.attributes.uv;
    for (let v = 0; v < uv.count; v++) if (v < 16 || v >= 20) uv.setXY(v, 0.02, 0.5);
    const b = mesh(h.name, geo, new THREE.MeshStandardMaterial({ map: spineArt({ title: h.art.spine, color: h.art.color, ink: h.art.ink, by: h.art.by, theme }), roughness: 0.82 }), [0, 0, 0]);
    b.castShadow = true;
    if (reading) { // on its side, spine out, on the pile at the right end of the shelf
      b.rotation.z = -Math.PI / 2; b.rotation.y = lying ? 0.09 : -0.05;
      b.position.set(sx + 0.36, levels[5] + 0.071 + lyingH + th / 2, sz + 0.05); lyingH += th; lying++;
    } else {
      const lean = i % 6 === 4 ? -0.1 : 0; // one or two lean on their neighbour
      b.rotation.z = lean; b.position.set(gx + th / 2 + (lean ? 0.012 : 0), levels[5] + hgt / 2, sz + 0.06 - (i % 3) * 0.006); gx += th + 0.003 + (lean ? 0.02 : 0);
    }
  });
  card([0.4, 0.07, 0.24], [sx + 0.36, levels[5] + 0.035, sz + 0.005], '#7c2a22');
  card([0.46, 0.21, 0.28], [sx - 0.22, levels[0] + 0.105, sz], '#6d5a44');
  card([0.36, 0.17, 0.27], [sx + 0.32, levels[0] + 0.085, sz], '#3d3530');

  // ── the fabric wall: one framed print per project ──
  art('frame').forEach((h, i) => {
    const col = i % 4, row = Math.floor(i / 4);
    const z = 1.43 - col * 0.62, y = 2.0 - row * 0.66;
    const frame = named(h.name); frame.position.set(-2.985, y, z); frame.rotation.y = Math.PI / 2;
    mesh('', new THREE.BoxGeometry(0.46, 0.56, 0.025), std('#1c1512', { roughness: 0.45 }), [0, 0, 0.012], frame);
    const pic = mesh('', new THREE.PlaneGeometry(0.42, 0.52), new THREE.MeshStandardMaterial({ map: frameArt({ glyph: h.art.glyph, title: h.label, line: h.hint, color: h.art.color, theme }), roughness: 0.5 }), [0, 0, 0.026], frame);
    pic.castShadow = false;
  });

  // ── the rest of the furniture: photographed pieces, each at its real size ──
  const dark = '#3a2a22', cloth = '#cfc6b4';
  // the chair at the desk: an armchair, pulled out and turned a little
  F.place('chair', g, { at: [-0.62, 0, -0.5], rot: Math.PI + 0.45, fit: { h: 1.0 }, standin: (s) => {
    sbox(s, [0.56, 0.1, 0.52], [0, 0.38, 0.02], '#4d6b5a'); sbox(s, [0.5, 0.52, 0.08], [0, 0.72, -0.26], '#4d6b5a');
    for (const kx of [-1, 1]) for (const kz of [-1, 1]) sbox(s, [0.045, 0.34, 0.045], [kx * 0.26, 0.17, kz * 0.24], dark);
  } });
  // the sofa under the prints, with two pillows at one end
  const SOFA = { x: -2.6, z: 0.5, w: 1.75 };
  F.place('sofa', g, { at: [SOFA.x, 0, SOFA.z], rot: Math.PI / 2, fit: { w: SOFA.w }, standin: (s) => {
    sbox(s, [SOFA.w, 0.22, 0.6], [0, 0.31, 0.03], cloth); sbox(s, [SOFA.w, 0.5, 0.12], [0, 0.62, -0.3], cloth);
    for (const kx of [-1, 1]) sbox(s, [0.1, 0.34, 0.6], [kx * (SOFA.w / 2 - 0.05), 0.5, 0.03], cloth);
  } });
  F.place('pillows', g, { at: [SOFA.x + 0.04, 0.4, SOFA.z + 0.46], rot: Math.PI / 2 - 0.1, fit: { w: 0.66 } });
  // beside it: a tall table with a fern in a clay pot, a ukulele against the wall, a painting above
  F.place('sideTable', g, { at: [2.3, 0, 3.5], fit: { h: 0.7 }, standin: (s) => { sbox(s, [0.34, 0.03, 0.34], [0, 0.685, 0], dark); for (const kx of [-1, 1]) for (const kz of [-1, 1]) sbox(s, [0.03, 0.67, 0.03], [kx * 0.13, 0.335, kz * 0.13], dark); } });
  F.place('pot', g, { at: [2.3, 0.7, 3.5], fit: { h: 0.19 } });
  F.place('fern', g, { at: [2.3, 0.84, 3.5], rot: 0.9, fit: { w: 0.82 }, shadow: false });
  F.place('ukulele', g, { at: [1.86, 0, ROOM.z1 - 0.12], rot: [-0.19, Math.PI, 0.06], fit: { h: 0.6 } });
  F.place('painting', g, { at: [2.3, 1.78, ROOM.z1 - 0.004], rot: Math.PI, anchor: 'back', fit: { w: 0.9 } });
  // the long-case clock in the corner by the door
  F.place('clock', g, { at: [-2.6, 0, ROOM.z1 - 0.24], rot: Math.PI, fit: { h: 2.12 }, standin: (s) => { sbox(s, [0.5, 2.1, 0.32], [0, 1.05, 0], '#6b3f2a'); } });
  // a big plant under the people's board, a suitcase and a box in the far corner, a box under the desk
  F.place('plant', g, { at: [2.32, 0, -1.6], rot: 2.2, fit: { h: 0.98 }, standin: (s) => { mesh('', new THREE.CylinderGeometry(0.2, 0.15, 0.36, 16), std('#b4673e'), [0, 0.18, 0], s); } });
  F.place('box', g, { at: [3.08, 0, 2.86], rot: 0.25, fit: { w: 0.42 } });
  F.place('suitcase', g, { at: [3.03, 0, 3.6], rot: [0.14, Math.PI + 0.08, 0], fit: { w: 0.66 } });
  F.place('box', g, { at: [1.02, 0, -1.62], rot: -0.2, fit: { w: 0.38 } });
  // on the desk: a cup of pencils, pens laid out
  F.place('pencilCup', g, { at: [0.94, top, -1.8], fit: { h: 0.1 } });
  F.place('pens', g, { at: [0.5, top + 0.001, -1.15], rot: 0.3, turn: [-Math.PI / 2, 0, 0], fit: { w: 0.2 } });
  // the lamp of the room hangs from the rose (its light is in loadRoom: dim in the evening, off by day)
  F.place('chandelier', g, { at: [ROSE[0], ROOM.h - 0.07, ROSE[1]], name: 'chandelier', anchor: 'top', fit: { h: 0.82 }, shadow: false, tune: (m) => { if (/bulb/.test(m.name)) { m.emissive.set('#ffd9a0'); m.emissiveIntensity = 0; g.userData.hangGlow = m; } } });

  // ── lived in: an armchair under the painting with a hat stand near it, a low table before the sofa with a thermos,
  // a cabinet of card drawers under the chart; the rest is built in src/lived.js, with the marks of the years ──
  F.place('armchair', g, { at: [-2.36, 0, 2.98], rot: Math.PI / 2 + 0.4, fit: { h: 0.88 }, standin: (s) => {
    sbox(s, [0.6, 0.14, 0.6], [0, 0.36, 0.02], '#1d1c1b'); sbox(s, [0.6, 0.5, 0.12], [0, 0.63, -0.3], '#1d1c1b');
    for (const kx of [-1, 1]) sbox(s, [0.05, 0.56, 0.7], [kx * 0.33, 0.28, 0], '#7a5a3c');
  } });
  F.place('lowTable', g, { at: [-1.72, 0, 0.95], rot: Math.PI / 2, fit: { h: 0.46 }, standin: (s) => {
    sbox(s, [0.79, 0.03, 0.38], [0, 0.445, 0], '#8a7558'); for (const kx of [-1, 1]) for (const kz of [-1, 1]) sbox(s, [0.035, 0.43, 0.035], [kx * 0.36, 0.215, kz * 0.16], '#8a7558');
  } });
  F.place('cards', g, { at: [3.06, 0, 1.3], rot: -Math.PI / 2, fit: { w: 1.25, h: 0.78, d: 0.64 }, stretch: true, standin: (s) => { sbox(s, [1.25, 0.78, 0.56], [0, 0.39, 0], '#8a5a34'); } });
  F.place('thermos', g, { at: [-1.79, 0.46, 1.25], rot: 2.2, fit: { h: 0.3 } });
  const { rack } = buildLived({ g, part, mesh, wood, woodPer, look, words: lived, lite, anisotropy, deskTop: top, door: [DOOR.x - DOOR.w / 2 - 0.09, DOOR.x + DOOR.w / 2 + 0.09], win: [WIN.x - WIN.w / 2 - 0.08, WIN.x + WIN.w / 2 + 0.08], rose: ROSE });
  F.place('hat', g, { at: [rack[0], 1.7, rack[1]], rot: [0.14, 0.8, 0.08], fit: { w: 0.33 }, shadow: false });

  // the soft shadow each thing leaves where it stands
  g.add(contactShadows([
    [DESK.x, DESK.z + 0.05, DESK.w + 0.5, DESK.d + 0.6, 0.34],
    [-0.62, -0.5, 0.95, 0.95, 0.42, 0.014],
    [SOFA.x + 0.05, SOFA.z, 1.05, SOFA.w + 0.35, 0.5], [2.3, 3.5, 0.6, 0.6, 0.4], [-2.6, ROOM.z1 - 0.26, 0.95, 0.75, 0.5],
    [CASE.x, CASE.z + 0.06, CASE.w + 0.3, CASE.d + 0.42, 0.5], [-2.2, -1.15, 0.72, 0.8, 0.45],
    [2.32, -1.6, 0.7, 0.7, 0.45], [3.08, -0.45, 0.95, 2.1, 0.5], [3.08, 2.86, 0.75, 0.8, 0.42], [3.03, 3.62, 0.95, 0.5, 0.4], [ROOM.x0 + 0.3, 2.22, 0.85, 0.95, 0.5], [1.02, -1.62, 0.6, 0.7, 0.3],
  ]));

  // ── the other walls: marola-dev's sea, ouroboric-dev's loop, the slipbox ──
  animated.push(buildSea(g, mesh, std, part, F, { lite, still, hang: [ROSE[0], ROOM.h - 0.75, ROSE[1]] }), buildLoop(g, mesh, std), buildRecords(g, mesh, std, part));

  // the universe simulator by the front wall, its microphone and the chart over it: an homage to The Midnight Gospel (src/simulator.js)
  animated.push(buildSimulator(g, { at: [ROOM.x0, 0, 2.22], turn: Math.PI / 2, lite, still, anisotropy }));

  // the leaves sway a little in the air of the room (the vertex shader; still under reduced motion)
  const sway = std('#2f6b3a', LEAF);
  sway.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = leafTime;
    shader.vertexShader = 'uniform float uTime;\n' + shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      float sw = 0.5 + 0.5 * sin(position.y * 23.0 + position.x * 11.0);
      transformed.x += 0.007 * sw * sin(uTime * 1.1 + position.y * 9.0 + position.z * 4.0);
      transformed.z += 0.006 * sw * cos(uTime * 0.83 + position.y * 7.0);`);
  };
  animated.push((t) => { if (!still) leafTime.value = t; });

  // the rain on the glass, when the rain is on: drops that cling and run down
  const rainGlass = mesh('', new THREE.PlaneGeometry(WIN.w - 0.1, WIN.h - 0.1), new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uAspect: { value: WIN.w / WIN.h } }, transparent: true, depthWrite: false, fog: false,
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `
      uniform float uTime, uAspect; varying vec2 vUv;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float drops(vec2 uv, float scale, float speed) {
        vec2 p = vec2(uv.x * uAspect, uv.y) * scale, cell = floor(p), f = fract(p) - 0.5;
        float h = hash(cell), fall = fract(h * 7.0 + uTime * speed * (0.3 + h));
        vec2 at = vec2((h - 0.5) * 0.6, 0.45 - fall * 0.9);
        float d = length((f - at) * vec2(1.0, 0.75));
        float trail = smoothstep(0.05, 0.0, abs(f.x - at.x)) * smoothstep(at.y, 0.5, f.y) * 0.25;
        return smoothstep(0.09, 0.03, d) * step(0.35, h) + trail * step(0.6, h);
      }
      void main() {
        float a = drops(vUv, 9.0, 0.12) + 0.6 * drops(vUv + 0.37, 17.0, 0.05) + 0.35 * drops(vUv + 0.71, 31.0, 0.0);
        gl_FragColor = vec4(vec3(0.82, 0.88, 0.95), clamp(a, 0.0, 1.0) * 0.32);
      }`,
  }), [WIN.x, WIN.y, fz - 0.005]);
  rainGlass.castShadow = rainGlass.receiveShadow = false; rainGlass.renderOrder = 4; rainGlass.visible = false; rainGlass.name = 'rain_glass';
  animated.push((t) => { if (rainGlass.visible && !still) rainGlass.material.uniforms.uTime.value = t; });

  // merge the static parts: one mesh per material
  for (const { mat, geos } of statics.values()) {
    const m = new THREE.Mesh(mergeGeometries(geos.map((x) => x.index ? x.toNonIndexed() : x)), mat);
    m.castShadow = m.receiveShadow = true; m.name = 'static'; g.add(m);
  }
  // a box with one material a side is six draw calls; its sides of the same material become one
  g.traverse((o) => {
    if (!o.isMesh || !Array.isArray(o.material) || !o.geometry.index || o.geometry.groups.length < 3) return;
    const geo = o.geometry.clone(), ix = geo.index.array, uniq = [...new Set(o.material)], out = new ix.constructor(ix.length);
    let n = 0; geo.clearGroups();
    uniq.forEach((m, k) => {
      const start = n;
      for (const gr of o.geometry.groups) if (o.material[gr.materialIndex] === m) { out.set(ix.subarray(gr.start, gr.start + gr.count), n); n += gr.count; }
      geo.addGroup(start, n - start, k);
    });
    geo.setIndex(new THREE.BufferAttribute(out, 1)); o.geometry = geo; o.material = uniq;
  });
  return { root: g, animated, ready: F.ready, furnish: () => F.start() };
}

// You: a pair of sneakers and the legs of a pair of jeans, standing under
// the camera and turned the way it looks, so looking down from where you
// stand shows your own feet. Hidden when the camera is low (the slipbox).
export function buildBody(look) {
  const g = new THREE.Group(); g.name = 'you';
  const mat = (color, roughness = 0.8) => new THREE.MeshStandardMaterial({ color, roughness });
  const jeans = new THREE.MeshStandardMaterial({ color: look.jeans, roughness: 0.95, bumpMap: noiseTex(128, 70, 13), bumpScale: 0.8 });
  const shoe = mat(look.shoes, 0.7), sole = mat(look.soles, 0.9), lace = mat(look.laces);
  for (const s of [-1, 1]) {
    const foot = new THREE.Group(); foot.position.set(s * 0.11, 0, 0.0); foot.rotation.y = s * -0.12; g.add(foot);
    const add = (geo, m, p, r) => { const o = new THREE.Mesh(geo, m); o.position.set(...p); if (r) o.rotation.set(...r); o.castShadow = false; o.receiveShadow = true; foot.add(o); return o; };
    add(new RoundedBoxGeometry(0.105, 0.03, 0.29, 2, 0.012), sole, [0, 0.015, -0.1]);
    add(new RoundedBoxGeometry(0.1, 0.075, 0.26, 3, 0.035), shoe, [0, 0.06, -0.1]);
    add(new RoundedBoxGeometry(0.06, 0.012, 0.11, 2, 0.005), lace, [0, 0.1, -0.13], [0.2, 0, 0]);
    add(new THREE.CylinderGeometry(0.075, 0.062, 0.78, 14), jeans, [0, 0.5, 0.03], [0.08, 0, 0]); // the leg, from the knee down, leaning back to the hip
    add(new THREE.CylinderGeometry(0.068, 0.068, 0.05, 14), jeans, [0, 0.11, -0.005]); // the hem
  }
  const _f = new THREE.Vector3();
  g.follow = (camera) => {
    _f.set(0, 0, -1).applyQuaternion(camera.quaternion); _f.y = 0;
    const yaw = _f.lengthSq() > 1e-6 ? Math.atan2(-_f.x, -_f.z) : g.rotation.y;
    g.rotation.y = yaw;
    // stand a step behind the eye, so the shoes show a little ahead of it
    g.position.set(camera.position.x + Math.sin(yaw) * 0.06, 0, camera.position.z + Math.cos(yaw) * 0.06);
    g.visible = camera.position.y > 1.25;
  };
  return g;
}
