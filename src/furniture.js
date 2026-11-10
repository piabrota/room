import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

// The furniture and the props that are files: photographed models (Poly Haven, CC0; CREDITS.md),
// packed by `just models` into public/models/, one file for the laptop's look and a smaller one
// for the phone's. `config.models` says which file stands for which thing of the room; the room
// (src/room.js) says where each one stands and how big it is, in metres.
//
// A thing is a holder: an empty group at its place, with an optional stand-in of a few boxes.
// The room can open with the stand-ins and never needs a file (invariant 8); each model takes
// its stand-in's place when it arrives, and a file that is missing or broken leaves the stand-in
// where it is. `ready` resolves when every file has arrived or failed.
//
// `fit` gives the size: { w, h, d } in metres, any of them. One number scales the model evenly
// to it; with `stretch`, each number given scales its own axis (a cabinet made a little shorter).
// `anchor` says which point of the model sits on the holder: 'floor' (the middle of its foot,
// the default), 'back' (the middle of its back, for a picture on a wall), 'top' (the middle of
// its top, for a lamp that hangs) or 'centre'.
export function createFurniture(models, { lite = false, anisotropy = 8, onChange = () => {} } = {}) {
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const pending = [];
  const cache = new Map(); // one download for a file that stands in two places
  const base = models?.base ?? '/models/';
  const fileOf = (key) => {
    const def = models?.files?.[key]; if (!def) return null;
    const { file, phone = true } = typeof def === 'string' ? { file: def } : def;
    if (lite && !phone) return null; // a prop the phone's look leaves out
    return `${base}${file}${lite ? '.lite' : ''}.glb`;
  };
  const box = new THREE.Box3(), size = new THREE.Vector3(), centre = new THREE.Vector3();

  function settle(model, { fit = {}, stretch = false, anchor = 'floor', turn, shadow = true, tune } = {}) {
    if (turn) model.rotation.set(...turn); // the way the author laid it down, undone
    model.updateMatrixWorld(true);
    box.setFromObject(model); box.getSize(size);
    const dims = { w: size.x, h: size.y, d: size.z }, given = Object.keys(fit).filter((k) => fit[k]);
    const wrap = new THREE.Group(); wrap.add(model);
    if (stretch) wrap.scale.set(fit.w ? fit.w / dims.w : 1, fit.h ? fit.h / dims.h : 1, fit.d ? fit.d / dims.d : 1);
    else if (given.length) wrap.scale.setScalar(Math.min(...given.map((k) => fit[k] / dims[k])));
    box.getCenter(centre);
    const at = { floor: [centre.x, box.min.y, centre.z], back: [centre.x, centre.y, box.min.z], top: [centre.x, box.max.y, centre.z], centre: [centre.x, centre.y, centre.z] }[anchor];
    model.position.sub(new THREE.Vector3(...at));
    model.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = shadow; o.receiveShadow = true;
      for (const m of [o.material].flat()) {
        for (const k of ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap']) if (m[k]) m[k].anisotropy = anisotropy;
        if (m.transmission > 0) { m.transmission = 0; m.transparent = true; m.opacity = 0.16; m.depthWrite = false; m.roughness = 0.08; } // glass: a thin sheen, not a pass of its own
        else if (m.transparent && m.alphaTest === 0 && m.opacity === 1) { m.transparent = false; m.alphaTest = 0.5; } // leaves cut out, not blended
        tune?.(m, o);
      }
    });
    return wrap;
  }

  return {
    // A holder at `at`, turned by `rot` (radians about y, or [x, y, z]), named for hover when
    // `name` is given. `standin(group)` may add the boxes that stand for it until the file comes.
    place(key, parent, { at = [0, 0, 0], rot = 0, name = '', standin, onLoad, ...how } = {}) {
      const holder = new THREE.Group(); holder.name = name;
      holder.position.set(...at); if (Array.isArray(rot)) holder.rotation.set(...rot); else holder.rotation.y = rot;
      parent.add(holder);
      const placeholder = new THREE.Group(); placeholder.name = 'standin'; holder.add(placeholder);
      standin?.(placeholder);
      const url = fileOf(key);
      if (url) {
        if (!cache.has(url)) cache.set(url, loader.loadAsync(url));
        pending.push(cache.get(url).then((gltf) => {
          const model = settle(gltf.scene.clone(true), how); // a copy: a file can stand in two places
          model.name = key;
          holder.remove(placeholder);
          placeholder.traverse((o) => { if (o.isMesh) o.geometry.dispose(); });
          holder.add(model); onLoad?.(model, holder); onChange();
        }).catch(() => { /* the stand-in stays (invariant 8) */ }));
      }
      return holder;
    },
    get ready() { return Promise.all(pending); },
    get count() { return pending.length; },
  };
}
