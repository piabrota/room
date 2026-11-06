import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { tapes, hotspots, theme, people, outside } from './config.js';
import { buildOutside } from './outside.js';
import { buildSea, buildLoop, buildRecords } from './props.js';
import { woodGrain, planks, plaster } from './textures.js';
import { fontsReady, frameArt, eyeArt, photoArt, spineArt, noteArt } from './art.js';

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
  scene.add(new THREE.HemisphereLight(0x55628a, 0x1a1410, 0.8));

  return {
    root, find, lamp, tvLight, screen, vcr: find('vcr'),
    update(t) { for (const a of animated) a(t); },
  };
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
  const floor = mesh('floor', new THREE.PlaneGeometry(7, 7), new THREE.MeshStandardMaterial({ color: '#4a3424', map: planks(), roughness: 0.82 }), [0, 0, 0.5]);
  floor.rotation.x = -Math.PI / 2; floor.castShadow = false;
  const wall = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.95, bumpMap: plaster(), bumpScale: 1.5 });
  const wallMat = wall('#2f3442');
  // the back wall, with an opening for the window (x 1.75..2.95, y 1.22..2.18)
  for (const [w, h, x, y] of [[4.75, 3.2, -0.625, 1.6], [1.05, 3.2, 3.475, 1.6], [1.2, 1.22, 2.35, 0.61], [1.2, 1.02, 2.35, 2.69]]) {
    const piece = mesh('wall_back', new THREE.PlaneGeometry(w, h), wallMat, [x, y, -2.0]); piece.castShadow = false;
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

  // ── desk ──
  const deskY = 0.78, deskZ = -1.5;
  mesh('', new RoundedBoxGeometry(2.3, 0.05, 0.85, 2, 0.012), new THREE.MeshStandardMaterial({ color: '#8a6040', map: woodGrain(), roughness: 0.55 }), [0.05, deskY, deskZ]);
  for (const x of [-1.0, 1.1]) for (const z of [-1.85, -1.15]) box([0.05, deskY, 0.05], [x, deskY / 2, z], '#3e2a1c');
  const top = deskY + 0.025;

  // TV on a small stand, VCR in front of it, tapes beside
  box([0.5, 0.06, 0.38], [0.05, top + 0.03, -1.65], '#1a1a1d');
  rbox([0.72, 0.56, 0.52], [0.05, top + 0.06 + 0.28, -1.65], '#1d1d21', { opts: { roughness: 0.4 } });
  box([0.6, 0.46, 0.02], [0.05, top + 0.34, -1.385], '#0c0c0e');
  const screen = mesh('screen', new THREE.PlaneGeometry(0.54, 0.4), new THREE.MeshBasicMaterial({ color: 0x111111 }), [0.05, top + 0.34, -1.373]);
  screen.castShadow = false;
  const vcr = mesh('vcr', new RoundedBoxGeometry(0.58, 0.09, 0.36, 2, 0.015), std('#26262a', { roughness: 0.35, metalness: 0.3 }), [0.05, top + 0.045, -1.15]);
  const led = mesh('vcr_led', new THREE.PlaneGeometry(0.03, 0.01), new THREE.MeshBasicMaterial({ color: '#ff3b2f', toneMapped: false }), [0.22, 0.01, 0.181], vcr);
  led.castShadow = false;
  box([0.26, 0.012, 0.005], [0.0, top + 0.06, -0.97], '#0a0a0a');
  tapes.forEach((t, i) => {
    const tape = mesh(`tape_${t.id}`, new RoundedBoxGeometry(0.19, 0.028, 0.11, 2, 0.006), std(t.color, { roughness: 0.5 }), [0.62, top + 0.015 + i * 0.03, -1.2]);
    tape.rotation.y = (i % 2 ? 1 : -1) * 0.06 * (i + 1);
    const label = mesh('', new THREE.PlaneGeometry(0.12, 0.018), std('#efe9dc'), [0, 0, 0.0555], tape); label.castShadow = false;
  });

  // desk lamp: a base, an arm and a shade, hoverable as one
  const lamp = named('lamp'); lamp.position.set(-0.55, top, -1.65);
  const brass = std('#b08a4a', { metalness: 0.6, roughness: 0.35 });
  mesh('', new THREE.CylinderGeometry(0.09, 0.1, 0.03, 24), brass, [0, 0.015, 0], lamp);
  mesh('', new THREE.CylinderGeometry(0.012, 0.012, 0.42, 8), brass, [0, 0.23, 0], lamp);
  const shade = mesh('', new THREE.ConeGeometry(0.13, 0.16, 24, 1, true), std('#d9c3a0', { side: THREE.DoubleSide, emissive: '#ffb066', emissiveIntensity: 0.6 }), [0, 0.46, 0], lamp);
  shade.castShadow = false;
  const bulb = mesh('lamp_bulb', new THREE.SphereGeometry(0.03, 12, 8), new THREE.MeshBasicMaterial({ color: '#fff1d6', toneMapped: false }), [0, 0.42, 0], lamp);
  bulb.castShadow = false;

  // the note: the inspiration
  for (const h of art('note')) {
    const note = mesh(h.name, new THREE.PlaneGeometry(0.16, 0.12), new THREE.MeshStandardMaterial({ map: noteArt({ glyph: h.art.glyph, lines: [h.label.replace(/^.*?: /, ''), h.hint], theme }), roughness: 0.9 }), [-0.35, top + 0.002, -1.2]);
    note.rotation.set(-Math.PI / 2, 0, 0.18); note.castShadow = false;
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

  // ── the sign: the piabrota eye, glowing above the TV ──
  for (const h of hotspots.filter((x) => x.name === 'sign')) {
    const sign = named(h.name); sign.position.set(0.05, 2.08, -1.97);
    box([0.62, 0.62, 0.02], [0.05, 2.08, -1.985], '#111');
    const face = mesh('', new THREE.PlaneGeometry(0.56, 0.56), new THREE.MeshStandardMaterial({ map: eyeArt(theme), emissiveMap: eyeArt(theme), emissive: '#ffffff', emissiveIntensity: 1.6, toneMapped: false }), [0, 0, 0.002], sign);
    face.castShadow = false;
    animated.push((t) => { face.material.emissiveIntensity = 1.5 + Math.sin(t * 2.1) * 0.05 + (Math.sin(t * 13.7) > 0.995 ? -0.6 : 0); });
  }

  // ── the window on Rio, with a frame and a sill ──
  const wx = 2.35, wy = 1.7;
  // the glass: a faint reflection, and Rio behind it in depth (outside.js)
  const glass = mesh('window', new THREE.PlaneGeometry(1.2, 0.96), new THREE.MeshPhysicalMaterial({ color: '#9fb6d8', roughness: 0.35, metalness: 0.1, transparent: true, opacity: 0.08, depthWrite: false }), [wx, wy, -1.995]);
  glass.renderOrder = 3;
  animated.push(buildOutside(g, { center: new THREE.Vector3(wx, wy, -2), photo: outside?.photo }));
  glass.castShadow = false;
  for (const [s, p] of [[[1.32, 0.06, 0.08], [wx, wy + 0.51, -1.97]], [[1.32, 0.06, 0.08], [wx, wy - 0.51, -1.97]], [[0.06, 1.08, 0.08], [wx - 0.63, wy, -1.97]], [[0.06, 1.08, 0.08], [wx + 0.63, wy, -1.97]], [[0.03, 0.96, 0.03], [wx, wy, -1.98]], [[1.2, 0.03, 0.03], [wx, wy + 0.1, -1.98]]]) box(s, p, '#d8d2c4');
  box([1.4, 0.04, 0.2], [wx, wy - 0.56, -1.92], '#d8d2c4');

  // piabrota RADIO on the sill: a small transistor set, its dial lit while it plays
  const radio = named('radio'); radio.position.set(wx + 0.42, wy - 0.54 + 0.07, -1.9); radio.rotation.y = -0.25;
  mesh('', new RoundedBoxGeometry(0.24, 0.14, 0.08, 2, 0.02), std('#b8442f', { roughness: 0.45 }), [0, 0, 0], radio);
  const grille = mesh('', new THREE.CircleGeometry(0.045, 24), std('#2a2522', { roughness: 0.9, metalness: 0.2 }), [-0.055, 0, 0.041], radio); grille.castShadow = false;
  mesh('radio_dial', new THREE.PlaneGeometry(0.07, 0.035), new THREE.MeshStandardMaterial({ color: '#f1e3c0', emissive: '#ffb066', emissiveIntensity: 0 }), [0.06, 0.02, 0.041], radio).castShadow = false;
  mesh('', new THREE.CylinderGeometry(0.012, 0.012, 0.012, 16).rotateX(Math.PI / 2), std('#d8d2c4', { metalness: 0.5, roughness: 0.3 }), [0.06, -0.035, 0.045], radio);
  const aerial = mesh('', new THREE.CylinderGeometry(0.002, 0.002, 0.22, 6), std('#c9c9c9', { metalness: 0.8, roughness: 0.25 }), [0.08, 0.17, -0.01], radio); aerial.rotation.z = -0.35;

  // ── the board: people pinned as polaroids ──
  const bx = 1.15, by = 1.62;
  rbox([0.95, 0.62, 0.03], [bx, by, -1.985], '#8a6a46', { opts: { roughness: 1 } });
  art('photo').forEach((h, i) => {
    const p = people.find((x) => `photo_${x.id}` === h.name) ?? { name: h.label.replace('@', ''), line: h.hint };
    const lanes = Object.values(theme.lanes);
    const ph = mesh(h.name, new THREE.PlaneGeometry(0.22, 0.258), new THREE.MeshStandardMaterial({ map: photoArt({ name: p.name, line: p.line, color: lanes[i % lanes.length], theme }), roughness: 0.6 }), [bx - 0.28 + i * 0.28, by + (i % 2 ? -0.04 : 0.05), -1.965]);
    ph.rotation.z = [0.06, -0.04, 0.08, -0.07][i % 4]; ph.castShadow = false;
    const pin = mesh('', new THREE.SphereGeometry(0.012, 8, 6), std(theme.accent), [0, 0.11, 0.008], ph); pin.castShadow = false;
  });

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
  for (let i = 0; i < 6; i++) part(leaf, [sx + 0.3 + Math.cos(i) * 0.06, sh + 0.22 + (i % 3) * 0.04, sz + Math.sin(i) * 0.06], '#2f6b3a', { rot: [0.3 * Math.sin(i * 2), i, 0.4 * Math.cos(i)] });

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
  for (let i = 0; i < 9; i++) part(new THREE.ConeGeometry(0.06, 0.7, 6), [-2.6 + Math.cos(i * 2.4) * 0.07, 0.62, 0.9 + Math.sin(i * 2.4) * 0.07], '#2f6b3a', { rot: [Math.sin(i * 2.4) * 0.35, 0, -Math.cos(i * 2.4) * 0.35] });

  // ── the other walls: marola-dev's sea, ouroboric-dev's loop, h0ffmann's records ──
  animated.push(buildSea(g, mesh, std, part), buildLoop(g, mesh, std), buildRecords(g, mesh, std, part));

  // merge the static parts: one mesh per material
  for (const { mat, geos } of statics.values()) {
    const m = new THREE.Mesh(mergeGeometries(geos.map((x) => x.index ? x.toNonIndexed() : x)), mat);
    m.castShadow = m.receiveShadow = true; m.name = 'static'; g.add(m);
  }
  return { root: g, animated };
}
