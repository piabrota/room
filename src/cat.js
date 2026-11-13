// Nash, the black cat (config.cat): his life. His body is src/catbody.js; where he can go is
// src/catnav.js.
//
// He has no route. What he does next is drawn at random, from a seeded generator and the room's
// clock, so `just record` films the same life every time:
//
//   wander   to a spot a random step away: the heading keeps a little of the last one, the length
//            is drawn from an exponential, and the spot must be free floor he can reach; now and
//            then he changes his mind on the way, and now and then he trots;
//   visit    one of the places he likes (`perches`): the floor ones on foot, the high ones by
//            leaps, through their `via` when one leap is too much;
//   pause    he stands and looks at something (`looks`, or you), sniffs the floor, sits, washes a
//            paw or his flank, stretches, loafs;
//   sleep    when he has been up long enough (`sleep.awake`) he goes to a soft place (`sleep` on a
//            perch; a place in the `sun` by day), turns round on it, curls up with his tail about
//            him and sleeps (`sleep.asleep`), breathing slowly, an ear twitching; then he wakes,
//            stretches and yawns.
//
// He walks on his feet: each paw stays where it was put down until its turn to swing, and the
// stride is tied to the speed (a four-beat walk; the diagonals pair up into a trot above
// `gait.trot`). A leap is a body thrown: he looks, crouches and wiggles, pushes off, and flies a
// parabola under 9.81 m/s² whose take-off speed and rise are within `jump`; he lands fore paws
// first and gives. Down, he peers over the edge, reaches and drops.
//
// A click calls him (`call`): he stops, or lifts his head if he sleeps, looks at you and meows
// (src/app.js). Under reduced motion he sleeps where `still` says, breathing only. On the phone's
// look, or before the room is read, he has no map: he keeps to the open floor of `roam`.
import * as THREE from 'three';
import { arc, leapClear } from './catnav.js';
import { createBody, POSES, KEYS } from './catbody.js';

const G = 9.81, TAU = Math.PI * 2;
const ease = (dt, rate) => 1 - Math.exp(-rate * dt);
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const ss = (u) => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
const OFF_WALK = [0.25, 0.75, 0, 0.5], OFF_TROT = [0.5, 1, 0, 0.5]; // when each paw's turn comes: fore left, fore right, hind left, hind right

// the open floor, when there is no map of the room: a box he never leaves, on one level
function openFloor(roam) {
  const [x0, z0, x1, z1] = roam.box, y = roam.y ?? 0;
  const free = (x, z) => x >= x0 && x <= x1 && z >= z0 && z <= z1;
  return {
    open: true, box: roam.box, free, groundAt: () => y, solidAt: () => false, surface: () => null, region: () => free,
    nearest: (x, z) => new THREE.Vector2(clamp(x, x0, x1), clamp(z, z0, z1)),
    path: (ax, az, bx, bz) => [new THREE.Vector2(ax, az), new THREE.Vector2(clamp(bx, x0, x1), clamp(bz, z0, z1))],
  };
}

export function createCat(cfg, { still = false, seed = 7, nav: firstNav = null, lite = false, watch = null } = {}) {
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const gauss = () => (rnd() + rnd() + rnd() + rnd() - 2) * 1.73;
  const between = ([a, b]) => a + (b - a) * rnd();
  const about = (mean, spread = 0.45) => mean * Math.exp(gauss() * spread); // a time: mostly near the mean, now and then long
  const draw = (table) => { let sum = 0; for (const k in table) sum += table[k]; let r = rnd() * sum; for (const k in table) { r -= table[k]; if (r <= 0) return k; } return Object.keys(table)[0]; };

  const body = createBody(cfg, { lite });
  const { group, out } = body, sz = body.size, NT = body.NT;
  const habits = cfg.habits, gaitCfg = cfg.gait, jumpCfg = cfg.jump, sleepCfg = cfg.sleep;

  // ── where he is, and what moves smoothly from frame to frame ──
  const pos = new THREE.Vector3(), tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();
  let yaw = 0, yawWas = 0, yawRate = 0, speed = 0, phase = 0, heading = 0;
  let elapsed = 0, awake = 0, bedtime = between(sleepCfg.awake), asleep = false, mirror = 1;
  const cur = { ...POSES.sit }, Q = { ...POSES.sit };
  let target = POSES.sit, rate = 5;
  const plantX = new Float64Array(4), plantZ = new Float64Array(4), fromX = new Float64Array(4), fromZ = new Float64Array(4), swing = new Float64Array(4).fill(-1), timed = new Uint8Array(4);
  const hm = new Float64Array(12);
  let foreLift = 0, foreLiftTo = 0, flying = false, flyPitch = 0, wiggle = 0, replant = true, stepWait = 0;
  let lookYaw = 0, lookPitch = 0, glanceYaw = 0, glancePitch = 0, glanceT = 0;
  const lookAt = new THREE.Vector3(); let looking = false;
  let blink = 0, blinkT = 2, earL = 0, earR = 0, earT = 1, flick = 0, flickT = 3, groomK = 0, groomSide = 0, pupil = 0.8, drowse = 0;
  const tailY = new Float64Array(NT);
  const callAt = new THREE.Vector3(); let called = false, callUntil = -1;
  let lastJump = null;

  // ── the room ──
  let nav = null, perches = new Map(), reach = () => true, home = null, here = null;
  const high = (p) => p.pos.y > 0.05;
  const chain = (p) => { const c = [p]; while (c.at(-1).via && perches.get(c.at(-1).via)) c.push(perches.get(c.at(-1).via)); return c; };
  const fwd = (a, o = tmp) => o.set(-Math.sin(a), 0, -Math.cos(a));
  // how much of him, sitting, is inside something: hips, back, chest, head
  const hits = (p, a) => { const f = fwd(a, tmp2); let n = 0; for (const [al, up] of [[-0.14, 0.09], [-0.03, 0.15], [0.07, 0.23], [0.11, 0.31]]) if (nav.solidAt(p.x + f.x * al, p.y + up, p.z + f.z * al)) n++; return n; };
  const held = (p, a) => { const f = fwd(a, tmp2); return [-0.11, 0.07].every((al) => nav.solidAt(p.x + f.x * al, p.y - 0.025, p.z + f.z * al)); };
  const turns = [0, 0.35, -0.35, 0.7, -0.7, 1.05, -1.05, 1.4, -1.4, 1.75, -1.75, 2.1, -2.1, 2.45, -2.45, Math.PI];
  const roomy = (x, z, r = 0.12) => nav.free(x, z) && nav.free(x + r, z) && nav.free(x - r, z) && nav.free(x, z + r) && nav.free(x, z - r) && reach(x, z);

  function setNav(next) {
    nav = next ?? openFloor(cfg.roam);
    perches = new Map();
    for (const c of cfg.perches) {
      const p = { ...c, pos: new THREE.Vector3(...c.at), face: c.face ?? 0 };
      if (nav.open) { if (high(p) || !nav.free(p.pos.x, p.pos.z)) continue; p.pos.y = nav.groundAt(); perches.set(p.id, p); continue; }
      if (!high(p)) { const n = nav.nearest(p.pos.x, p.pos.z); p.pos.set(n.x, nav.groundAt(n.x, n.y), n.y); }
      else {
        const y = nav.surface(p.pos.x, p.pos.y, p.pos.z); if (y !== null) p.pos.y = y;
        // a perch with a thing on it (the radio on the sill, the keyboard on the desk): the nearest
        // place on the same top where he fits, turned his own way or a little more each side
        let found = null; const spot = new THREE.Vector3();
        for (const r of [0, 0.06, 0.12, 0.18, 0.24, 0.3, 0.38, 0.46]) {
          for (let a = 0; a < (r ? 16 : 1) && !found; a++) {
            spot.set(p.pos.x + Math.cos(a * Math.PI / 8) * r, p.pos.y, p.pos.z + Math.sin(a * Math.PI / 8) * r);
            const y2 = nav.surface(spot.x, p.pos.y, spot.z, 0.05); if (y2 === null) continue; spot.y = y2;
            const d = turns.find((dd) => !hits(spot, p.face + dd) && held(spot, p.face + dd));
            if (d !== undefined) found = [spot.clone(), p.face + d];
          }
          if (found) break;
        }
        if (found) { p.pos.copy(found[0]); p.face = found[1]; } else p.tight = true;
        // lying down he is longer: is there room for that, along him?
        const f = fwd(p.face, tmp2);
        if (p.tight || [-0.2, -0.1, 0.1, 0.2, 0.28].some((al) => nav.solidAt(p.pos.x + f.x * al, p.pos.y + 0.1, p.pos.z + f.z * al) || nav.solidAt(p.pos.x + f.x * al, p.pos.y + 0.16, p.pos.z + f.z * al))) p.tight = true;
      }
      perches.set(p.id, p);
    }
    home = perches.get(cfg.home) ?? [...perches.values()].find((p) => !high(p)) ?? { id: '_floor', pos: new THREE.Vector3(...(nav.open ? [(nav.box[0] + nav.box[2]) / 2, nav.groundAt(), (nav.box[1] + nav.box[3]) / 2] : [0, 0, 0])), face: 0 };
    reach = nav.region(home.pos.x, home.pos.z);
    // a high place he cannot get to and from by leaps a cat can do is not his
    for (const p of [...perches.values()]) if (high(p)) {
      const c = chain(p); let ok = !!takeoff(c.at(-1));
      for (let i = 0; i + 1 < c.length && ok; i++) ok = !!hop(c[i + 1].pos, c[i].pos) && !!hop(c[i].pos, c[i + 1].pos);
      if (!ok) { p.out = true; }
    }
    for (const p of [...perches.values()]) if (p.out || chain(p).some((c) => c.out)) perches.delete(p.id);
    // he starts over from where he is, on the floor; the first time, at home
    const bed = still && cfg.perches.find((p) => p.id === cfg.still); // asleep for good: where the config says, map or no map
    const start = bed ? { pos: new THREE.Vector3(...bed.at), face: bed.face ?? 0 } : home;
    if (!started || still) { pos.copy(start.pos); yaw = start.face; here = bed ? null : start; started = true; }
    else if (here && !perches.has(here.id)) here = null;
    if (!nav.open && !still && !(here && high(here))) { const n = nav.nearest(pos.x, pos.z); if (!nav.free(pos.x, pos.z)) { pos.x = n.x; pos.z = n.y; } pos.y = nav.groundAt(pos.x, pos.z); }
    plan.length = 0; step = null; replant = true;
  }
  let started = false;

  // ── leaps: a parabola under gravity, as low as clears the room, within what a cat can do ──
  // `lift` is how far the top of the arc is above the higher end; the flight then lasts
  // T = √(8c/g), with c the arc's sag, and the take-off speed follows.
  function ballistics(a, b, lift) {
    const peak = Math.max(a.y, b.y) + lift, c = peak - (a.y + b.y) / 2, T = Math.sqrt(8 * c / G);
    const vy = (b.y - a.y + 4 * c) / T, vh = Math.hypot(b.x - a.x, b.z - a.z) / T;
    return { lift, T, vy, vh, v0: Math.hypot(vy, vh), rise: Math.max(0, peak - a.y), dy: b.y - a.y };
  }
  const lifts = [0.03, 0.06, 0.1, 0.15, 0.22, 0.3, 0.4];
  function hop(a, b) {
    if (b.y - a.y > jumpCfg.rise) return null;
    for (const l of lifts) {
      const j = ballistics(a, b, l);
      if (j.v0 > jumpCfg.speed || j.rise > jumpCfg.rise + 0.05) return null;
      if (leapClear(nav, a, b, l)) return j;
    }
    return null;
  }
  // where he leaps up from, and lands when he comes down: free floor he can reach, whose arc
  // clears the room, as near and as easy as can be
  function takeoff(p) {
    if (p.takeoff !== undefined) return p.takeoff;
    let best = null; const spot = new THREE.Vector3();
    for (const d of [0.4, 0.52, 0.66, 0.82, 1.0, 1.2]) for (let a = 0; a < 24; a++) {
      const ang = (a / 24) * TAU, x = p.pos.x + Math.cos(ang) * d, z = p.pos.z + Math.sin(ang) * d;
      if (!roomy(x, z, 0.08)) continue;
      spot.set(x, nav.groundAt(x, z), z);
      const up = hop(spot, p.pos), down = up && hop(p.pos, spot); if (!down) continue;
      const score = up.v0 + 0.6 * d;
      if (!best || score < best.score) best = { spot: spot.clone(), score };
    }
    return (p.takeoff = best);
  }

  // ── the plan: steps he takes one after another ──
  //   { k: 'walk', to, speed, loose }   on foot, round the furniture
  //   { k: 'turn', face } · { k: 'spin', turns }
  //   { k: 'jump', to, perch }
  //   { k: 'pose', name, dur, look, anim, tol }
  const plan = []; let step = null, st = 0;
  const pose = (name, dur, o) => plan.push({ k: 'pose', name, dur, ...o });
  const lookTarget = () => {
    const l = cfg.looks ?? [], n = l.length + (watch ? 2 : 0), i = Math.floor(rnd() * n);
    return i < l.length ? l[i].at : 'you';
  };
  function goTo(p) { // the steps to a perch, from where he is
    const a = here && high(here) ? chain(here) : [], b = high(p) ? chain(p) : [];
    const meet = a.find((x) => b.includes(x));
    const down = meet ? a.slice(0, a.indexOf(meet) + 1) : a, up = meet ? b.slice(0, b.indexOf(meet)) : b;
    for (let i = 1; i < down.length; i++) plan.push({ k: 'jump', to: down[i].pos, perch: down[i] });
    if (!meet) {
      if (down.length) plan.push({ k: 'jump', to: takeoff(down.at(-1)).spot, perch: null });
      if (up.length) { const t = takeoff(up.at(-1)); plan.push({ k: 'walk', to: t.spot, speed: gaitCfg.walk, toward: up.at(-1).pos }); }
      else plan.push({ k: 'walk', to: p.pos, speed: gaitCfg.walk, perch: p });
    }
    for (let i = up.length - 1; i >= 0; i--) plan.push({ k: 'jump', to: up[i].pos, perch: up[i] });
    if (p.face !== undefined && (high(p) || rnd() < 0.5)) plan.push({ k: 'turn', face: p.face });
  }
  function getDown() { if (here && high(here)) { const c = chain(here); for (let i = 1; i < c.length; i++) plan.push({ k: 'jump', to: c[i].pos, perch: c[i] }); plan.push({ k: 'jump', to: takeoff(c.at(-1)).spot, perch: null }); } }
  // a spot a random step away: the heading wanders, the step's length is exponential
  function wanderSpot(o) {
    for (let i = 0; i < 14; i++) {
      const h = heading + gauss() * (0.7 + 0.25 * i), d = Math.min(3.6, 0.35 - Math.log(1 - rnd() * 0.999) * gaitCfg.step);
      const x = pos.x - Math.sin(h) * d, z = pos.z - Math.cos(h) * d;
      if (roomy(x, z)) { heading = h; return o.set(x, 0, z); }
    }
    for (let i = 0; i < 40; i++) { // boxed in: anywhere he can reach
      const x = nav.box[0] + rnd() * (nav.box[2] - nav.box[0]), z = nav.box[1] + rnd() * (nav.box[3] - nav.box[1]);
      if (roomy(x, z)) { heading = Math.atan2(-(x - pos.x), -(z - pos.z)); return o.set(x, 0, z); }
    }
    return null;
  }
  const restful = (p) => (p.tight ? ['sit'] : p.rest ?? ['sit']); // where he has no room to lie, he sits
  function settle(p, long = 1) { // what he does once he is somewhere to stay
    const kinds = p ? restful(p) : ['sit', 'loaf'];
    const k = kinds[Math.floor(rnd() * kinds.length)], t = about(habits.pause * long) / (cfg.restless || 1);
    if (k === 'loaf') pose('loaf', t * 1.6);
    else { pose('sit', t * 0.6, { look: rnd() < 0.6 ? lookTarget() : null }); if (rnd() < 0.4) pose('sit', about(5), { anim: rnd() < 0.5 ? 'paw' : 'flank' }); if (rnd() < 0.5) pose('sit', t * 0.5); }
  }
  function goSleep() {
    const day = !!group.parent?.userData.day, table = {};
    for (const p of perches.values()) if (p.sleep && !p.tight) table[p.id] = p.sleep * (p.sun ? (day ? 4 : 0.2) : 1) * (p === here ? 2 : 1);
    const p = perches.get(draw(table)) ?? here ?? home;
    if (p !== here) goTo(p);
    plan.push({ k: 'spin', turns: (rnd() < 0.5 ? 1 : -1) * (0.8 + rnd() * 0.7) });
    pose('loaf', 1.4);
    pose('curl', between(sleepCfg.asleep), { anim: 'sleep' });
    wake();
  }
  function wake() {
    pose('rouse', about(2.2, 0.2), { look: null }); pose('loaf', about(1.6, 0.2));
    pose('bow', 2.1, { tol: 0.02 }); pose('stand', 0.5);
    pose('yawn', 1.7); pose('sit', about(3, 0.3), { look: lookTarget() });
  }
  function decide() {
    if (awake > bedtime) { goSleep(); return; }
    const up = here && high(here);
    const table = up ? { stay: 3, perch: habits.perch, down: habits.wander * 0.5 }
      : { wander: habits.wander, perch: habits.perch, look: habits.look, sniff: habits.sniff, sit: habits.sit, groom: habits.groom, stretch: habits.stretch, loaf: habits.loaf, dash: habits.dash };
    if (paused) { table.wander = 0; table.dash = 0; table.perch = 0; paused = false; }
    const what = draw(table);
    if (what === 'wander' || what === 'dash' || what === 'down') {
      if (what === 'down') { getDown(); return; }
      const to = wanderSpot(new THREE.Vector3()); if (!to) { pose('sit', 3); return; }
      plan.push({ k: 'walk', to, speed: what === 'dash' ? gaitCfg.run : gaitCfg.walk * (0.75 + 0.5 * rnd()), loose: true });
      if (rnd() < 0.35) pose('stand', about(1.6) / (cfg.restless || 1), { look: rnd() < 0.7 ? lookTarget() : null });
    } else if (what === 'perch') {
      const table2 = {}; for (const p of perches.values()) if (p !== here) table2[p.id] = p.like ?? 1;
      const p = perches.get(draw(table2)); if (!p) { pose('sit', 3); return; }
      goTo(p); settle(p, 1.5);
    } else if (what === 'stay') settle(here);
    else if (what === 'look') pose(rnd() < 0.5 ? 'alert' : 'stand', about(3.5) / (cfg.restless || 1), { look: lookTarget() });
    else if (what === 'sniff') { pose('sniff', about(2.6), { anim: 'sniff' }); pose('stand', 0.6); }
    else if (what === 'sit') settle(null);
    else if (what === 'groom') { pose('sit', 1); pose('sit', about(6), { anim: rnd() < 0.5 ? 'paw' : 'flank' }); pose('sit', about(2)); }
    else if (what === 'stretch') { pose('bow', 2.2, { tol: 0.02 }); pose('stand', 0.7); }
    else if (what === 'loaf') pose('loaf', about(habits.pause * 1.5) / (cfg.restless || 1));
  }
  let paused = false;

  // ── a walk: the path, rounded, sampled every 2 cm, and how far along it he is ──
  function startWalk(w) {
    const pts = nav.path(pos.x, pos.z, w.to.x, w.to.z).map((p) => new THREE.Vector3(p.x, 0, p.y));
    let line = pts;
    if (pts.length > 2) { const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.5); line = curve.getSpacedPoints(Math.max(8, Math.ceil(curve.getLength() / 0.02))); }
    w.line = line; w.at = [0];
    for (let i = 1; i < line.length; i++) w.at.push(w.at[i - 1] + line[i].distanceTo(line[i - 1]));
    w.len = w.at.at(-1); w.dist = 0; w.ready = false; w.i = 1;
  }
  function along(w, d, o) {
    d = clamp(d, 0, w.len);
    let i = 1; while (i < w.at.length - 1 && w.at[i] < d) i++;
    const a = w.at[i - 1], b = w.at[i], u = b > a ? (d - a) / (b - a) : 0;
    return o.lerpVectors(w.line[i - 1], w.line[i], u);
  }
  const headingAt = (w, d) => { along(w, d, tmp); const x = tmp.x, z = tmp.z; along(w, d + 0.14, tmp); return Math.atan2(-(tmp.x - x), -(tmp.z - z)); };
  function turnToward(a, dt, max = 2.6) {
    const d = wrap(a - yaw), lim = max * dt;
    yaw += clamp(d * ease(dt, 6), -lim, lim);
    return Math.abs(d);
  }
  const set = (name, r = 5) => { target = POSES[name]; rate = r; };

  function begin(n) {
    step = n; st = 0; looking = false;
    if (n.k === 'walk') startWalk(n);
    if (n.k === 'jump') { n.from = pos.clone(); n.ph = 'turn'; n.t = 0; }
    if (n.k === 'spin') { n.left = Math.abs(n.turns) * TAU; }
    if (n.k === 'pose' && Math.abs(cur.tailW) < 0.03 && Math.abs(cur.bend) < 0.05) mirror = n.flip ?? (rnd() < 0.5 ? -1 : 1); // the side he leans and curls to, chosen while he is straight
  }

  function live(dt) {
    if (!step) { if (!plan.length) decide(); if (!plan.length) pose('sit', 2); begin(plan.shift()); }
    st += dt;
    let done = false; foreLiftTo = 0; wiggle = 0; asleep = false;
    const n = step;
    if (n.k === 'walk') {
      set(speed > gaitCfg.trot ? 'trot' : 'walk', 4);
      if (n.len < 0.02) done = true;
      else if (!n.ready) { // up, and turned the way he will go, before the first step
        const off = turnToward(headingAt(n, 0), dt);
        if (off < 0.5 && cur.hipY > 0.16 && cur.free < 0.1) n.ready = true;
      } else {
        const left = n.len - n.dist, bend = Math.abs(wrap(headingAt(n, n.dist + 0.18) - headingAt(n, n.dist)));
        const stop = !!n.halt;
        const want = stop ? 0 : Math.min(n.speed / (1 + 2.2 * bend), Math.sqrt(2 * gaitCfg.brake * left) + 0.02);
        speed += clamp(want - speed, -gaitCfg.brake * 1.6 * dt, gaitCfg.push * dt);
        n.dist = Math.min(n.len, n.dist + speed * dt);
        turnToward(headingAt(n, Math.min(n.dist, n.len - 0.14)), dt, 4);
        along(n, n.dist, tmp); pos.x = tmp.x; pos.z = tmp.z;
        if (n.loose && !n.halt && left > 0.5 && rnd() < dt / habits.fickle) { n.halt = 'mind'; paused = true; } // he changes his mind
        if (left < 0.006 || (stop && speed < 0.01)) { done = true; speed = 0; if (n.halt === 'mind') plan.length = 0; else if (n.perch && !n.halt) here = n.perch; }
      }
      if (!flying) pos.y += (nav.groundAt(pos.x, pos.z) - pos.y) * ease(dt, 14);
      if (n.toward) { looking = n.len - n.dist < 0.5; lookAt.copy(n.toward); }
    } else if (n.k === 'turn' || n.k === 'spin') {
      set(n.k === 'spin' ? 'walk' : 'stand', 5);
      if (n.k === 'turn') { if ((cur.hipY < 0.16 ? 0 : turnToward(n.face, dt, 2.2)) < 0.06 || st > 4) done = true; }
      else if (cur.hipY > 0.16 && cur.free < 0.1) { const d = Math.min(n.left, 2.1 * dt * ss(st * 2) * Math.min(1, n.left * 2 + 0.15)); yaw += Math.sign(n.turns) * d; n.left -= d; if (n.left < 0.01) done = true; }
    } else if (n.k === 'jump') done = leap(n, dt);
    else if (n.k === 'pose') {
      set(n.name, n.name === 'bow' ? 3 : n.name === 'curl' ? 2.2 : 4.5);
      if (n.look) { looking = true; if (n.look === 'you') lookAt.copy(called ? callAt : watch ?? callAt); else lookAt.set(n.look[0], n.look[1], n.look[2]); }
      if (n.anim === 'sleep') asleep = st > 2.5;
      if (st >= n.dur && !called) { done = true; if (n.anim === 'sleep') { awake = 0; bedtime = between(sleepCfg.awake); } }
    }
    if (done) { step = null; if (here && n.k === 'walk' && !n.perch) here = null; }
  }

  // the leap itself: turn to it, look, crouch, push off, fly, land
  function leap(n, dt) {
    n.t += dt;
    const face = Math.atan2(-(n.to.x - n.from.x), -(n.to.z - n.from.z));
    if (n.ph === 'turn') {
      set('stand', 5);
      if ((cur.hipY < 0.16 || cur.free > 0.1 ? 1 : turnToward(face, dt, 2.4)) < 0.05) {
        n.from.copy(pos); n.down = n.to.y < n.from.y - 0.08;
        n.j = hop(n.from, n.to) ?? ballistics(n.from, n.to, 0.3);
        lastJump = { ...n.j, from: n.from.toArray(), to: n.to.toArray() };
        n.ph = 'aim'; n.t = 0; n.aim = n.down ? 0.7 + rnd() * 0.7 : 0.5 + rnd() * 0.8; n.crouch = 0.42 + rnd() * 0.25;
      }
    } else if (n.ph === 'aim') {
      set(n.down ? 'peer' : 'alert', 5); looking = true; lookAt.copy(n.to);
      if (n.t > n.aim) { n.ph = n.down ? 'push' : 'crouch'; n.t = 0; }
    } else if (n.ph === 'crouch') {
      set('crouch', 9); looking = true; lookAt.copy(n.to);
      wiggle = Math.sin(n.t * 38) * 0.07 * ss((n.t - 0.12) * 5) * ss((n.crouch - n.t) * 12);
      if (n.t > n.crouch) { n.ph = 'push'; n.t = 0; }
    } else if (n.ph === 'push') {
      set(n.down ? 'reach' : 'push', n.down ? 14 : 26); foreLiftTo = 1; looking = true; lookAt.copy(n.to);
      flyPitch += ((n.down ? -0.3 : Math.atan2(n.j.vy, n.j.vh) * 0.5) - flyPitch) * ease(dt, 20);
      if (n.t > (n.down ? 0.14 : 0.1)) { n.ph = 'fly'; n.t = 0; flying = true; }
    } else if (n.ph === 'fly') {
      const u = Math.min(1, n.t / n.j.T); arc(n.from, n.to, n.j.lift, u, pos);
      const vy = n.j.vy - G * n.t, a = Math.atan2(vy, n.j.vh);
      flyPitch += (clamp(a * 0.85, n.down && u > 0.7 ? -0.35 : -0.75, 1.0) - flyPitch) * ease(dt, n.down ? 9 : 16); // down, he levels out to meet the floor
      set(u < (n.down ? 0.5 : 0.32) ? 'reach' : u < (n.down ? 0.5 : 0.62) ? 'tuck' : 'alight', 13);
      looking = true; lookAt.copy(n.to); foreLiftTo = 1;
      if (u >= 1) { n.ph = 'land'; n.t = 0; flying = false; pos.copy(n.to); here = n.perch; landed(); heading = yaw; }
    } else {
      flyPitch *= 1 - ease(dt, 18);
      const give = n.down ? 0.34 : 0.22;
      set(n.t < give ? 'absorb' : 'stand', n.t < give ? 16 : 6);
      if (n.t > give + 0.35) return true;
    }
    return false;
  }
  // the landing: the fore paws are down where they reached, the hind ones come in under him
  function landed() {
    feetHome();
    for (let i = 0; i < 4; i++) {
      if (i < 2) { toWorld(hm, i * 3, i); swing[i] = -1; }
      else { fromX[i] = plantX[i]; fromZ[i] = plantZ[i]; swing[i] = 0.3; timed[i] = 1; }
    }
    foreLift = 0;
  }

  // ── the feet ──
  const left = new THREE.Vector3();
  const toWorld = (a, o, i) => { plantX[i] = pos.x + (left.x * a[o] + tmp2.x * a[o + 2]) * sz; plantZ[i] = pos.z + (left.z * a[o] + tmp2.z * a[o + 2]) * sz; };
  function feetHome() { body.spine(Q, mirror); for (let i = 0; i < 4; i++) body.home(i, Q, out.ground, hm, i * 3); fwd(yaw, tmp2); left.set(-Math.cos(yaw), 0, Math.sin(yaw)); }
  function feet(dt, tol) {
    feetHome();
    const moving = speed > 0.015 || Math.abs(yawRate) > 0.35;
    const trot = ss((speed - gaitCfg.trot * 0.8) / (gaitCfg.trot * 0.4)), duty = 0.64 - 0.14 * trot;
    const stride = gaitCfg.stride[0] + gaitCfg.stride[1] * speed;
    if (moving) phase = (phase + (speed * dt + Math.abs(yawRate) * 0.1 * dt) / stride) % 1;
    stepWait -= dt;
    let worst = -1, worstErr = tol, busy = 0;
    for (let i = 0; i < 4; i++) if (swing[i] >= 0) busy++;
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    for (let i = 0; i < 4; i++) {
      const o = i * 3, front = i < 2;
      // his home, in the room
      const hx = pos.x + (left.x * hm[o] + tmp2.x * hm[o + 2]) * sz, hz = pos.z + (left.z * hm[o] + tmp2.z * hm[o + 2]) * sz;
      let lift = 0, u = -1;
      if (replant || cur.free > 0.5 || flying) { plantX[i] = hx; plantZ[i] = hz; swing[i] = -1; }
      else if (moving && !timed[i]) {
        const ph = (phase + (OFF_WALK[i] + (OFF_TROT[i] - OFF_WALK[i]) * trot)) % 1;
        if (ph >= duty) {
          u = (ph - duty) / (1 - duty);
          if (swing[i] < 0) { fromX[i] = plantX[i]; fromZ[i] = plantZ[i]; }
          swing[i] = u;
          const lead = speed > 0.015 ? (1 - u) * (1 - duty) * stride + stride * duty * 0.5 : 0;
          const k = ss(u); plantX[i] = fromX[i] + (hx + tmp2.x * lead - fromX[i]) * k; plantZ[i] = fromZ[i] + (hz + tmp2.z * lead - fromZ[i]) * k;
          lift = Math.sin(Math.PI * u) * (0.022 + 0.02 * trot + (front ? 0.004 : 0));
        } else swing[i] = -1;
      } else if (swing[i] >= 0) { // a step taken on the spot, to stand right
        timed[i] = 1; swing[i] += dt / 0.19; u = Math.min(1, swing[i]);
        const k = ss(u); plantX[i] = fromX[i] + (hx - fromX[i]) * k; plantZ[i] = fromZ[i] + (hz - fromZ[i]) * k;
        lift = Math.sin(Math.PI * u) * 0.02;
        if (swing[i] >= 1) { swing[i] = -1; timed[i] = 0; stepWait = 0.05; u = -1; }
      } else {
        timed[i] = 0;
        const err = Math.hypot(plantX[i] - hx, plantZ[i] - hz);
        if (err > worstErr) { worstErr = err; worst = i; }
      }
      // into his own frame
      const dx = (plantX[i] - pos.x) / sz, dz = (plantZ[i] - pos.z) / sz;
      let lx = -cy * dx + sy * dz, lz = -sy * dx - cy * dz, ly = out.ground + lift;
      if (cur.free > 0) { const f = cur.free; lx += (hm[o] - lx) * f; ly += (hm[o + 1] - ly) * f; lz += (hm[o + 2] - lz) * f; }
      let phi = front ? Q.fPhi : Q.hPhi, toe = 0;
      if (u >= 0) { const b = Math.sin(Math.PI * u); phi += (front ? 0.95 : 0.55) * b; toe = -(front ? 0.7 : 0.5) * b; }
      if (cur.free > 0.3) toe = -0.5 * cur.free * (front ? 1 : 0.4);
      if (front && foreLift > 0.001) { // the fore paws leave the ground and fold under the chest
        const k = 9, f = foreLift;
        const fx = out.hip[o] + out.D[k] * 0.07 - 0, fy = out.hip[o + 1] - 0.1 + out.D[k + 1] * 0.07, fz = out.hip[o + 2] + out.D[k + 2] * 0.07;
        if (cur.free < 0.5) { lx += (fx - lx) * f; ly += (fy - ly) * f; lz += (fz - lz) * f; phi += 0.8 * f; toe = -0.6 * f; }
      }
      out.foot[o] = lx; out.foot[o + 1] = ly; out.foot[o + 2] = lz; out.footPhi[i] = phi; out.toe[i] = toe;
    }
    if (worst >= 0 && !busy && stepWait <= 0 && !moving) { swing[worst] = 0; timed[worst] = 1; fromX[worst] = plantX[worst]; fromZ[worst] = plantZ[worst]; }
    replant = false;
  }

  // ── every frame ──
  function update(dt) {
    dt = Math.min(dt, 0.1); elapsed += dt; const t = elapsed;
    if (called && t > callUntil) called = false;
    if (step?.k !== 'walk') speed *= 1 - ease(dt, 8);
    if (still) { set('curl', 5); asleep = true; if (replant) Object.assign(cur, POSES.curl); }
    else { awake += asleep ? 0 : dt; live(dt); }
    if (dt > 1e-5) yawRate += (wrap(yaw - yawWas) / dt - yawRate) * ease(dt, 10);
    yawWas = yaw;
    const k = ease(dt, rate); for (const key of KEYS) cur[key] += (target[key] - cur[key]) * k;
    foreLift += (foreLiftTo - foreLift) * ease(dt, 18);
    if (!flying && step?.k !== 'jump') flyPitch *= 1 - ease(dt, 10);
    for (const key of KEYS) Q[key] = cur[key];

    // the gait's weight: the hips and the shoulders rock over the feet that carry them
    const gk = Math.min(1, speed / 0.12), a = phase * TAU;
    Q.hipY += -0.0045 * gk * Math.cos(2 * a) + 0.0; Q.roll0 += 0.06 * gk * Math.sin(a); Q.roll1 -= 0.05 * gk * Math.sin(a + 1.2);
    Q.hipX += 0.006 * gk * Math.sin(a + 0.6); Q.p1 += 0.02 * gk * Math.sin(2 * a + 0.8);
    // he bends into a turn, and wiggles before a leap
    const bendTo = clamp(yawRate * 0.22, -0.55, 0.55) + 0.06 * gk * Math.sin(a);
    Q.bend += bendTo; Q.yaw0 += -bendTo * 0.5 + wiggle; Q.hipX += wiggle * 0.05;
    // in the air he lies along his path
    if (flyPitch) { Q.p0 += flyPitch; Q.p1 += flyPitch; Q.hipY -= Math.sin(flyPitch) * 0.12; Q.hipF += (1 - Math.cos(flyPitch)) * 0.1; Q.neckP -= flyPitch * 0.35; }

    // the head: at what he looks at, or about him
    let wantYaw = 0, wantPitch = 0;
    if (called && !flying) { looking = true; lookAt.copy(callAt); }
    if (looking) {
      const hy = pos.y + (out.neck1[1] || 0.26) * sz, f = fwd(yaw, tmp), hx = pos.x + f.x * 0.2, hz = pos.z + f.z * 0.2;
      const dx = lookAt.x - hx, dz = lookAt.z - hz, base = yaw + (Q.yaw0 + Q.bend) * mirror;
      wantYaw = clamp(wrap(Math.atan2(-dx, -dz) - base), -1.45, 1.45) * mirror;
      wantPitch = clamp(Math.atan2(lookAt.y - hy, Math.hypot(dx, dz)), -0.9, 0.95) - Q.headP;
    } else if (!asleep && !still) {
      glanceT -= dt;
      if (glanceT < 0) { const moving = speed > 0.05; glanceT = about(moving ? 2.2 : 1.6); glanceYaw = moving ? gauss() * 0.25 : gauss() * 0.7; glancePitch = gauss() * 0.12; }
      wantYaw = clamp(glanceYaw, -1.3, 1.3); wantPitch = glancePitch;
      if (step?.k === 'pose' && (step.anim || step.name === 'curl' || step.name === 'bow' || step.name === 'yawn' || step.name === 'rouse')) { wantYaw = 0; wantPitch = 0; }
    }
    const lr = ease(dt, looking ? 7 : 3.5); lookYaw += (wantYaw - lookYaw) * lr; lookPitch += (wantPitch - lookPitch) * lr;
    Q.neckY += lookYaw * 0.42; Q.headY += lookYaw * 0.58; Q.headP += lookPitch * 0.75; Q.neckP += lookPitch * 0.2;
    // the head holds still over the walking body
    Q.headP -= 0.02 * gk * Math.sin(2 * a + 0.8);

    // washing: a fore paw to the mouth, or the head round to the flank
    const anim = step?.k === 'pose' && st > 0.6 && st < step.dur - 0.5 ? step.anim : null;
    const washing = anim === 'paw' || anim === 'flank';
    if (washing && groomK < 0.01) groomSide = anim === 'paw' ? 1 : 2;
    groomK += ((washing ? 1 : 0) - groomK) * ease(dt, 4);
    const lick = Math.sin(t * 15) * 0.5 + 0.5;
    if (groomK > 0.001) {
      if (groomSide === 1) { Q.neckP += -0.55 * groomK; Q.headP += (-0.75 - 0.16 * lick) * groomK; Q.neckY += 0.12 * groomK; Q.lid += 0.5 * groomK; }
      else { Q.neckY += 1.05 * groomK; Q.headY += 0.85 * groomK; Q.neckP -= 0.5 * groomK; Q.headP += (-0.55 - 0.14 * lick) * groomK; Q.bend += 0.35 * groomK; Q.lid += 0.5 * groomK; }
    }
    if (anim === 'sniff') { Q.headY += Math.sin(t * 1.3) * 0.35; Q.headP += Math.sin(t * 19) * 0.035; Q.neckY += Math.sin(t * 0.9) * 0.2; }

    // breath, ears, eyes
    const slow = asleep || still;
    out.breath = Math.sin(t * TAU * (slow ? 0.24 : cur.hipY < 0.1 ? 0.4 : 0.55)) * (slow ? 0.034 : 0.014);
    earT -= dt; if (earT < 0 && !still) { earT = about(asleep ? 6 : 3.5); const e = (rnd() - 0.3) * 0.9; if (rnd() < 0.5) earL = e; else earR = e; }
    earL *= 1 - ease(dt, asleep ? 9 : 2.5); earR *= 1 - ease(dt, asleep ? 9 : 2.5);
    out.earL += (earL + lookYaw * 0.25 - out.earL) * ease(dt, 20); out.earR += (earR - lookYaw * 0.25 - out.earR) * ease(dt, 20);
    blinkT -= dt; if (blinkT < 0) { blinkT = about(4.5); blink = 1; }
    blink = Math.max(0, blink - dt * 7);
    drowse += ((awake > bedtime * 0.85 && !asleep ? 0.3 : 0) - drowse) * ease(dt, 0.5);
    const day = !!group.parent?.userData.day, wide = step?.k === 'jump' || called ? 0.2 : 0;
    pupil += (clamp((day ? cfg.pupil.day : cfg.pupil.night) + wide, 0, 1) - pupil) * ease(dt, 3);
    body.look(clamp(Q.lid + drowse + (blink > 0 && Q.lid < 0.9 ? Math.sin(Math.min(1, blink) * Math.PI) : 0), 0, 1), pupil, day ? cfg.glow.day : cfg.glow.night);

    // the feet, then the tail, then every bone
    group.position.copy(pos); group.rotation.y = yaw;
    out.ground = flying ? -10 : 0;
    feet(dt, step?.k === 'pose' ? step.tol ?? (step.name === 'stand' || step.name === 'alert' || step.name === 'sniff' ? 0.045 : 0.022) : 0.05);
    if (groomK > 0.001 && groomSide === 1) { // the fore paw on the side he leans to comes up to his mouth
      const i = mirror > 0 ? 0 : 1, o = i * 3, f = groomK;
      const tx = out.neck1[0] * 0.5 + out.hip[o] * 0.5, ty = out.hip[o + 1] + 0.035 + 0.012 * lick, tz = out.hip[o + 2] + 0.085;
      out.foot[o] += (tx - out.foot[o]) * f; out.foot[o + 1] += (ty - out.foot[o + 1]) * f; out.foot[o + 2] += (tz - out.foot[o + 2]) * f;
      out.footPhi[i] += 1.5 * f; out.toe[i] = -0.9 * f;
    }
    // the tail: each link follows the one before it late, sways, flicks, and lies round him when he is down
    flickT -= dt; if (flickT < 0 && !still) { flickT = about(asleep ? 9 : 4); flick = (rnd() < 0.5 ? -1 : 1) * (asleep ? 0.5 : 1); }
    flick *= 1 - ease(dt, 2.2);
    const baseYaw = Q.yaw0 * mirror + Math.PI, swayA = (0.1 + 0.12 * gk) * (asleep || still ? 0 : 1) * (1 - Math.min(1, Math.abs(cur.tailW) * 3) * 0.7);
    for (let i = 0; i < NT; i++) {
      const u = (i + 0.5) / NT, lag = 8 / (1 + i * 0.9);
      const want = -mirror * cur.tailW * (8 / NT) * (i + 0.5) + swayA * u * Math.sin(t * (1.4 + 2.4 * gk) - i * 0.55) - yawRate * 0.07 * (i + 1) * (8 / NT) + flick * u * u * 0.9 * Math.sin(t * 9 - i * 0.6);
      tailY[i] += (want - tailY[i]) * ease(dt, lag + 2);
      out.tailYaw[i] = baseYaw + tailY[i];
      out.tailPitch[i] = Q.tailP + Q.tailC * i * (8 / NT) + flyPitch * 0.6 + (speed > 0.6 ? 0.04 * Math.sin(2 * a - i * 0.5) : 0);
    }
    body.solve(Q, mirror);
    // his shadow, on what is under him
    const drop = flying && step ? pos.y - (step.t / step.j.T < 0.5 ? step.from.y : step.to.y) : 0;
    const down = 1 - clamp((cur.hipY - 0.07) / 0.12, 0, 1);
    body.shade(Math.max(0, drop), (0.56 - 0.1 * down) * sz, (0.3 + 0.16 * down) * sz, cfg.shadow * (1 - clamp(drop / 0.9, 0, 0.85)));
  }

  setNav(firstNav);
  Object.assign(cur, still ? POSES.curl : POSES.sit); target = still ? POSES.curl : POSES.sit;
  if (!still) pose('sit', 1.5 + rnd() * 2);
  update(1 / 60);

  return {
    group, update, body,
    get nav() { return nav.open ? null : nav; },
    // the room, read (src/catnav.js): from now on he walks round the furniture and leaps
    setNav,
    // a click: he stops, or lifts his head from his sleep, and looks at the point (the camera)
    call(from) {
      if (still) return;
      callAt.copy(from); called = true; callUntil = elapsed + 2.6;
      if (step?.k === 'pose' && step.anim === 'sleep') { // woken: sometimes he goes back to sleep
        const rest = Math.max(0, step.dur - st); plan.length = 0; step = null;
        pose('rouse', 2.8, { look: 'you', flip: mirror });
        if (rest > 20 && rnd() < sleepCfg.again) { pose('curl', rest, { anim: 'sleep', flip: mirror }); wake(); }
        else { bedtime = awake + between(sleepCfg.awake); pose('loaf', 1.2); pose('bow', 2, { tol: 0.02 }); pose('stand', 0.6); }
      } else if (step?.k === 'pose' && step.name === 'curl') { plan.length = 0; step = null; pose('rouse', 2.8, { look: 'you', flip: mirror }); pose('loaf', 2); }
      else if (step?.k !== 'jump') { // what he was about to do is forgotten
        const keep = step?.k === 'pose' ? step.name : null; plan.length = 0;
        if (step?.k === 'walk') step.halt = true;
        if (step?.k === 'pose') step = null;
        if (step?.k === 'turn' || step?.k === 'spin') step = null;
        pose(keep === 'sit' || keep === 'loaf' || keep === 'yawn' ? 'sit' : keep === 'rouse' ? 'rouse' : 'stand', 2.6, { look: 'you' });
        paused = true;
      }
    },
    // for scripts and the console: make him do a thing now (`sleep`, `wander`, `sit`, `groom`, `stretch`, `loaf`, `sniff`, `yawn`, or a perch's id)
    act(what) {
      if (still) return; plan.length = 0; if (step?.k !== 'jump') step = null;
      if (what === 'sleep') goSleep();
      else if (what === 'nap') { pose('curl', 600, { anim: 'sleep', flip: 1 }); }
      else if (what === 'wander') { const to = wanderSpot(new THREE.Vector3()); if (to) plan.push({ k: 'walk', to, speed: gaitCfg.walk, loose: false }); }
      else if (what === 'dash') { const to = wanderSpot(new THREE.Vector3()); if (to) plan.push({ k: 'walk', to, speed: gaitCfg.run, loose: false }); }
      else if (what === 'groom') pose('sit', 30, { anim: 'paw' });
      else if (what === 'flank') pose('sit', 30, { anim: 'flank' });
      else if (what === 'stretch') pose('bow', 4, { tol: 0.02 });
      else if (what === 'sniff') pose('sniff', 6, { anim: 'sniff' });
      else if (POSES[what]) pose(what, 30);
      else if (perches.get(what)) { goTo(perches.get(what)); settle(perches.get(what), 3); }
    },
    get state() {
      return { step: step?.k, phase: step?.ph, pose: Object.keys(POSES).find((k) => POSES[k] === target), anim: step?.anim, here: here?.id ?? null, at: pos.toArray().map((v) => +v.toFixed(3)), yaw: +yaw.toFixed(3), speed: +speed.toFixed(3),
        asleep, awake: +awake.toFixed(1), bedtime: +bedtime.toFixed(1), flying, jump: lastJump, triangles: body.triangles,
        perches: [...perches.values()].map((p) => ({ id: p.id, at: p.pos.toArray().map((v) => +v.toFixed(3)), face: +p.face.toFixed(2), tight: !!p.tight, takeoff: p.takeoff ? p.takeoff.spot.toArray().map((v) => +v.toFixed(3)) : null })) };
    },
  };
}
