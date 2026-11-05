import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { tapes } from './config.js';

// Loads your GLB if it exists, otherwise builds a placeholder room.
// Either way it returns the same handles, so the rest of the app
// doesn't care where the geometry came from.
export async function loadRoom(scene, url) {
  let root;
  try {
    const head = await fetch(url, { method: 'HEAD' });
    if (!head.ok || !(head.headers.get('content-type') || '').match(/gltf|octet|model/)) throw 0;
    const gltf = await new GLTFLoader().loadAsync(url);
    root = gltf.scene;
    root.userData.cameras = gltf.cameras;
    useBakedLighting(root);
  } catch {
    root = placeholderRoom();
  }
  scene.add(root);

  const find = (n) => root.getObjectByName(n);
  const lamp = new THREE.PointLight(0xffc98a, 6, 6, 1.6);
  lamp.position.copy(find('lamp')?.getWorldPosition(new THREE.Vector3()) ?? new THREE.Vector3(-0.6, 1.4, -0.6));
  lamp.position.y += 0.15;
  scene.add(lamp);
  const tvLight = new THREE.PointLight(0x88aaff, 0, 3, 2); // tinted by the playing tape
  tvLight.position.set(0, 1.2, -0.2);
  scene.add(tvLight);
  scene.add(new THREE.AmbientLight(0x404a66, 0.6));

  return { root, find, lamp, tvLight, screen: find('screen'), vcr: find('vcr') };
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

function placeholderRoom() {
  const g = new THREE.Group();
  const box = (name, size, pos, color, opts = {}) => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(...size),
      new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...opts }),
    );
    mesh.name = name; mesh.position.set(...pos);
    mesh.castShadow = mesh.receiveShadow = true;
    g.add(mesh); return mesh;
  };
  box('floor', [6, 0.1, 6], [0, -0.05, 0], 0x2a2420);
  box('wall_back', [6, 3, 0.1], [0, 1.5, -2.05], 0x3a3f4f);
  box('wall_left', [0.1, 3, 6], [-3, 1.5, 0], 0x343949);
  box('desk', [2.2, 0.06, 0.9], [0, 0.78, -0.9], 0x6b4a32);
  for (const x of [-1.0, 1.0]) box('desk_leg', [0.06, 0.78, 0.8], [x, 0.39, -0.9], 0x4e3524);
  box('tv', [0.7, 0.55, 0.5], [0, 1.1, -1.05], 0x1c1c1f);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.42), new THREE.MeshBasicMaterial({ color: 0x111111 }));
  screen.name = 'screen'; screen.position.set(0, 1.11, -0.795); g.add(screen);
  box('vcr', [0.6, 0.1, 0.4], [0, 0.86, -0.75], 0x2b2b2e);
  tapes.forEach((t, i) => {
    const tape = box(`tape_${t.id}`, [0.19, 0.03, 0.11], [0.75, 0.83 + i * 0.032, -0.75], t.color);
    tape.rotation.y = (i - 1) * 0.08;
  });
  box('lamp', [0.12, 0.4, 0.12], [-0.8, 1.01, -1.1], 0xd9c3a0, { emissive: 0x332211 });
  box('shelf', [0.5, 1.6, 1.2], [-2.6, 0.8, -1.2], 0x5a4030);
  box('poster', [0.9, 0.6, 0.02], [-1.6, 1.8, -1.99], 0xc94f3d);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.0), new THREE.MeshBasicMaterial({ color: 0x1b2a4a }));
  win.name = 'window'; win.position.set(1.6, 1.7, -1.99); g.add(win);
  return g;
}
