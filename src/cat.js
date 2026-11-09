// Nash, the black cat (config.cat). A few shapes (a body, a head with two ears and two eyes that
// glow at night, four legs, a tail of five links), moved by a small life of his own:
//
//   sit    on a perch for a while, turned the way it faces; the head looks about, the tail
//          sways, the eyes blink, and on the floor he sometimes lies down;
//   walk   on the floor, from under one perch to under the next, legs in a walking gait;
//   jump   up to a perch or down from it, with a crouch before; a perch too high for one jump
//          is reached through its `via` (the shelf from the desk's left end, the monitor and
//          the sill from the desk).
//
// Where he goes next is chosen at random, from a seeded generator and the room's clock, so
// `just record` films the same walk every time. Under reduced motion he sleeps on the monitor.
// A click calls him (`call`): he stops, turns his head to you and meows (src/app.js).
import * as THREE from 'three';

const S = (t) => t * t * (3 - 2 * t);

export function createCat(cfg, { still = false, seed = 7 } = {}) {
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const fur = new THREE.MeshStandardMaterial({ color: cfg.color, roughness: 0.55, metalness: 0 });
  const eyeMat = new THREE.MeshBasicMaterial({ color: cfg.eyes, toneMapped: false });
  const add = (parent, geo, mat, pos, rot, scl) => {
    const m = new THREE.Mesh(geo, mat); m.position.set(...pos); if (rot) m.rotation.set(...rot); if (scl) m.scale.set(...scl);
    m.castShadow = false; m.receiveShadow = true; parent.add(m); return m; // no shadow: the shadow maps are drawn only when the room changes
  };
  const ball = new THREE.SphereGeometry(1, 14, 10);

  // the cat faces -z; its origin is on the ground, between its feet
  const group = new THREE.Group(); group.name = 'cat';
  const torso = new THREE.Group(); torso.position.set(0, 0.11, 0.1); group.add(torso); // pivots at the hips
  add(torso, ball, fur, [0, 0.06, -0.1], null, [0.085, 0.08, 0.18]);   // the body
  add(torso, ball, fur, [0, 0.08, -0.21], null, [0.075, 0.085, 0.085]); // the chest
  const head = new THREE.Group(); head.position.set(0, 0.16, -0.3); torso.add(head);
  add(head, ball, fur, [0, 0, 0], null, [0.068, 0.062, 0.064]);
  add(head, ball, fur, [0, -0.018, -0.05], null, [0.03, 0.022, 0.025]); // the muzzle
  const ear = new THREE.ConeGeometry(0.026, 0.055, 4);
  for (const x of [-1, 1]) add(head, ear, fur, [x * 0.036, 0.058, 0.005], [0, 0, -x * 0.28]);
  const eyes = [-1, 1].map((x) => add(head, ball, eyeMat, [x * 0.026, 0.008, -0.055], null, [0.011, 0.011, 0.006]));
  eyes.forEach((e) => { e.castShadow = false; });
  const leg = new THREE.CylinderGeometry(0.016, 0.013, 0.12, 6).translate(0, -0.06, 0);
  const legs = [[-1, -0.22], [1, -0.22], [-1, 0], [1, 0]].map(([x, z]) => {
    const g = new THREE.Group(); g.position.set(x * 0.045, 0.012, z); torso.add(g);
    add(g, leg, fur, [0, 0, 0]); return g;
  });
  const tail = []; let at = torso;
  for (let i = 0; i < 5; i++) {
    const g = new THREE.Group(); g.position.set(0, i ? 0.055 : 0.07, i ? 0 : 0.07); at.add(g);
    add(g, new THREE.CylinderGeometry(0.013 - i * 0.0015, 0.015 - i * 0.0015, 0.06, 6).translate(0, 0.028, 0), fur, [0, 0, 0]);
    tail.push(g); at = g;
  }

  // ── where he can be ──
  const perches = new Map(cfg.perches.map((p) => [p.id, { ...p, pos: new THREE.Vector3(...p.at) }]));
  const centre = new THREE.Vector3(0.2, 0, 0.6);
  const below = (p) => { const v = p.pos.clone(); v.y = 0; return v.lerp(centre, Math.min(1, 0.45 / Math.max(0.01, v.distanceTo(centre)))); };
  const high = (p) => p.pos.y > 0.05;
  const chain = (p) => { const c = [p]; while (c.at(-1).via && perches.get(c.at(-1).via)) c.push(perches.get(c.at(-1).via)); return c; };

  let here = perches.get(still ? 'monitor' : 'rug') ?? [...perches.values()][0];
  group.position.copy(here.pos); let yaw = here.face ?? 0; group.rotation.y = yaw;
  const plan = []; // the steps ahead: { kind: 'sit' | 'walk' | 'jump', from, to, dur, face }
  let step = null, t0 = 0, look = 0, lookTo = 0, lying = 0, calledUntil = -1, callYaw = 0;

  function route(to) {
    const a = chain(here), b = chain(to);
    const meet = a.find((p) => b.includes(p));
    const down = meet ? a.slice(0, a.indexOf(meet) + 1) : a, up = meet ? b.slice(0, b.indexOf(meet)).reverse() : b.slice().reverse();
    const hops = [...down, ...up];
    let from = here.pos.clone();
    const go = (kind, to2, dur) => { plan.push({ kind, from: from.clone(), to: to2.clone(), dur }); from = to2.clone(); };
    for (let i = 1; i < hops.length; i++) {
      const prev = hops[i - 1], next = hops[i];
      if (high(prev) && high(next)) go('jump', next.pos, 0.55 + 0.12 * Math.abs(next.pos.y - prev.pos.y));
      else if (high(next)) { const u = below(next); go('walk', u, u.distanceTo(from) / 0.3); go('jump', next.pos, 0.6 + 0.15 * next.pos.y); }
      else { if (high(prev)) go('jump', below(prev), 0.55 + 0.1 * prev.pos.y); go('walk', next.pos, next.pos.distanceTo(from) / 0.3); }
    }
    plan.push({ kind: 'sit', at: to, dur: 6 + rnd() * 10, face: to.face ?? 0 });
    here = to;
  }
  // the next perch, at random; between two high perches that share no `via`, down to the floor and up
  function next() {
    const all = [...perches.values()].filter((p) => p !== here);
    const to = all[Math.floor(rnd() * all.length)];
    const a = chain(here), b = chain(to);
    if (!a.some((p) => b.includes(p)) && high(a.at(-1)) && high(b.at(-1))) {
      // via the floor: down the first chain, walk, up the second
      const floorStop = { id: '_floor', pos: below(b.at(-1)), face: 0 };
      route(floorStop); plan.pop(); // no sitting on the way
      route(to);
    } else route(to);
  }

  function pose(t, k, walking, crouch) {
    // walking: the legs in a gait; sitting: the torso up on the hips, the hind legs folded
    const sit = !walking && !crouch && step?.kind === 'sit' ? Math.min(1, (t - t0) / 0.4) : 0;
    const lie = lying;
    torso.rotation.x = 0.55 * S(sit) * (1 - lie);
    torso.position.y = 0.11 - 0.06 * lie - 0.03 * crouch;
    const gait = walking ? t * 9 : 0;
    legs.forEach((g, i) => {
      const front = i < 2, side = i % 2 ? 1 : -1;
      const swing = walking ? Math.sin(gait + (front ? 0 : Math.PI) + (side > 0 ? Math.PI : 0)) * 0.5 : 0;
      g.rotation.x = swing - (front ? torso.rotation.x : (sit ? 1.3 * sit : 0)) + (lie ? (front ? -1.3 : 1.3) * lie : 0);
      g.scale.y = 1 - 0.25 * crouch;
    });
    tail.forEach((g, i) => {
      g.rotation.x = (i === 0 ? (walking ? 0.6 : 1.4 - 0.4 * sit) : 0.25) - (lie ? 0.5 : 0);
      g.rotation.z = Math.sin(t * (walking ? 3 : 1.3) + i * 0.6) * (0.12 + 0.05 * i);
    });
    const blink = (t % 5.3) < 0.12 ? 0.15 : 1;
    eyes.forEach((e) => { e.scale.y = 0.011 * (lie > 0.5 ? 0.15 : blink); });
    // the head: looks about while he sits, at you when called
    if (t > calledUntil) {
      if (!walking && rnd() < 0.006) lookTo = (rnd() - 0.5) * 1.6;
      if (walking) lookTo = 0;
      look += (lookTo - look) * Math.min(1, k * 3);
      head.rotation.set(-torso.rotation.x * 0.8, look, 0);
    } else {
      let d = callYaw - yaw; d = Math.atan2(Math.sin(d), Math.cos(d));
      look += (Math.max(-1.3, Math.min(1.3, d)) - look) * Math.min(1, k * 6);
      head.rotation.set(-torso.rotation.x * 0.8 - 0.25, look, 0);
    }
  }

  let elapsed = 0;
  function update(dt) {
    elapsed += dt; const t = elapsed;
    if (still) { lying = 1; pose(t, dt, false, 0); return; }
    if (!step) { if (!plan.length) next(); step = plan.shift(); t0 = t; }
    const u = Math.min(1, (t - t0) / Math.max(0.01, step.dur));
    let walking = false, crouch = 0;
    if (t < calledUntil && step.kind === 'walk') { t0 += dt; } // called: he stops where he is
    else if (step.kind === 'walk') {
      walking = true;
      group.position.lerpVectors(step.from, step.to, u);
      const dx = step.to.x - step.from.x, dz = step.to.z - step.from.z;
      if (dx * dx + dz * dz > 1e-6) turnTo(Math.atan2(-dx, -dz), dt * 6);
    } else if (step.kind === 'jump') {
      const pre = 0.3; // the crouch, then the leap
      const dx = step.to.x - step.from.x, dz = step.to.z - step.from.z;
      if (dx * dx + dz * dz > 1e-6) turnTo(Math.atan2(-dx, -dz), dt * 10);
      const span = (t - t0) / step.dur;
      if (span < pre) { crouch = Math.sin(Math.PI * span / pre); group.position.copy(step.from); }
      else {
        const v = Math.min(1, (span - pre) / (1 - pre)), top = Math.max(step.from.y, step.to.y) + 0.22;
        group.position.lerpVectors(step.from, step.to, S(v));
        group.position.y = (1 - v) * (1 - v) * step.from.y + 2 * (1 - v) * v * (2 * top - (step.from.y + step.to.y) / 2) + v * v * step.to.y;
      }
      if (span >= 1) group.position.copy(step.to);
    } else if (step.kind === 'sit') {
      turnTo(step.face, dt * 3);
      const floor = step.at.pos.y < 0.05;
      const want = floor && step.dur > 11 && (t - t0) > 2 ? 1 : 0; // a long rest on the floor: he lies down
      lying += (want - lying) * Math.min(1, dt * 1.5);
    }
    if (step.kind !== 'sit') lying += (0 - lying) * Math.min(1, dt * 4);
    if ((t - t0) >= step.dur && t >= calledUntil) step = null;
    pose(t, dt, walking, crouch);
  }
  function turnTo(target, k) {
    let d = target - yaw; d = Math.atan2(Math.sin(d), Math.cos(d));
    yaw += d * Math.min(1, k); group.rotation.y = yaw;
  }

  return {
    group, update,
    // a click: he stops for two seconds and looks at the point (the camera)
    call(from) {
      calledUntil = elapsed + 2.2;
      callYaw = Math.atan2(-(from.x - group.position.x), -(from.z - group.position.z));
      lookTo = 0;
    },
  };
}
