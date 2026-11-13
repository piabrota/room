import * as THREE from 'three';
import { asset } from './files.js';
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
// where it is. Nothing is fetched before `start()`; `ready` resolves when every file has arrived or failed.
//
// `fit` gives the size: { w, h, d } in metres, any of them. One number scales the model evenly
// to it; with `stretch`, each number given scales its own axis (a cabinet made a little shorter).
// `anchor` says which point of the model sits on the holder: 'floor' (the middle of its foot,
// the default), 'back' (the middle of its back, for a picture on a wall), 'top' (the middle of
// its top, for a lamp that hangs), 'centre', or 'origin' (the model's own origin, as its author set it).
export function createFurniture(models, { lite = false, small = lite, anisotropy = 8, onChange = () => {} } = {}) {
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const pending = [];
  // No file is asked for before `start()`: the room shows first, with its stand-ins, and the
  // furniture comes after, four files at a time, so the room's own code and pictures never wait
  // behind a chair on a slow line. They come in the order the visitor would miss them: what the
  // camera looks at before what is behind it, the near before the far (`start({ camera })`), and
  // each model's shaders are made ready before it is shown, so a piece that arrives never makes
  // the room stutter (`start({ prepare })`: `renderer.compileAsync`, src/app.js).
  const queue = [], holders = new Map(); // url -> the holders it will stand in
  let started = false, free = 4, prepare = null;
  const pump = () => {
    while (started && free > 0 && queue.length) {
      const job = queue.shift(); free--;
      loader.loadAsync(job.url).then(job.done, job.fail).finally(() => { free++; pump(); });
    }
  };
  const fetchModel = (url) => new Promise((done, fail) => { queue.push({ url, done, fail }); pump(); });
  const ready = (model) => (prepare ? Promise.race([Promise.resolve().then(() => prepare(model)).catch(() => {}), new Promise((done) => setTimeout(done, 4000))]) : Promise.resolve());
  const cache = new Map(); // one download for a file that stands in two places
  const base = models?.base ?? '/models/';
  const fileOf = (key) => {
    const def = models?.files?.[key]; if (!def) return null;
    const { file, phone = true } = typeof def === 'string' ? { file: def } : def;
    if (lite && !phone) return null; // a prop the phone's look leaves out
    return asset(`${base}${file}${small ? '.lite' : ''}.glb`); // the small file on a phone, a small screen or a slow line (src/quality.js)
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
    const at = { floor: [centre.x, box.min.y, centre.z], back: [centre.x, centre.y, box.min.z], top: [centre.x, box.max.y, centre.z], centre: [centre.x, centre.y, centre.z], origin: [0, 0, 0] }[anchor];
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
    // A holder at `at`, turned by `rot` (radians about y, or [x, y, z] for a thing that leans), named for hover when
    // `name` is given. `standin(group)` may add the boxes that stand for it until the file comes.
    place(key, parent, { at = [0, 0, 0], rot = 0, name = '', standin, onLoad, ...how } = {}) {
      const holder = new THREE.Group(); holder.name = name;
      holder.position.set(...at);
      if (Array.isArray(rot)) { holder.rotation.order = 'YXZ'; holder.rotation.set(...rot); } else holder.rotation.y = rot; // [lean back, turn, lean aside]: it leans in its own frame, then turns
      parent.add(holder);
      const placeholder = new THREE.Group(); placeholder.name = 'standin'; holder.add(placeholder);
      standin?.(placeholder);
      const url = fileOf(key);
      if (url) {
        if (!cache.has(url)) cache.set(url, fetchModel(url));
        if (!holders.has(url)) holders.set(url, []);
        holders.get(url).push(holder);
        pending.push(cache.get(url).then(async (gltf) => {
          const model = settle(gltf.scene.clone(true), how); // a copy: a file can stand in two places
          model.name = key;
          await ready(model); // its shaders, compiled while the stand-in still stands
          holder.remove(placeholder);
          placeholder.traverse((o) => { if (o.isMesh) o.geometry.dispose(); });
          holder.add(model); onLoad?.(model, holder); onChange();
        }).catch(() => { /* the stand-in stays (invariant 8) */ }));
      }
      return holder;
    },
    // the glTF of a file that is not furniture (the aquarium's fish), loaded like the rest after
    // `start()`: a promise of the glTF, or of null when there is no file or it failed
    load(key) {
      const url = fileOf(key); if (!url) return Promise.resolve(null);
      if (!cache.has(url)) cache.set(url, fetchModel(url));
      const p = cache.get(url).catch(() => null); pending.push(p); return p;
    },
    // `camera`: the files are asked for in the order of what it sees; `prepare(model)`: a promise
    // that the model can be drawn without a stall. Both are optional.
    start({ camera = null, prepare: prep = null } = {}) {
      if (started) return;
      prepare = prep;
      if (camera) {
        camera.updateMatrixWorld(); camera.updateProjectionMatrix?.();
        const frustum = new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
        const eye = camera.getWorldPosition(new THREE.Vector3()), at = new THREE.Vector3();
        const rank = (url) => Math.min(...(holders.get(url) ?? []).map((h) => { h.getWorldPosition(at); return (frustum.containsPoint(at) ? 0 : 100) + at.distanceTo(eye); }), 99); // a file with no holder (the fish): after what is in view
        for (const job of queue) job.rank = rank(job.url);
        queue.sort((a, b) => a.rank - b.rank);
      }
      started = true; pump();
    },
    get ready() { return Promise.all(pending); },
    get count() { return pending.length; },
  };
}
