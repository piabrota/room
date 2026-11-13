// Where Nash can go, read once from the room itself (the full look only; src/cat.js).
//
// Every triangle of the room is cut into a grid of 6 cm cells and 5 cm layers, so the cat knows,
// without a physics engine:
//   blocked  the floor cells where something stands between his paws and his back (a desk leg,
//            the chair's foot, the plant, a crate, a wall), grown by half his width;
//   ground   the height of the floor under each cell (the rug is 1.7 cm thick);
//   solid    the voxels anything fills, so a leap can be tried before he takes it.
// A walk is an A* path over the free cells, pulled straight where he can see through, then
// rounded into a curve. A leap is a parabola (`arc`) tried against the voxels (`leapClear`);
// src/cat.js raises its top until it clears the room and times it by gravity.
import * as THREE from 'three';

export function buildNav(root, { cell = 0.06, layer = 0.05, top = 2.6, lo = 0.03, hi = 0.32, radius = 0.12 } = {}) {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3();
  const floor = root.getObjectByName('floor');
  if (floor) box.setFromObject(floor); else box.setFromObject(root);
  box.min.x = Math.max(box.min.x, -8); box.min.z = Math.max(box.min.z, -8);
  box.max.x = Math.min(box.max.x, 8); box.max.z = Math.min(box.max.z, 8);
  const x0 = box.min.x, z0 = box.min.z;
  const nx = Math.ceil((box.max.x - x0) / cell), nz = Math.ceil((box.max.z - z0) / cell), ny = Math.ceil(top / layer);
  const solid = new Uint8Array(nx * nz * ny);
  const stand = new Uint8Array(nx * nz); // something in the slab of his body
  const ground = new Float32Array(nx * nz);
  const ix = (x) => Math.floor((x - x0) / cell), iz = (z) => Math.floor((z - z0) / cell);
  const clampX = (i) => Math.max(0, Math.min(nx - 1, i)), clampZ = (k) => Math.max(0, Math.min(nz - 1, k));

  // a triangle cut to the slab a <= y <= b: the x and z extent of what is left, or null
  const P = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  const cut = (a, b) => {
    let minx = Infinity, maxx = -Infinity, minz = Infinity, maxz = -Infinity;
    const take = (x, z) => { if (x < minx) minx = x; if (x > maxx) maxx = x; if (z < minz) minz = z; if (z > maxz) maxz = z; };
    for (let i = 0; i < 3; i++) {
      const p = P[i], q = P[(i + 1) % 3];
      if (p.y >= a && p.y <= b) take(p.x, p.z);
      for (const y of [a, b]) {
        if ((p.y - y) * (q.y - y) < 0) { const t = (y - p.y) / (q.y - p.y); take(p.x + (q.x - p.x) * t, p.z + (q.z - p.z) * t); }
      }
    }
    return minx === Infinity ? null : [minx, maxx, minz, maxz];
  };
  const fill = (r, f) => {
    for (let k = clampZ(iz(r[2])); k <= clampZ(iz(r[3])); k++) for (let i = clampX(ix(r[0])); i <= clampX(ix(r[1])); i++) f(i, k);
  };
  const e1 = new THREE.Vector3(), e2 = new THREE.Vector3();
  root.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh || o.userData.proxy || o.name === 'cat' || o.name === 'rain_glass') return;
    for (let p = o; p; p = p.parent) if (!p.visible || p.name === 'cat') return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    if (mats.every((m) => m.visible === false || (m.transparent && m.opacity < 0.5) || m.depthWrite === false)) return;
    const pos = o.geometry.attributes.position; if (!pos) return;
    const idx = o.geometry.index, n = idx ? idx.count : pos.count;
    for (let t = 0; t + 2 < n; t += 3) {
      for (let j = 0; j < 3; j++) P[j].fromBufferAttribute(pos, idx ? idx.getX(t + j) : t + j).applyMatrix4(o.matrixWorld);
      const ymin = Math.min(P[0].y, P[1].y, P[2].y), ymax = Math.max(P[0].y, P[1].y, P[2].y);
      if (ymin > top) continue;
      if (ymax < lo) { // the floor, the rug: how high he stands there
        e1.subVectors(P[1], P[0]); e2.subVectors(P[2], P[0]); e1.cross(e2).normalize();
        if (Math.abs(e1.y) > 0.7) { const r = cut(-1, lo); if (r) fill(r, (i, k) => { const c = k * nx + i; if (ymax > ground[c]) ground[c] = ymax; }); }
        continue;
      }
      if (ymin < hi) { const r = cut(lo, hi); if (r) fill(r, (i, k) => { stand[k * nx + i] = 1; }); }
      for (let L = Math.max(0, Math.floor(ymin / layer)); L <= Math.min(ny - 1, Math.floor(ymax / layer)); L++) {
        const r = cut(L * layer, (L + 1) * layer); if (r) fill(r, (i, k) => { solid[(L * nz + k) * nx + i] = 1; });
      }
    }
  });

  // grow what stands by his half width: a cell is free only if he fits on it
  const blocked = new Uint8Array(nx * nz), R = Math.ceil(radius / cell);
  for (let k = 0; k < nz; k++) for (let i = 0; i < nx; i++) {
    if (!stand[k * nx + i]) continue;
    for (let dk = -R; dk <= R; dk++) for (let di = -R; di <= R; di++) {
      if (di * di + dk * dk > R * R + R) continue;
      const a = i + di, b = k + dk; if (a >= 0 && b >= 0 && a < nx && b < nz) blocked[b * nx + a] = 1;
    }
  }
  for (let i = 0; i < nx; i++) blocked[i] = blocked[(nz - 1) * nx + i] = 1;
  for (let k = 0; k < nz; k++) blocked[k * nx] = blocked[k * nx + nx - 1] = 1;

  const free = (i, k) => i >= 0 && k >= 0 && i < nx && k < nz && !blocked[k * nx + i];
  const centre = (i, k) => new THREE.Vector2(x0 + (i + 0.5) * cell, z0 + (k + 0.5) * cell);
  // the free cell nearest to a point (a ring search)
  function nearest(x, z) {
    const i0 = clampX(ix(x)), k0 = clampZ(iz(z));
    if (free(i0, k0)) return [i0, k0];
    for (let r = 1; r < Math.max(nx, nz); r++) {
      let best = null, bd = Infinity;
      for (let dk = -r; dk <= r; dk++) for (let di = -r; di <= r; di++) {
        if (Math.max(Math.abs(di), Math.abs(dk)) !== r || !free(i0 + di, k0 + dk)) continue;
        const d = di * di + dk * dk; if (d < bd) { bd = d; best = [i0 + di, k0 + dk]; }
      }
      if (best) return best;
    }
    return [i0, k0];
  }
  // can he walk straight from a to b? (samples every half cell)
  function clear(ax, az, bx, bz) {
    const d = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(d / (cell * 0.5)));
    for (let s = 0; s <= n; s++) { const t = s / n; if (!free(ix(ax + (bx - ax) * t), iz(az + (bz - az) * t))) return false; }
    return true;
  }
  // A* over the free cells, 8 ways, then pulled straight: a list of points from a to b
  const g = new Float32Array(nx * nz), from = new Int32Array(nx * nz), shut = new Uint8Array(nx * nz);
  function path(ax, az, bx, bz) {
    const [si, sk] = nearest(ax, az), [ti, tk] = nearest(bx, bz);
    const S = sk * nx + si, T = tk * nx + ti;
    g.fill(Infinity); from.fill(-1); shut.fill(0);
    const h = (c) => { const dx = Math.abs((c % nx) - ti), dz = Math.abs(Math.floor(c / nx) - tk); return Math.max(dx, dz) + 0.414 * Math.min(dx, dz); };
    const open = [S]; g[S] = 0; const f = new Map([[S, h(S)]]);
    let found = S === T;
    while (open.length && !found) {
      let bi = 0; for (let j = 1; j < open.length; j++) if (f.get(open[j]) < f.get(open[bi])) bi = j;
      const c = open[bi]; open[bi] = open[open.length - 1]; open.pop();
      if (c === T) { found = true; break; }
      shut[c] = 1; const ci = c % nx, ck = Math.floor(c / nx);
      for (let dk = -1; dk <= 1; dk++) for (let di = -1; di <= 1; di++) {
        if (!di && !dk) continue;
        const a = ci + di, b = ck + dk; if (!free(a, b) || (di && dk && (!free(ci + di, ck) || !free(ci, ck + dk)))) continue;
        const n = b * nx + a; if (shut[n]) continue;
        const ng = g[c] + (di && dk ? 1.414 : 1);
        if (ng < g[n]) { if (g[n] === Infinity) open.push(n); g[n] = ng; from[n] = c; f.set(n, ng + h(n)); }
      }
    }
    const cells = [];
    if (found) for (let c = T; c !== -1; c = from[c]) { cells.push(c); if (c === S) break; }
    else cells.push(T, S); // cut off: go straight, as before
    cells.reverse();
    const pts = cells.map((c) => centre(c % nx, Math.floor(c / nx)));
    pts[0] = new THREE.Vector2(ax, az); pts[pts.length - 1] = new THREE.Vector2(bx, bz);
    // string pulling: keep a corner only where he cannot see past it
    const out = [pts[0]]; let a = 0;
    while (a < pts.length - 1) {
      let b = pts.length - 1;
      while (b > a + 1 && !clear(pts[a].x, pts[a].y, pts[b].x, pts[b].y)) b--;
      out.push(pts[b]); a = b;
    }
    return out;
  }
  const groundAt = (x, z) => { const i = ix(x), k = iz(z); return i >= 0 && k >= 0 && i < nx && k < nz ? ground[k * nx + i] : 0; };
  const solidAt = (x, y, z) => {
    const i = ix(x), k = iz(z), L = Math.floor(y / layer);
    return i >= 0 && k >= 0 && i < nx && k < nz && L >= 0 && L < ny && solid[(L * nz + k) * nx + i] === 1;
  };
  // the top of what is under a point: a ray cast down once, the hit nearest to the height given
  // (a perch's real seat, so he neither floats over it nor sinks in)
  const ray = new THREE.Raycaster(), down = new THREE.Vector3(0, -1, 0), o = new THREE.Vector3();
  const surface = (x, y, z, reach = 0.08) => {
    ray.set(o.set(x, y + reach, z), down); ray.far = 2 * reach;
    const hit = ray.intersectObject(root, true).filter((h) => !h.object.userData.proxy && h.object.material?.visible !== false && h.object.visible
      && !(h.object.name === 'cat' || h.object.parent?.name === 'cat'))
      .sort((p, q) => Math.abs(p.point.y - y) - Math.abs(q.point.y - y))[0];
    return hit ? hit.point.y : null;
  };
  // the cells he can reach from a point: a flood fill over the free cells
  function region(x, z) {
    const seen = new Uint8Array(nx * nz), [i0, k0] = nearest(x, z), q = [k0 * nx + i0]; seen[q[0]] = 1;
    while (q.length) {
      const c = q.pop(), ci = c % nx, ck = Math.floor(c / nx);
      for (const [di, dk] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const a = ci + di, b = ck + dk; if (!free(a, b) || seen[b * nx + a]) continue;
        seen[b * nx + a] = 1; q.push(b * nx + a);
      }
    }
    return (px, pz) => { const i = ix(px), k = iz(pz); return i >= 0 && k >= 0 && i < nx && k < nz && seen[k * nx + i] === 1; };
  }
  return { box: [x0, z0, x0 + nx * cell, z0 + nz * cell], path, clear, region, free: (x, z) => free(ix(x), iz(z)), nearest: (x, z) => centre(...nearest(x, z)), groundAt, solidAt, surface, cell };
}

// A leap from a to b: a parabola, its top `lift` above the higher end. Does it clear the room?
export function arc(a, b, lift, u, out = new THREE.Vector3()) {
  out.lerpVectors(a, b, u);
  const peak = Math.max(a.y, b.y) + lift, mid = (a.y + b.y) / 2;
  out.y = a.y + (b.y - a.y) * u + 4 * (peak - mid) * u * (1 - u);
  return out;
}
export function leapClear(nav, a, b, lift) {
  const p = new THREE.Vector3(), dir = new THREE.Vector3(b.x - a.x, 0, b.z - a.z).setLength(0.16);
  for (let s = 2; s <= 22; s++) {
    const u = s / 24; arc(a, b, lift, u, p);
    // his back and his head, a hand above the line his feet draw
    if (nav.solidAt(p.x, p.y + 0.12, p.z) || nav.solidAt(p.x + dir.x, p.y + 0.14, p.z + dir.z) || nav.solidAt(p.x - dir.x, p.y + 0.1, p.z - dir.z)) return false;
  }
  return true;
}
