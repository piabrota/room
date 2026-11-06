import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { tapes, hotspots, theme, people, outside, cv, contact, emailText, closedSource, body as bodyLook, grid } from './config.js';
import { chartTexture } from './grid.js';
import { buildOutside } from './outside.js';
import { buildSea, buildLoop, buildRecords } from './props.js';
import { woodGrain, planks, plaster } from './textures.js';
import { fontsReady, frameArt, eyeArt, photoArt, spineArt, noteArt, quoteArt, noiseTex, tapeSpineArt, tapeTopArt, plasticArt, keyboardArt, vcrFrontArt, paperArt, folderArt } from './art.js';

// Photographed wood (Poly Haven, CC0; CREDITS.md): colour, normal and roughness.
const loader = new THREE.TextureLoader();
function pbr(name, repeat = [1, 1], rot = 0) {
  const map = (k, srgb) => { const t = loader.load(`/textures/pbr/${name}_${k}.jpg`); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); t.rotation = rot; t.anisotropy = 8; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };
  return { map: map('diff', true), normalMap: map('nor'), roughnessMap: map('rough') };
}

// Loads your GLB if it exists, otherwise builds the placeholder room
// from config. Either way it returns the same handles, so the rest of
// the app doesn't care where the geometry came from.
export async function loadRoom(scene, url, onProgress = () => {}) {
  let root, animated = [];
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
    ({ root, animated } = placeholderRoom());
  }
  onProgress(1);
  scene.add(root);

  const find = (n) => root.getObjectByName(n);
  const v = new THREE.Vector3();
  const lamp = new THREE.PointLight(0xffc98a, 5, 5, 1.7);
  lamp.position.copy(find('lamp_bulb')?.getWorldPosition(v) ?? find('lamp')?.getWorldPosition(v) ?? v.set(-0.55, 1.25, -1.6));
  lamp.castShadow = true; lamp.shadow.mapSize.set(1024, 1024); lamp.shadow.bias = -0.002; lamp.shadow.radius = 4;
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
  sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); sun.shadow.bias = -0.001;
  Object.assign(sun.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 0.5, far: 14 });
  scene.add(sun, sun.target);
  const NIGHT = { sky: [0x55628a, 0x1a1410, 0.8], moon: 0.55, sun: 0, neon: 1.2, lamp: 1, env: scene.environmentIntensity ?? 0.18, bg: scene.background?.clone(), fog: scene.fog?.color.clone() };
  const DAY = { sky: [0xdbe8f7, 0x8a6e52, 3.4], moon: 0, sun: 5, neon: 0.5, lamp: 0.35, env: 0.55, bg: new THREE.Color('#a9c3dc'), fog: new THREE.Color('#9fb3c6') };
  const dust = buildDust(); scene.add(dust);
  let day = false;
  function setDay(on) {
    dust.material.uniforms.bright.value = on ? 1 : 0.18; // by day the sun lights it; at night only the moon
    day = on; const m = on ? DAY : NIGHT;
    sky.color.set(m.sky[0]); sky.groundColor.set(m.sky[1]); sky.intensity = m.sky[2];
    moon.intensity = m.moon; sun.intensity = m.sun; neon.intensity = m.neon;
    // a lamp in daylight adds little; at full power, 0.35 m from the fax's page, it burns it white
    lamp.userData.full = lampFull * m.lamp; if (lamp.intensity) lamp.intensity = lamp.userData.full;
    scene.environmentIntensity = m.env;
    if (m.bg) scene.background = m.bg; if (m.fog && scene.fog) scene.fog.color.copy(m.fog);
    root.userData.outside?.setDay?.(on);
  }

  return {
    root, find, lamp, tvLight, screen, vcr: find('vcr'),
    get day() { return day; }, setDay,
    setRain(on) { const r = root.getObjectByName('rain_glass'); if (r) r.visible = on; },
    update(t) { for (const a of animated) a(t); if (!still) dust.material.uniforms.time.value = t; },
  };
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
// The window: wide, in the middle of the back wall, above the desk.
const WIN = { x: 0.2, y: 2.2, w: 2.8, h: 1.4 };

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
    const key = color + JSON.stringify(opts ?? {});
    if (!statics.has(key)) statics.set(key, { mat: std(color, opts), geos: [] });
    statics.get(key).geos.push(geo);
  };
  const box = (size, pos, color, o) => part(new THREE.BoxGeometry(...size), pos, color, o);
  const rbox = (size, pos, color, o) => part(new RoundedBoxGeometry(...size, 2, Math.min(...size) * 0.25), pos, color, o);
  const mesh = (name, geo, mat, pos, parent = g) => {
    const m = new THREE.Mesh(geo, mat); m.name = name; m.position.set(...pos);
    m.castShadow = m.receiveShadow = true; parent.add(m); return m;
  };
  const named = (name) => { const grp = new THREE.Group(); grp.name = name; g.add(grp); return grp; };
  const art = (kind) => hotspots.filter((h) => h.art?.kind === kind);

  // ── shell: floor, two walls, skirting, a rug ──
  const floor = mesh('floor', new THREE.PlaneGeometry(7, 7), new THREE.MeshStandardMaterial({ color: '#b9a48e', ...pbr('herringbone_parquet', [3.5, 3.5]), roughness: 1, normalScale: new THREE.Vector2(0.8, 0.8) }), [0, 0, 0.5]);
  floor.rotation.x = -Math.PI / 2; floor.castShadow = false;
  const wall = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.95, bumpMap: plaster(), bumpScale: 1.5 });
  const wallMat = wall('#2f3442');
  // the back wall, with a wide opening for the window in the middle (x -1.2..1.6, y 1.5..2.9)
  const W0 = WIN.x - WIN.w / 2, W1 = WIN.x + WIN.w / 2, H0 = WIN.y - WIN.h / 2, H1 = WIN.y + WIN.h / 2;
  for (const [w, h, x, y] of [[W0 + 3, 3.2, (W0 - 3) / 2, 1.6], [4.0 - W1, 3.2, (W1 + 4.0) / 2, 1.6], [WIN.w, H0, WIN.x, H0 / 2], [WIN.w, 3.2 - H1, WIN.x, (H1 + 3.2) / 2]]) {
    mesh('wall_back', new THREE.PlaneGeometry(w, h), wallMat, [x, y, -2.0]); // it casts: the day's sun comes in by the window only
  }
  const left = mesh('wall_left', new THREE.PlaneGeometry(7, 3.2), wall('#2a2f3c'), [-3.0, 1.6, 0.5]);
  left.rotation.y = Math.PI / 2; left.castShadow = false;
  const right = mesh('wall_right', new THREE.PlaneGeometry(7, 3.2), wall('#2a2f3c'), [3.4, 1.6, 0.5]);
  right.rotation.y = -Math.PI / 2; right.castShadow = false;
  const ceiling = mesh('ceiling', new THREE.PlaneGeometry(7, 7), std('#1d2029', { roughness: 1 }), [0.2, 3.1, 0.5]);
  ceiling.rotation.x = Math.PI / 2; ceiling.castShadow = false;
  const front = mesh('wall_front', new THREE.PlaneGeometry(7, 3.2), wall('#2c303d'), [0.2, 1.6, 3.8]);
  front.rotation.y = Math.PI; front.castShadow = false;
  box([7, 0.1, 0.03], [0.2, 0.05, 3.785], '#1c1f27');
  box([7, 0.1, 0.03], [0.5, 0.05, -1.985], '#1c1f27');
  box([0.03, 0.1, 7], [3.385, 0.05, 0.5], '#1c1f27');
  box([0.03, 0.1, 7], [-2.985, 0.05, 0.5], '#1c1f27');
  rbox([2.4, 0.015, 1.7], [0, 0.008, -0.55], '#6e1a14', { opts: { roughness: 1 } });
  rbox([2.1, 0.017, 1.4], [0, 0.009, -0.55], '#3e1411', { opts: { roughness: 1 } });

  // ── desk: walnut, under the window ──
  const deskY = 0.78, deskZ = -1.45;
  const walnut = new THREE.MeshStandardMaterial({ color: '#c9a888', ...pbr('american_walnut_veneer', [1.6, 0.6]), roughness: 1, normalScale: new THREE.Vector2(0.6, 0.6) });
  mesh('', new RoundedBoxGeometry(2.3, 0.05, 0.95, 2, 0.012), walnut, [0.05, deskY, deskZ]);
  for (const x of [-1.0, 1.1]) for (const z of [-1.82, -1.05]) mesh('', new THREE.BoxGeometry(0.05, deskY, 0.05), walnut, [x, deskY / 2, z]);
  mesh('', new THREE.BoxGeometry(2.15, 0.1, 0.03), walnut, [0.05, deskY - 0.07, -1.88]); // the apron at the back
  const top = deskY + 0.025;

  // the computer: a beige CRT monitor on a stand, the VCR in front of it, a keyboard
  const beige = (seed, color) => new THREE.MeshStandardMaterial({ map: plasticArt(color, seed), bumpMap: noiseTex(256, 30, seed), bumpScale: 0.4, roughness: 0.62 });
  const plastic = beige(3, '#d6ccb8');
  mesh('', new RoundedBoxGeometry(0.42, 0.06, 0.34, 2, 0.015), plastic, [0.05, top + 0.03, -1.66]);
  mesh('', new RoundedBoxGeometry(0.66, 0.54, 0.34, 3, 0.03), plastic, [0.05, top + 0.06 + 0.27, -1.55]);
  mesh('', new RoundedBoxGeometry(0.5, 0.42, 0.24, 3, 0.06), plastic, [0.05, top + 0.06 + 0.27, -1.8]); // the tube's back
  const bezel = beige(8, '#cbbfa8');
  mesh('', new RoundedBoxGeometry(0.6, 0.47, 0.02, 2, 0.008), bezel, [0.05, top + 0.35, -1.375]);
  mesh('', new THREE.BoxGeometry(0.56, 0.43, 0.01), std('#141416', { roughness: 0.3 }), [0.05, top + 0.35, -1.368]);
  const screen = mesh('screen', new THREE.PlaneGeometry(0.52, 0.39), new THREE.MeshBasicMaterial({ color: 0x111111 }), [0.05, top + 0.35, -1.36]);
  screen.castShadow = false;
  mesh('', new THREE.SphereGeometry(0.006, 8, 6), new THREE.MeshBasicMaterial({ color: '#5dff9a', toneMapped: false }), [0.3, top + 0.09, -1.37]).castShadow = false; // power LED
  const vcr = mesh('vcr', new RoundedBoxGeometry(0.58, 0.09, 0.32, 2, 0.012), std('#202023', { roughness: 0.4, metalness: 0.35 }), [0.05, top + 0.045, -1.17]);
  mesh('', new THREE.PlaneGeometry(0.56, 0.0875), new THREE.MeshStandardMaterial({ map: vcrFrontArt(), roughness: 0.5, metalness: 0.2 }), [0, 0, 0.1605], vcr).castShadow = false;
  const led = mesh('vcr_led', new THREE.PlaneGeometry(0.012, 0.006), new THREE.MeshBasicMaterial({ color: '#ff3b2f', toneMapped: false }), [0.25, 0.02, 0.162], vcr);
  led.castShadow = false;
  const kb = mesh('', new THREE.BoxGeometry(0.44, 0.025, 0.16), [plastic, plastic, new THREE.MeshStandardMaterial({ map: keyboardArt(), bumpMap: keyboardArt(), bumpScale: 0.6, roughness: 0.7 }), plastic, plastic, plastic], [-0.5, top + 0.0125, -1.14]);
  kb.rotation.set(0.06, 0.1, 0);

  // the tapes: a stack beside the VCR, spines out, labels by hand or in a retro face
  const shell = std('#151517', { roughness: 0.55, bumpMap: noiseTex(128, 50, 2), bumpScale: 0.3 });
  tapes.forEach((t, i) => {
    const spine = t.spine ?? { text: t.label };
    const faces = [shell, shell, new THREE.MeshStandardMaterial({ map: tapeTopArt(spine), roughness: 0.5 }), shell, new THREE.MeshStandardMaterial({ map: tapeSpineArt(spine), roughness: 0.6 }), shell];
    const tape = mesh(`tape_${t.id}`, new THREE.BoxGeometry(0.205, 0.028, 0.115), faces, [0.62, top + 0.014 + i * 0.0285, -1.22]);
    tape.rotation.y = Math.sin(i * 2.3) * 0.07;
  });

  // desk lamp: a base, an arm and a shade, hoverable as one
  const lamp = named('lamp'); lamp.position.set(-0.3, top, -1.75);
  const brass = std('#b08a4a', { metalness: 0.6, roughness: 0.35 });
  mesh('', new THREE.CylinderGeometry(0.09, 0.1, 0.03, 24), brass, [0, 0.015, 0], lamp);
  mesh('', new THREE.CylinderGeometry(0.012, 0.012, 0.42, 8), brass, [0, 0.23, 0], lamp);
  const shade = mesh('', new THREE.ConeGeometry(0.13, 0.16, 24, 1, true), std('#d9c3a0', { side: THREE.DoubleSide, emissive: '#ffb066', emissiveIntensity: 0.6 }), [0, 0.46, 0], lamp);
  shade.castShadow = false;
  const bulb = mesh('lamp_bulb', new THREE.SphereGeometry(0.03, 12, 8), new THREE.MeshBasicMaterial({ color: '#fff1d6', toneMapped: false }), [0, 0.42, 0], lamp);
  bulb.castShadow = false;

  // the fax: the address on the page it printed, and a LinkedIn button
  for (const h of art('fax')) {
    const fax = named(h.name); fax.position.set(-0.95, top, -1.7); fax.rotation.y = 0.25;
    const faxPlastic = beige(11, '#cfc8ba');
    mesh('', new RoundedBoxGeometry(0.32, 0.09, 0.26, 2, 0.02), faxPlastic, [0, 0.045, 0], fax);
    mesh('', new RoundedBoxGeometry(0.3, 0.05, 0.12, 2, 0.015), faxPlastic, [0, 0.1, -0.06], fax);
    mesh('', new THREE.PlaneGeometry(0.1, 0.03), new THREE.MeshBasicMaterial({ color: '#9fb88a' }), [-0.06, 0.0905, 0.07], fax).rotation.x = -Math.PI / 2; // the display
    for (let k = 0; k < 12; k++) mesh('', new THREE.BoxGeometry(0.018, 0.008, 0.016), std('#4a4740'), [0.04 + (k % 3) * 0.024, 0.093, 0.03 + Math.floor(k / 3) * 0.022], fax);
    const page = mesh('', new THREE.PlaneGeometry(0.21, 0.27), new THREE.MeshStandardMaterial({ map: paperArt({ lines: ['FAX', '', `to: you`, `from: ${contact.name}`, '', emailText, '', contact.linkedin.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')], stamp: 'RECEIVED' }), side: THREE.DoubleSide, roughness: 0.9 }), [0, 0.24, -0.1], fax);
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
    const note = mesh(h.name, new THREE.PlaneGeometry(0.16, 0.12), new THREE.MeshStandardMaterial({ map: noteArt({ glyph: h.art.glyph, lines: [h.label.replace(/^.*?: /, ''), h.hint], theme }), roughness: 0.9 }), [-0.98, top + 0.002, -1.12]);
    note.rotation.set(-Math.PI / 2, 0, 0.18); note.castShadow = false;
  }

  // ── under the desk: a file marked closed source, a letter half out of it ──
  for (const h of art('folder')) {
    const f = named(h.name); f.position.set(0.62, 0.006, -1.0); f.rotation.y = -0.35;
    mesh('', new THREE.BoxGeometry(0.32, 0.012, 0.24), [std('#c9a764'), std('#c9a764'), new THREE.MeshStandardMaterial({ map: folderArt({ title: closedSource.label }), roughness: 0.85 }), std('#c9a764'), std('#c9a764'), std('#c9a764')], [0, 0, 0], f);
    const letter = mesh('letter_closed-source', new THREE.PlaneGeometry(0.2, 0.28), new THREE.MeshStandardMaterial({ map: paperArt({ lines: closedSource.letter.lines, stamp: 'CONFIDENTIAL', size: 13 }), roughness: 0.9 }), [0.13, 0.008, 0.06], f);
    letter.rotation.set(-Math.PI / 2, 0, 0.5); letter.castShadow = false;
  }

  // ── the bots: two small robots on the desk, eyes that blink ──
  art('bot').forEach((h, i) => {
    const bot = named(h.name);
    bot.position.set(i === 0 ? 0.92 : -0.88, top, i === 0 ? -1.55 : -1.35);
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
  const RX = 2.5;
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

  // ── the window on Rio: wide, in the middle, with a frame, mullions and a sill ──
  const { x: wx, y: wy, w: ww, h: wh } = WIN;
  const glass = mesh('window', new THREE.PlaneGeometry(ww, wh), new THREE.MeshPhysicalMaterial({ color: '#9fb6d8', roughness: 0.35, metalness: 0.1, transparent: true, opacity: 0.07, depthWrite: false }), [wx, wy, -1.995]);
  glass.renderOrder = 3; glass.castShadow = false;
  const view = buildOutside(g, { center: new THREE.Vector3(wx, wy, -2), aim: outside?.aim, night: outside?.night, day: outside?.day });
  animated.push(view); g.userData.outside = view;
  const frameMat = '#d8d2c4';
  box([ww + 0.12, 0.07, 0.09], [wx, wy + wh / 2 + 0.03, -1.97], frameMat); box([ww + 0.12, 0.07, 0.09], [wx, wy - wh / 2 - 0.03, -1.97], frameMat);
  box([0.07, wh + 0.12, 0.09], [wx - ww / 2 - 0.03, wy, -1.97], frameMat); box([0.07, wh + 0.12, 0.09], [wx + ww / 2 + 0.03, wy, -1.97], frameMat);
  for (const k of [-1, 0, 1]) box([0.035, wh, 0.04], [wx + k * ww / 4 + (k === 0 ? 0 : 0), wy, -1.98], frameMat); // three mullions: four panes
  box([ww, 0.03, 0.035], [wx, wy + wh * 0.18, -1.98], frameMat); // the transom
  box([ww + 0.25, 0.04, 0.22], [wx, wy - wh / 2 - 0.08, -1.9], frameMat); // the sill

  // piabrota RADIO on the sill: a small transistor set, its dial lit while it plays
  const radio = named('radio'); radio.position.set(wx + ww / 2 - 0.25, wy - wh / 2 - 0.06 + 0.07, -1.88); radio.rotation.y = -0.25;
  mesh('', new RoundedBoxGeometry(0.24, 0.14, 0.08, 2, 0.02), std('#b8442f', { roughness: 0.45 }), [0, 0, 0], radio);
  const grille = mesh('', new THREE.CircleGeometry(0.045, 24), std('#2a2522', { roughness: 0.9, metalness: 0.2 }), [-0.055, 0, 0.041], radio); grille.castShadow = false;
  mesh('radio_dial', new THREE.PlaneGeometry(0.07, 0.035), new THREE.MeshStandardMaterial({ color: '#f1e3c0', emissive: '#ffb066', emissiveIntensity: 0 }), [0.06, 0.02, 0.041], radio).castShadow = false;
  mesh('', new THREE.CylinderGeometry(0.012, 0.012, 0.012, 16).rotateX(Math.PI / 2), std('#d8d2c4', { metalness: 0.5, roughness: 0.3 }), [0.06, -0.035, 0.045], radio);
  const aerial = mesh('', new THREE.CylinderGeometry(0.002, 0.002, 0.22, 6), std('#c9c9c9', { metalness: 0.8, roughness: 0.25 }), [0.08, 0.17, -0.01], radio); aerial.rotation.z = -0.35;

  // ── the board: people pinned as polaroids, under the eye ──
  const bx = RX, by = 1.45;
  rbox([0.95, 0.62, 0.03], [bx, by, -1.985], '#8a6a46', { opts: { roughness: 1 } });
  art('photo').forEach((h, i) => {
    const p = people.find((x) => `photo_${x.id}` === h.name) ?? { name: h.label.replace('@', ''), line: h.hint };
    const lanes = Object.values(theme.lanes);
    const ph = mesh(h.name, new THREE.PlaneGeometry(0.22, 0.258), new THREE.MeshStandardMaterial({ map: photoArt({ name: p.name, line: p.line, color: lanes[i % lanes.length], theme }), roughness: 0.6 }), [bx - 0.28 + i * 0.28, by + (i % 2 ? -0.04 : 0.05), -1.965]);
    ph.rotation.z = [0.06, -0.04, 0.08, -0.07][i % 4]; ph.castShadow = false;
    const pin = mesh('', new THREE.SphereGeometry(0.012, 8, 6), std(theme.accent), [0, 0.11, 0.008], ph); pin.castShadow = false;
  });

  // ── ▲ grid: a chart of the coast's triangle mesh on the right wall; its shot opens the map ──
  for (const h of hotspots.filter((x) => x.name === 'chart')) {
    const chart = named(h.name); chart.position.set(3.37, 1.62, 1.55); chart.rotation.y = -Math.PI / 2;
    mesh('', new THREE.BoxGeometry(1.12, 0.86, 0.025), std('#1b2733', { roughness: 0.6 }), [0, 0, -0.012], chart);
    mesh('', new THREE.PlaneGeometry(1.04, 0.78), (() => { const t = chartTexture(grid); return new THREE.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: '#ffffff', emissiveIntensity: 0.28, roughness: 0.85 }); })(), [0, 0, 0.002], chart).castShadow = false;
  }

  // ── the door, on the front wall: locked, for now ──
  for (const h of hotspots.filter((x) => x.name === 'door')) {
    const door = named(h.name); door.position.set(-1.55, 0, 3.78); door.rotation.y = Math.PI;
    const dw = 0.9, dh = 2.05;
    const doorWood = new THREE.MeshStandardMaterial({ color: '#a88a70', ...pbr('american_walnut_veneer', [0.5, 1.2], Math.PI / 2), roughness: 1 });
    mesh('', new THREE.BoxGeometry(dw, dh, 0.045), doorWood, [0, dh / 2, 0.02], door);
    for (const [px, py, pw, ph] of [[0, 1.45, 0.62, 0.7], [0, 0.55, 0.62, 0.8]]) mesh('', new THREE.BoxGeometry(pw, ph, 0.012), doorWood, [px, py, 0.048], door); // two raised panels
    for (const [s2, p2] of [[[0.08, dh + 0.08, 0.06], [-dw / 2 - 0.04, (dh + 0.08) / 2, 0.01]], [[0.08, dh + 0.08, 0.06], [dw / 2 + 0.04, (dh + 0.08) / 2, 0.01]], [[dw + 0.16, 0.08, 0.06], [0, dh + 0.04, 0.01]]]) mesh('', new THREE.BoxGeometry(...s2), std('#d8d2c4'), p2, door);
    const knob = std('#b08a4a', { metalness: 0.8, roughness: 0.3 });
    mesh('', new THREE.SphereGeometry(0.03, 16, 12), knob, [dw / 2 - 0.09, 1.0, 0.08], door);
    mesh('', new THREE.CylinderGeometry(0.035, 0.035, 0.01, 20).rotateX(Math.PI / 2), knob, [dw / 2 - 0.09, 1.0, 0.05], door);
    mesh('', new THREE.BoxGeometry(0.03, 0.06, 0.01), knob, [dw / 2 - 0.09, 1.12, 0.05], door); // the keyhole plate, locked
    const tag = paperArt({ lines: ['LOCKED', '', 'for now'], w: 128, h: 96, size: 14 });
    mesh('', new THREE.PlaneGeometry(0.16, 0.12), new THREE.MeshStandardMaterial({ map: tag, roughness: 0.9 }), [0, 1.62, 0.056], door).castShadow = false;
  }

  // ── the bookcase: the works with a DOI on the middle shelf ──
  const shelf = named('shelf');
  const sx = -2.15, sz = -1.82, sw = 1.0, sh = 1.9, sd = 0.32;
  const wood = '#4a3426';
  box([0.03, sh, sd], [sx - sw / 2, sh / 2, sz], wood); box([0.03, sh, sd], [sx + sw / 2, sh / 2, sz], wood);
  box([sw, sh, 0.02], [sx, sh / 2, sz - sd / 2 + 0.01], '#3a281d');
  const levels = [0.08, 0.55, 1.05, 1.5, sh];
  for (const y of levels) box([sw, 0.03, sd], [sx, y, sz], wood);
  // an invisible box so the whole case is hoverable
  const proxy = mesh('', new THREE.BoxGeometry(sw + 0.04, sh + 0.04, sd + 0.06), new THREE.MeshBasicMaterial({ visible: false }), [sx, sh / 2, sz + 0.03], shelf);
  proxy.userData.proxy = true; proxy.castShadow = proxy.receiveShadow = false;
  art('book').forEach((h, i) => {
    const hgt = 0.3 + ((i * 37) % 7) * 0.012, th = 0.05 + ((i * 13) % 3) * 0.008;
    const spine = spineArt({ title: h.label, color: h.art.color, theme });
    const cover = std(h.art.color, { roughness: 0.7 });
    const b = mesh(h.name, new THREE.BoxGeometry(th, hgt, 0.22), [cover, cover, cover, cover, new THREE.MeshStandardMaterial({ map: spine, roughness: 0.7 }), cover], [sx - 0.36 + i * 0.075, 1.065 + hgt / 2, sz + 0.03]);
    b.rotation.z = i === 5 ? -0.12 : 0;
    if (i === 5) b.position.x += 0.03;
  });
  // vinyl crate and boxes on the lower shelves, a plant on top
  for (let i = 0; i < 9; i++) box([0.006, 0.3, 0.3], [sx - 0.3 + i * 0.022, 0.1 + 0.15, sz + 0.01], i % 3 ? '#1b1b1b' : '#2b2b2b');
  rbox([0.3, 0.2, 0.25], [sx + 0.25, 0.1 + 0.1, sz], '#7a6448');
  rbox([0.25, 0.26, 0.24], [sx + 0.2, 0.57 + 0.13, sz], '#5c4a36');
  rbox([0.2, 0.15, 0.22], [sx - 0.25, 0.57 + 0.075, sz], '#2f3a4a');
  part(new THREE.CylinderGeometry(0.07, 0.055, 0.12, 16), [sx + 0.3, sh + 0.075, sz], '#b4583e');
  const leaf = new THREE.SphereGeometry(0.09, 10, 8).scale(1, 1.4, 0.4);
  for (let i = 0; i < 6; i++) part(leaf, [sx + 0.3 + Math.cos(i) * 0.06, sh + 0.22 + (i % 3) * 0.04, sz + Math.sin(i) * 0.06], '#2f6b3a', { rot: [0.3 * Math.sin(i * 2), i, 0.4 * Math.cos(i)], opts: LEAF });

  // ── the fabric wall: one framed print per project ──
  art('frame').forEach((h, i) => {
    const col = i % 4, row = Math.floor(i / 4);
    const z = 0.66 - col * 0.62, y = 1.98 - row * 0.66;
    const frame = named(h.name); frame.position.set(-2.985, y, z); frame.rotation.y = Math.PI / 2;
    mesh('', new THREE.BoxGeometry(0.46, 0.56, 0.025), std('#121318', { roughness: 0.4 }), [0, 0, 0.012], frame);
    const pic = mesh('', new THREE.PlaneGeometry(0.42, 0.52), new THREE.MeshStandardMaterial({ map: frameArt({ glyph: h.art.glyph, title: h.label, line: h.hint, color: h.art.color, theme }), roughness: 0.5 }), [0, 0, 0.026], frame);
    pic.castShadow = false;
  });

  // ── a chair and a plant in the corner ──
  rbox([0.5, 0.06, 0.48], [0.1, 0.48, -0.75], '#22252d');
  rbox([0.48, 0.5, 0.05], [0.1, 0.78, -0.5], '#22252d', { rot: [-0.12, 0, 0] });
  part(new THREE.CylinderGeometry(0.03, 0.03, 0.45, 8), [0.1, 0.24, -0.75], '#3a3d45');
  part(new THREE.CylinderGeometry(0.25, 0.25, 0.03, 16), [0.1, 0.02, -0.75], '#3a3d45');
  part(new THREE.CylinderGeometry(0.16, 0.12, 0.34, 16), [-2.6, 0.17, 0.9], '#c9c2b4');
  for (let i = 0; i < 9; i++) part(new THREE.ConeGeometry(0.06, 0.7, 6), [-2.6 + Math.cos(i * 2.4) * 0.07, 0.62, 0.9 + Math.sin(i * 2.4) * 0.07], '#2f6b3a', { rot: [Math.sin(i * 2.4) * 0.35, 0, -Math.cos(i * 2.4) * 0.35], opts: LEAF });

  // ── the other walls: marola-dev's sea, ouroboric-dev's loop, the slipbox ──
  animated.push(buildSea(g, mesh, std, part), buildLoop(g, mesh, std), buildRecords(g, mesh, std, part));

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
  const rainGlass = mesh('', new THREE.PlaneGeometry(WIN.w, WIN.h), new THREE.ShaderMaterial({
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
  }), [WIN.x, WIN.y, -1.99]);
  rainGlass.castShadow = rainGlass.receiveShadow = false; rainGlass.renderOrder = 4; rainGlass.visible = false; rainGlass.name = 'rain_glass';
  animated.push((t) => { if (rainGlass.visible && !still) rainGlass.material.uniforms.uTime.value = t; });

  // merge the static parts: one mesh per material
  for (const { mat, geos } of statics.values()) {
    const m = new THREE.Mesh(mergeGeometries(geos.map((x) => x.index ? x.toNonIndexed() : x)), mat);
    m.castShadow = m.receiveShadow = true; m.name = 'static'; g.add(m);
  }
  return { root: g, animated };
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
