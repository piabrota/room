import * as THREE from 'three';

// Smoothly moves the camera between named shots. Shots come from
// config.js and, if present, from cameras exported in your GLB whose
// names start with "shot_" (e.g. shot_desk -> "desk").
export function createCameraRig(camera, shots, gltfCameras = []) {
  const all = { ...shots };
  for (const c of gltfCameras) {
    if (!c.name.startsWith('shot_')) continue;
    const pos = c.getWorldPosition(new THREE.Vector3());
    const dir = c.getWorldDirection(new THREE.Vector3());
    all[c.name.slice(5)] = { position: pos.toArray(), target: pos.add(dir).toArray() };
  }

  const pos = new THREE.Vector3(), target = new THREE.Vector3();
  const from = { p: new THREE.Vector3(), t: new THREE.Vector3() };
  const to = { p: new THREE.Vector3(), t: new THREE.Vector3() };
  let progress = 1, duration = 1.3, current = null;
  const parallax = new THREE.Vector2(), parallaxGoal = new THREE.Vector2();
  const listeners = [];
  // Reduced motion: cut between shots and keep the camera still.
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  window.addEventListener('pointermove', (e) => {
    if (!still) parallaxGoal.set(e.clientX / innerWidth - 0.5, e.clientY / innerHeight - 0.5);
  });

  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

  return {
    names: Object.keys(all),
    get current() { return current; },
    onChange(fn) { listeners.push(fn); },
    go(name, instant = false) {
      const s = all[name]; if (!s) return;
      current = name;
      from.p.copy(pos); from.t.copy(target);
      to.p.fromArray(s.position); to.t.fromArray(s.target);
      instant = instant || still;
      progress = instant ? 1 : 0;
      if (instant) { pos.copy(to.p); target.copy(to.t); }
      listeners.forEach((fn) => fn(name));
    },
    update(dt) {
      if (progress < 1) {
        progress = Math.min(1, progress + dt / duration);
        const k = ease(progress);
        pos.lerpVectors(from.p, to.p, k);
        target.lerpVectors(from.t, to.t, k);
      }
      parallax.lerp(parallaxGoal, 1 - Math.exp(-dt * 4));
      camera.position.copy(pos);
      camera.position.x += parallax.x * 0.12;
      camera.position.y -= parallax.y * 0.08;
      camera.lookAt(target);
    },
  };
}
