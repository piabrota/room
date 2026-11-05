import * as THREE from 'three';

// Moves the camera between named shots. Shots come from config.js and,
// if present, from cameras exported in your GLB whose names start with
// "shot_" (e.g. shot_desk -> "desk").
//
// Why it is smooth:
//  - position, orientation and field of view follow a quintic curve
//    (smootherstep), so speed and acceleration are zero at both ends;
//  - a new shot picked mid-move starts from the current velocity, not
//    from rest, so changing your mind never jerks the camera;
//  - long moves arc up and into the room instead of cutting through
//    the furniture, and their duration grows with distance and turn;
//  - orientation is a quaternion slerp, so the view turns along the
//    shortest arc instead of swinging through a lerped look-at point;
//  - mouse parallax and idle drift are small, damped offsets that fade
//    out while the camera moves.
export function createCameraRig(camera, shots, gltfCameras = [], { center = [0.3, 1.5, 0.8] } = {}) {
  const all = {};
  for (const [name, s] of Object.entries(shots)) all[name] = s;
  for (const c of gltfCameras) {
    if (!c.name.startsWith('shot_')) continue;
    const pos = c.getWorldPosition(new THREE.Vector3());
    const dir = c.getWorldDirection(new THREE.Vector3());
    all[c.name.slice(5)] = { position: pos.toArray(), target: pos.add(dir).toArray(), fov: c.fov };
  }
  const names = Object.keys(all);

  // Reduced motion: cut between shots and keep the camera still.
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const roomCenter = new THREE.Vector3(...center);

  // The base pose (without parallax), its velocities, and the move.
  const pos = new THREE.Vector3(), quat = new THREE.Quaternion();
  let fov = 45, portrait = false;
  const vel = new THREE.Vector3(), angVel = new THREE.Vector3(); let fovVel = 0;
  const move = {
    t: 1, T: 1,
    p0: new THREE.Vector3(), p1: new THREE.Vector3(), v0: new THREE.Vector3(), lift: new THREE.Vector3(),
    q0: new THREE.Quaternion(), q1: new THREE.Quaternion(), w0: new THREE.Vector3(),
    f0: 45, f1: 45, fv0: 0,
  };
  let current = null;
  const listeners = [];

  // smootherstep and the quintic that carries a start velocity
  const S = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  const G = (t) => t - 6 * t ** 3 + 8 * t ** 4 - 3 * t ** 5;
  const B = (t) => 16 * t * t * (1 - t) * (1 - t); // the arc: 0 at the ends, 1 halfway

  const poseOf = (s) => {
    const p = new THREE.Vector3().fromArray(s.position);
    const m = new THREE.Matrix4().lookAt(p, new THREE.Vector3().fromArray(s.target), camera.up);
    return { p, q: new THREE.Quaternion().setFromRotationMatrix(m), f: s.fov ?? 45 };
  };
  const fovFor = (f) => (portrait ? Math.min(80, f * 1.35) : f);

  // ── pointer parallax and touch swipes ──
  const parallax = new THREE.Vector2(), parallaxGoal = new THREE.Vector2();
  addEventListener('pointermove', (e) => {
    if (!still && e.pointerType === 'mouse') parallaxGoal.set(e.clientX / innerWidth - 0.5, e.clientY / innerHeight - 0.5);
  });
  document.addEventListener('mouseleave', () => parallaxGoal.set(0, 0));

  const _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3();
  const prev = { p: new THREE.Vector3(), q: new THREE.Quaternion(), f: 45 };
  let time = 0;

  const rig = {
    names,
    shots: all,
    get current() { return current; },
    get moving() { return move.t < 1; },
    onChange(fn) { listeners.push(fn); },
    setPortrait(v) { portrait = v; },
    go(name, instant = false) {
      const s = all[name]; if (!s) return;
      const to = poseOf(s);
      current = name;
      listeners.forEach((fn) => fn(name));
      if (instant || still) {
        pos.copy(to.p); quat.copy(to.q); fov = to.f;
        vel.set(0, 0, 0); angVel.set(0, 0, 0); fovVel = 0; move.t = 1;
        return;
      }
      const dist = pos.distanceTo(to.p), turn = quat.angleTo(to.q);
      move.T = THREE.MathUtils.clamp(0.75 + dist * 0.32 + turn * 0.3, 0.9, 2.1);
      move.t = 0;
      move.p0.copy(pos); move.p1.copy(to.p); move.v0.copy(vel);
      move.q0.copy(quat); move.q1.copy(to.q); move.w0.copy(angVel);
      move.f0 = fov; move.f1 = to.f; move.fv0 = fovVel;
      // Arc long moves up and toward the middle of the room, away from walls and furniture.
      const mid = _v.copy(move.p0).add(move.p1).multiplyScalar(0.5);
      move.lift.copy(roomCenter).sub(mid).multiplyScalar(Math.min(0.5, dist * 0.12));
      move.lift.y = Math.max(move.lift.y, 0) + Math.min(0.25, dist * 0.06);
    },
    next(step = 1) {
      const i = names.indexOf(current);
      rig.go(names[(i + step + names.length) % names.length]);
    },
    update(dt) {
      time += dt;
      prev.p.copy(pos); prev.q.copy(quat); prev.f = fov;
      if (move.t < 1) {
        move.t = Math.min(1, move.t + dt / move.T);
        const t = move.t, s = S(t), g = G(t) * move.T;
        pos.lerpVectors(move.p0, move.p1, s).addScaledVector(move.v0, g).addScaledVector(move.lift, B(t));
        quat.slerpQuaternions(move.q0, move.q1, s);
        if (move.w0.lengthSq() > 1e-8) {
          // carry the angular velocity the camera had when the move began
          const a = move.w0.length() * g;
          _q.setFromAxisAngle(_v.copy(move.w0).normalize(), a);
          quat.premultiply(_q);
        }
        fov = move.f0 + (move.f1 - move.f0) * s + move.fv0 * g;
      }
      // velocities, for the next move to start from
      if (dt > 0) {
        vel.subVectors(pos, prev.p).divideScalar(dt);
        _q.copy(prev.q).invert().premultiply(quat); // rotation this frame, in world space
        const angle = 2 * Math.acos(Math.min(1, Math.abs(_q.w)));
        if (angle > 1e-6) {
          _v.set(_q.x, _q.y, _q.z).normalize().multiplyScalar((_q.w < 0 ? -angle : angle) / dt);
          angVel.copy(_v);
        } else angVel.set(0, 0, 0);
        fovVel = (fov - prev.f) / dt;
        if (move.t >= 1) { vel.set(0, 0, 0); angVel.set(0, 0, 0); fovVel = 0; }
      }

      // parallax and idle drift, faded out while moving
      const calm = move.t < 1 ? Math.pow(Math.abs(2 * move.t - 1), 2) : 1;
      parallax.lerp(parallaxGoal, 1 - Math.exp(-dt * 3));
      camera.position.copy(pos);
      camera.quaternion.copy(quat);
      if (!still) {
        const drift = 0.006 * calm;
        _v.set(parallax.x * 0.06 + Math.sin(time * 0.31) * drift, -parallax.y * 0.04 + Math.sin(time * 0.23) * drift, 0);
        camera.position.add(_v.applyQuaternion(quat));
        _e.set(-parallax.y * 0.025 * calm, -parallax.x * 0.04 * calm, 0, 'YXZ');
        camera.quaternion.multiply(_q.setFromEuler(_e));
      }
      const f = fovFor(fov);
      if (Math.abs(camera.fov - f) > 1e-4) { camera.fov = f; camera.updateProjectionMatrix(); }
    },
  };
  return rig;
}
