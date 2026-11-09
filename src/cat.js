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
//
// On the full look he is given `nav` (src/catnav.js, read from the room's own triangles), and
// lives the careful way (`smartLife`): he walks around the desk's legs, the chair and the plant on
// a rounded A* path, speeds up and slows down, turns in place before he sets off, keeps his feet
// on the floor or the rug, sits on the real top of a perch turned so his body fits, and leaps on a
// parabola from a take-off spot whose arc clears the room, with a crouch before and a give after.
// On the lite look (phones) he keeps the cheap life below, with nothing more to compute.
import * as THREE from 'three';
import { arc, leapClear } from './catnav.js';

const S = (t) => t * t * (3 - 2 * t);

export function createCat(cfg, { still = false, seed = 7, nav = null } = {}) {
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

  if (nav && !still) return smartLife({ cfg, nav, rnd, group, torso, head, legs, tail, eyes });

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

// ── the careful life (the full look) ──
const ease = (dt, rate) => 1 - Math.exp(-rate * dt);
const MID = 0.1; // the middle of his body, ahead of the group's origin
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
function smartLife({ cfg, nav, rnd, group, torso, head, legs, tail, eyes }) {
  const perches = new Map(cfg.perches.map((p) => [p.id, { ...p, pos: new THREE.Vector3(...p.at) }]));
  const high = (p) => p.pos.y > 0.05;
  const chain = (p) => { const c = [p]; while (c.at(-1).via && perches.get(c.at(-1).via)) c.push(perches.get(c.at(-1).via)); return c; };
  const fwd = (yaw, out = new THREE.Vector3()) => out.set(-Math.sin(yaw), 0, -Math.cos(yaw));
  // how much of him a pose puts inside something: his body from the tail's root to the nose
  const hits = (pos, yaw) => {
    const f = fwd(yaw); let n = 0;
    for (const [along, up] of [[-0.12, 0.08], [0, 0.12], [0.1, 0.19], [0.18, 0.26]]) { // sitting: hips, back, chest, head
      if (nav.solidAt(pos.x + f.x * along, pos.y + up, pos.z + f.z * along)) n++;
    }
    return n;
  };
  const turns = [0, 0.35, -0.35, 0.7, -0.7, 1.05, -1.05, 1.4, -1.4, 1.75, -1.75, 2.1, -2.1, 2.45, -2.45, Math.PI];
  // he stands on something under his hips and his chest
  const held = (pos, yaw) => { const f = fwd(yaw); return [-0.1, 0.08].every((a) => nav.solidAt(pos.x + f.x * a, pos.y - 0.025, pos.z + f.z * a)); };
  const spot = new THREE.Vector3();
  for (const p of perches.values()) {
    if (!high(p)) { const c = nav.nearest(p.pos.x, p.pos.z); p.pos.set(c.x, nav.groundAt(c.x, c.y), c.y); }
    else {
      const y = nav.surface(p.pos.x, p.pos.y, p.pos.z); if (y !== null) p.pos.y = y;
      // a perch with a thing on it (the radio on the sill, the keyboard on the desk): the nearest
      // place on the same top where he fits, turned his own way or a little more each side
      let found = null;
      for (const r of [0, 0.06, 0.12, 0.18, 0.24, 0.3, 0.38, 0.46]) {
        for (let a = 0; a < (r ? 16 : 1) && !found; a++) {
          spot.set(p.pos.x + Math.cos(a * Math.PI / 8) * r, p.pos.y, p.pos.z + Math.sin(a * Math.PI / 8) * r);
          const d = turns.find((dd) => !hits(spot, (p.face ?? 0) + dd) && held(spot, (p.face ?? 0) + dd));
          if (d !== undefined) found = [spot.clone(), (p.face ?? 0) + d];
        }
        if (found) break;
      }
      if (found) {
        const y2 = nav.surface(found[0].x, p.pos.y, found[0].z);
        p.pos.copy(found[0]); if (y2 !== null) p.pos.y = y2; p.face = found[1];
      }
      p.fits = found ? 0 : hits(p.pos, p.face ?? 0);
    }
    p.face ??= 0;
  }
  const home = perches.get('rug') ?? [...perches.values()].find((p) => !high(p)) ?? [...perches.values()][0];
  const reach = nav.region(home.pos.x, home.pos.z);
  // where he leaps up from, and lands when he comes down: a free, reachable floor spot whose
  // parabola clears the room, as near and as low as can be
  const lifts = [0.1, 0.18, 0.28, 0.4, 0.55, 0.75];
  function takeoff(p) {
    if (p.takeoff) return p.takeoff;
    let best = null;
    for (const d of [0.32, 0.45, 0.6, 0.78, 0.98]) for (let a = 0; a < 24; a++) {
      const ang = (a / 24) * Math.PI * 2, x = p.pos.x + Math.cos(ang) * d, z = p.pos.z + Math.sin(ang) * d;
      if (!nav.free(x, z) || !reach(x, z)) continue;
      const spot = new THREE.Vector3(x, nav.groundAt(x, z), z);
      const lift = lifts.find((l) => leapClear(nav, spot, p.pos, l));
      if (lift === undefined) continue;
      const score = d + 1.6 * lift;
      if (!best || score < best.score) best = { spot, lift, score };
    }
    if (!best) { const c = nav.nearest(p.pos.x, p.pos.z + 0.5); best = { spot: new THREE.Vector3(c.x, nav.groundAt(c.x, c.y), c.y), lift: 0.6 }; }
    return (p.takeoff = best);
  }
  const leapLift = (a, b) => [0.15, 0.25, 0.4, 0.6, 0.85].find((l) => leapClear(nav, a, b, l)) ?? 0.9;

  let here = home;
  group.position.copy(here.pos); let yaw = here.face; group.rotation.y = yaw;
  const plan = []; // { kind: 'walk', to } | { kind: 'jump', to, lift } | { kind: 'sit', at, dur, face }
  function route(to) {
    const a = chain(here), b = chain(to);
    const meet = a.find((p) => b.includes(p));
    const hops = meet ? [...a.slice(0, a.indexOf(meet) + 1), ...b.slice(0, b.indexOf(meet)).reverse()]
      : [...a, ...b.slice().reverse()];
    for (let i = 1; i < hops.length; i++) {
      const prev = hops[i - 1], next = hops[i];
      if (high(prev) && high(next)) plan.push({ kind: 'jump', to: next.pos.clone() });
      else if (high(next)) { const o = takeoff(next); plan.push({ kind: 'walk', to: o.spot.clone(), toward: next.pos }); plan.push({ kind: 'jump', to: next.pos.clone(), lift: o.lift }); }
      else {
        if (high(prev)) { const o = takeoff(prev); plan.push({ kind: 'jump', to: o.spot.clone(), lift: o.lift }); }
        if (next.id !== '_floor') plan.push({ kind: 'walk', to: next.pos.clone() });
      }
    }
    plan.push({ kind: 'sit', at: to, dur: 6 + rnd() * 10, face: to.face });
    here = to;
  }
  function next() {
    const all = [...perches.values()].filter((p) => p !== here);
    const to = all[Math.floor(rnd() * all.length)];
    const a = chain(here), b = chain(to);
    if (!a.some((p) => b.includes(p)) && high(a.at(-1)) && high(b.at(-1))) {
      route({ id: '_floor', pos: takeoff(a.at(-1)).spot, face: 0 }); plan.pop(); // down, no sitting on the way
      route(to);
    } else route(to);
  }

  // what moves smoothly from frame to frame
  let step = null, st = 0, elapsed = 0, calledUntil = -1, callYaw = 0;
  let speed = 0, phase = 0, gait = 0, sitK = 1, lieK = 0, crouchK = 0, stretchK = 0, pitch = 0, wiggle = 0, look = 0, lookTo = 0;
  const groundY = { v: group.position.y };
  const tmp = new THREE.Vector3();

  function turnToward(target, dt, rate = 3.2) {
    const d = wrap(target - yaw), max = rate * dt;
    yaw += Math.max(-max, Math.min(max, d * ease(dt, 7))); group.rotation.y = yaw;
    return Math.abs(d);
  }
  // a walk: the path, rounded, sampled every 2 cm, and how far along it he is
  function startWalk(s) {
    // the path is drawn for the middle of his body, a hand ahead of his hind feet (the group's origin)
    fwd(yaw, tmp); const mx = group.position.x + tmp.x * MID, mz = group.position.z + tmp.z * MID;
    const pts = nav.path(mx, mz, s.to.x, s.to.z).map((p) => new THREE.Vector3(p.x, 0, p.y));
    let line = pts;
    if (pts.length > 2) {
      const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.5);
      line = curve.getSpacedPoints(Math.max(8, Math.ceil(curve.getLength() / 0.02)));
    }
    s.line = line; s.at = [0];
    for (let i = 1; i < line.length; i++) s.at.push(s.at[i - 1] + line[i].distanceTo(line[i - 1]));
    s.len = s.at.at(-1); s.dist = 0; s.ready = false;
  }
  function along(s, d, out) {
    d = Math.max(0, Math.min(s.len, d));
    let i = 1; while (i < s.at.length - 1 && s.at[i] < d) i++;
    const a = s.at[i - 1], b = s.at[i], u = b > a ? (d - a) / (b - a) : 0;
    return out.lerpVectors(s.line[i - 1], s.line[i], u);
  }
  const headingAt = (s, d) => { along(s, d, tmp); const x = tmp.x, z = tmp.z; along(s, d + 0.12, tmp); return Math.atan2(-(tmp.x - x), -(tmp.z - z)); };

  function update(dt) {
    dt = Math.min(dt, 0.1); elapsed += dt; const t = elapsed;
    if (!step) { if (!plan.length) next(); step = plan.shift(); st = 0; if (step.kind === 'walk') startWalk(step); if (step.kind === 'jump') step.from = group.position.clone(); }
    st += dt;
    const called = t < calledUntil;
    let sitTo = 0, lieTo = 0, crouchTo = 0, stretchTo = 0, pitchTo = 0, gaitTo = 0, done = false;

    if (step.kind === 'walk') {
      const s = step;
      if (s.len < 0.01) done = true;
      else if (!s.ready) { // up from sitting, and turned the way he will go, before the first step
        along(s, 0, tmp); const cx = tmp.x, cz = tmp.z; // he turns about the middle of his body
        const off = turnToward(headingAt(s, 0), dt, 2.6); fwd(yaw, tmp);
        group.position.x = cx - tmp.x * MID; group.position.z = cz - tmp.z * MID;
        gaitTo = off > 0.15 ? 0.35 : 0; phase += dt * 5 * (off > 0.15 ? 1 : 0);
        if (off < 0.35 && sitK < 0.15 && lieK < 0.1) s.ready = true;
      } else {
        const left = s.len - s.dist;
        const bend = Math.abs(wrap(headingAt(s, s.dist + 0.15) - headingAt(s, s.dist)));
        const want = called ? 0 : Math.min(0.34 / (1 + 2.5 * bend), Math.sqrt(2 * 0.9 * left) + 0.015);
        speed += Math.max(-1.8 * dt, Math.min(0.8 * dt, want - speed));
        s.dist = Math.min(s.len, s.dist + speed * dt);
        turnToward(headingAt(s, Math.min(s.dist, s.len - 0.12)), dt, 4);
        along(s, s.dist, tmp); const mx = tmp.x, mz = tmp.z; fwd(yaw, tmp);
        group.position.x = mx - tmp.x * MID; group.position.z = mz - tmp.z * MID;
        phase += (speed * dt / 0.3) * Math.PI * 2;
        gaitTo = Math.min(1, speed / 0.18);
        if (left < 0.004 && !called) { done = true; speed = 0; }
      }
      groundY.v += (nav.groundAt(group.position.x, group.position.z) - groundY.v) * ease(dt, 14);
      group.position.y = groundY.v;
    } else if (step.kind === 'jump') {
      const s = step;
      if (!s.checked) { s.checked = true; s.lift = Math.max(s.lift ?? 0, leapLift(s.from, s.to)); } // from where he really stands
      if (!s.T) { const h = Math.hypot(s.to.x - s.from.x, s.to.z - s.from.z), dy = Math.abs(s.to.y - s.from.y); s.T = 0.3 + 0.2 * Math.sqrt(h + dy + s.lift); }
      const face = Math.atan2(-(s.to.x - s.from.x), -(s.to.z - s.from.z));
      if (!s.phase) { // turn to it
        if (turnToward(face, dt, 3) < 0.08 && sitK < 0.2 && lieK < 0.1) { s.phase = 'crouch'; s.t = 0; }
        gaitTo = 0.3; phase += dt * 5;
      } else if (s.phase === 'crouch') {
        s.t += dt; crouchTo = 1; wiggle = Math.sin(s.t * 40) * 0.05 * Math.min(1, s.t * 4);
        if (s.t > 0.34) { s.phase = 'fly'; s.t = 0; wiggle = 0; }
      } else if (s.phase === 'fly') {
        s.t += dt; const u = Math.min(1, s.t / s.T);
        arc(s.from, s.to, s.lift, u, group.position);
        // how steep he flies: the slope of the parabola, as a lean of the body
        const peak = Math.max(s.from.y, s.to.y) + s.lift, mid = (s.from.y + s.to.y) / 2;
        const dy = (s.to.y - s.from.y) + 4 * (peak - mid) * (1 - 2 * u), dh = Math.hypot(s.to.x - s.from.x, s.to.z - s.from.z) || 0.01;
        pitchTo = Math.max(-0.7, Math.min(0.7, Math.atan2(dy, dh) * 0.6));
        stretchTo = Math.sin(Math.PI * Math.min(1, u * 1.2)); crouchK *= 1 - ease(dt, 20);
        if (u >= 1) { s.phase = 'land'; s.t = 0; group.position.copy(s.to); groundY.v = s.to.y; crouchK = 0.75; }
      } else { // the give of the landing
        s.t += dt; crouchTo = 0;
        if (s.t > 0.28) done = true;
      }
    } else if (step.kind === 'sit') {
      turnToward(step.face, dt, 1.6);
      const floor = !high(step.at);
      lieTo = floor && step.dur > 11 && st > 2 ? 1 : 0;
      sitTo = st > 0.25 ? 1 : 0;
      if (st >= step.dur && !called) done = true;
    }

    sitK += (sitTo - sitK) * ease(dt, sitTo > sitK ? 4 : 7);
    lieK += (lieTo - lieK) * ease(dt, 1.4);
    crouchK += (crouchTo - crouchK) * ease(dt, crouchTo > crouchK ? 12 : 6);
    stretchK += (stretchTo - stretchK) * ease(dt, 14);
    pitch += (pitchTo - pitch) * ease(dt, 10);
    gait += (gaitTo - gait) * ease(dt, 6);
    pose(t, dt, called);
    if (done) step = null;
  }

  function pose(t, dt, called) {
    const sit = sitK * (1 - lieK);
    torso.rotation.x = 0.55 * sit - pitch;
    torso.rotation.z = wiggle;
    torso.position.y = 0.11 - 0.06 * lieK - 0.035 * crouchK + 0.006 * gait * Math.abs(Math.sin(phase));
    legs.forEach((g, i) => {
      const front = i < 2, side = i % 2 ? 1 : -1;
      const swing = Math.sin(phase + (front ? 0 : Math.PI) + (side > 0 ? Math.PI : 0)) * 0.5 * gait;
      g.rotation.x = swing - (front ? torso.rotation.x : 1.3 * sit) + (front ? -1.3 : 1.3) * lieK + (front ? 0.9 : -0.9) * stretchK;
      g.scale.y = 1 - 0.25 * crouchK;
    });
    tail.forEach((g, i) => {
      g.rotation.x = (i === 0 ? 0.6 + 0.8 * (1 - gait) * (1 - stretchK) - 0.4 * sit + 0.3 * stretchK : 0.25 - 0.15 * stretchK) - 0.5 * lieK;
      g.rotation.z = Math.sin(t * (1.3 + 1.7 * gait) + i * 0.6) * (0.12 + 0.05 * i) * (1 - 0.7 * stretchK);
    });
    const blink = (t % 5.3) < 0.12 ? 0.15 : 1;
    eyes.forEach((e) => { e.scale.y = 0.011 * (lieK > 0.5 ? 0.15 : blink); });
    if (!called) {
      if (gait < 0.3 && step?.kind === 'sit' && rnd() < 0.006) lookTo = (rnd() - 0.5) * 1.6;
      if (step?.kind !== 'sit') lookTo = 0;
      look += (lookTo - look) * ease(dt, 3);
      head.rotation.set(-torso.rotation.x * 0.8 + pitch * 0.3, look, 0);
    } else {
      const d = wrap(callYaw - yaw);
      look += (Math.max(-1.3, Math.min(1.3, d)) - look) * ease(dt, 6);
      head.rotation.set(-torso.rotation.x * 0.8 - 0.25, look, 0);
    }
  }

  return {
    group, update, nav,
    call(from) {
      calledUntil = elapsed + 2.2;
      callYaw = Math.atan2(-(from.x - group.position.x), -(from.z - group.position.z));
      lookTo = 0;
    },
    // for scripts/record.mjs and the console: where he is going
    get state() { return { step: step?.kind, here: here.id, perches: [...perches.values()].map((p) => ({ id: p.id, at: p.pos.toArray().map((v) => +v.toFixed(3)), face: +p.face.toFixed(2), fits: p.fits, takeoff: p.takeoff && { at: p.takeoff.spot.toArray().map((v) => +v.toFixed(3)), lift: p.takeoff.lift } })) }; },
  };
}
