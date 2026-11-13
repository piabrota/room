import * as THREE from 'three';
import { asset } from './files.js';
import { strokeMesh } from './chart.js';

// ▲ grid: the tenth view (key 0). The camera lands on the chart on the
// right wall, and a map opens over the room: the Brazilian coast on a
// triangle mesh, its sea hour by hour for 24 h, and the temperature of its
// surface (OSTIA, Copernicus Marine), with particles flowing where the waves
// travel (docs/SURVEY.md, section 6; the files come from `just grid`).
//
// MapLibre loads only the first time the view opens. The map draws only
// what ships in public/grid/ (the land of Natural Earth), nothing from
// another host (invariant 1), and no text layer, so it needs no fonts.
// The mesh is a custom WebGL layer: one buffer of node positions, one of
// triangles, and two of Hs (this hour and the next) blended on the GPU by
// `uMix`, or the temperature, with the triangles' edges drawn thin on top:
// the view is about the grid. The flow is drawn last (`flowField`). Time is stepped by the room's clock (`update(dt)`), so
// `just record` films the same hours every run.

// the two layers of the sea: its height (Hs, m) and its temperature (°C), each with its ramp and the ticks of its legend
const LAYERS = {
  hs: { ramp: [[0, '#0b2a4a'], [0.5, '#155e8c'], [1, '#1f9bb8'], [1.75, '#79d0b0'], [2.5, '#f2d16b'], [3.5, '#f08a4b'], [5, '#d6333d']], ticks: [0, 1, 2, 3, 4, 5] },
  sst: { ramp: [[14, '#26185a'], [17, '#2c4f9e'], [20, '#2a98b4'], [23, '#7fcf9a'], [25.5, '#f0d468'], [28, '#ef8a4a'], [31, '#c22d3c']], ticks: [14, 18, 22, 26, 30] },
};

// The coast's mesh: enough for the chart on the wall. The 24 h of the sea (`frames`, most of the
// bytes) and its temperature load only when the map opens (`data`), so a visit that never opens
// the grid does not download them.
let meshPromise = null;
const LATER = { priority: 'low' }; // a hint: the furniture's files, asked for at the same moment, go first

const meshData = (files) => (meshPromise ??= Promise.all([
  fetch(asset(files.run), LATER).then((r) => (r.ok ? r.json() : Promise.reject(new Error('no run')))),
  fetch(asset(files.mesh), LATER).then((r) => r.arrayBuffer()),
]).then(([run, mesh]) => ({ run, n: run.nodes, lonlat: new Float32Array(mesh, 0, run.nodes * 2), tris: new Uint16Array(mesh, run.nodes * 8, run.triangles * 3) })));

async function load(files) {
  const [{ run, n, lonlat, tris }, frames] = await Promise.all([meshData(files), fetch(asset(files.frames)).then((r) => r.arrayBuffer())]);
  // the sea's temperature, when `just grid` could read it; a node without one takes its neighbours'
  let sst = null;
  if (run.sst && files.sst) {
    const raw = await fetch(asset(files.sst)).then((r) => (r.ok ? r.arrayBuffer() : null)).catch(() => null);
    if (raw) {
      const u = new Uint16Array(raw); sst = new Float32Array(n);
      for (let i = 0; i < n; i++) sst[i] = u[i] === run.sst.missing ? NaN : u[i] * run.sst.scale;
      for (let pass = 0; pass < 4; pass++) for (let t = 0; t < tris.length; t += 3) {
        const k = [tris[t], tris[t + 1], tris[t + 2]], ok = k.filter((i) => !Number.isNaN(sst[i]));
        if (ok.length && ok.length < 3) { const m = ok.reduce((a, i) => a + sst[i], 0) / ok.length; for (const i of k) if (Number.isNaN(sst[i])) sst[i] = m; }
      }
      for (let i = 0; i < n; i++) if (Number.isNaN(sst[i])) sst[i] = 0;
    }
  }
  return { run, n, lonlat, tris, frames: new Uint8Array(frames), sst };
}
let dataPromise = null;
const data = (files) => (dataPromise ??= load(files));

// The chart on the wall: the mesh itself, drawn on paper once its files load.
export function chartTexture(grid) {
  const W = 1024, H = 768, c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d'), tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const paper = () => {
    ctx.fillStyle = '#e9e2cf'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#2b3a4a'; ctx.lineWidth = 6; ctx.strokeRect(14, 14, W - 28, H - 28);
    ctx.fillStyle = '#1b2733'; ctx.font = '400 54px "Fjalla One", Impact, sans-serif'; ctx.fillText(grid.label, 44, 92);
    ctx.font = '400 22px "JetBrains Mono", monospace'; ctx.fillStyle = '#4a5866'; ctx.fillText(grid.hint, 46, 128);
  };
  paper(); tex.needsUpdate = true;
  // The mesh is drawn on the chart once the room is on screen: its 230 kB never stand between the
  // visitor and the room (on the grid's own name the map wants it first anyway). Its one long
  // stroke is made in a worker (src/chart.worker.js), so the room keeps moving meanwhile; a
  // browser with no canvas in a worker strokes it here, when it is idle, and so does `just record`
  // (`?record`), whose stills are the page's own strokes. `userData.drawn` resolves when the chart
  // has its mesh, or never will: the stills wait for it (`room.settled`).
  const recording = new URLSearchParams(location.search).has('record');
  const style = { color: 'rgba(21,94,140,0.55)', width: 0.6 };
  const counts = ({ n, tris }) => {
    ctx.font = '400 20px "JetBrains Mono", monospace'; ctx.fillStyle = '#4a5866';
    ctx.fillText(`${n} nodes`, 46, 190); ctx.fillText(`${tris.length / 3} triangles`, 46, 220);
    tex.needsUpdate = true;
  };
  const here = (d) => new Promise((done) => (recording ? done() : (self.requestIdleCallback ?? setTimeout)(done, { timeout: 3000 }))).then(() => { paper(); strokeMesh(ctx, { H, lonlat: d.lonlat, tris: d.tris, bbox: grid.bbox, style }); counts(d); });
  const away = (d) => new Promise((done, fail) => {
    if (recording || typeof OffscreenCanvas === 'undefined' || typeof Worker === 'undefined') { fail(new Error('no canvas in a worker')); return; }
    const worker = new Worker(new URL('./chart.worker.js', import.meta.url), { type: 'module' });
    const end = (fn, v) => { worker.terminate(); fn(v); };
    worker.onmessage = ({ data }) => (data.bitmap ? end(done, data.bitmap) : end(fail, new Error(data.error)));
    worker.onerror = (e) => { e.preventDefault?.(); end(fail, new Error('the chart worker failed')); };
    setTimeout(() => end(fail, new Error('the chart worker did not answer')), 20000); // a browser that takes the worker and never runs it
    worker.postMessage({ W, H, lonlat: d.lonlat.slice(), tris: d.tris.slice(), bbox: grid.bbox, style }); // copies: the map reads the same arrays
  }).then((bitmap) => { paper(); ctx.drawImage(bitmap, 0, 0); bitmap.close?.(); counts(d); });
  tex.userData.drawn = new Promise((done) => addEventListener('room:shown', done, { once: true })).then(() => meshData(grid.files))
    .then((d) => away(d).catch(() => here(d))).catch(() => {});
  return tex;
}

// A colour ramp as GLSL: a value to a colour.
const rampGLSL = (name, ramp) => {
  const c = (hex) => new THREE.Color(hex).convertSRGBToLinear();
  let s = `vec3 ${name}(float h) { vec3 col = vec3(${c(ramp[0][1]).toArray().map((v) => v.toFixed(4))});\n`;
  for (let i = 1; i < ramp.length; i++) {
    const [h0] = ramp[i - 1], [h1, hex] = ramp[i];
    s += `  col = mix(col, vec3(${c(hex).toArray().map((v) => v.toFixed(4))}), smoothstep(${h0.toFixed(2)}, ${h1.toFixed(2)}, h));\n`;
  }
  return s + '  return pow(col, vec3(1.0 / 2.2)); }\n';
};

const mercX = (lon) => (lon + 180) / 360;
const mercY = (lat) => (180 - (180 / Math.PI) * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))) / 360;

// The flow: particles carried along the direction the waves travel, each
// leaving a trail that fades, in the manner of the wind maps. The sea of this
// run is a fully developed sea raised by the wind, so it travels with the wind,
// at its group speed: the peak period of Pierson–Moskowitz is 2πU / (0.877 g),
// and in deep water cg = gT / 4π, about 0.57 U. A particle that reaches the
// coast breaks there and is born again elsewhere. It moves in fixed steps of
// 1/30 s of the room's clock and draws from a seeded generator, so `just record`
// films the same flow every run.
function flowField(d, cfg) {
  const { n, lonlat, tris, frames, run } = d;
  const [W, S, E, N] = run.bbox, R = 0.1; // a lookup raster of 0.1°: which triangle holds each cell
  const nx = Math.ceil((E - W) / R), ny = Math.ceil((N - S) / R), cell = new Int32Array(nx * ny).fill(-1);
  for (let t = 0; t < tris.length; t += 3) {
    const a = tris[t], b = tris[t + 1], c = tris[t + 2];
    const ax = lonlat[a * 2], ay = lonlat[a * 2 + 1], bx = lonlat[b * 2], by = lonlat[b * 2 + 1], cx = lonlat[c * 2], cy = lonlat[c * 2 + 1];
    const i0 = Math.max(0, Math.floor((Math.min(ax, bx, cx) - W) / R)), i1 = Math.min(nx - 1, Math.floor((Math.max(ax, bx, cx) - W) / R));
    const j0 = Math.max(0, Math.floor((Math.min(ay, by, cy) - S) / R)), j1 = Math.min(ny - 1, Math.floor((Math.max(ay, by, cy) - S) / R));
    const den = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy);
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const x = W + (i + 0.5) * R, y = S + (j + 0.5) * R;
      const l1 = ((by - cy) * (x - cx) + (cx - bx) * (y - cy)) / den, l2 = ((cy - ay) * (x - cx) + (ax - cx) * (y - cy)) / den;
      if (l1 >= -1e-6 && l2 >= -1e-6 && 1 - l1 - l2 >= -1e-6) cell[j * nx + i] = t;
    }
  }
  // the velocity of the waves at each node, for an hour: towards where the wind blows, at cg
  const uvOf = (h) => {
    const f = new Float32Array(n * 2), o = h * n * 3;
    for (let i = 0; i < n; i++) {
      const cg = 0.57 * frames[o + n + i] * run.scales.speed, from = (frames[o + 2 * n + i] * run.scales.dir * Math.PI) / 180;
      f[i * 2] = -Math.sin(from) * cg; f[i * 2 + 1] = -Math.cos(from) * cg;
    }
    return f;
  };
  let hourA = -1, hourB = -1, uvA, uvB;
  const out = [0, 0];
  // the velocity at a point and a time, m/s east and north; false over land or off the mesh
  function velocity(x, y, mix) {
    const i = Math.floor((x - W) / R), j = Math.floor((y - S) / R);
    if (i < 0 || j < 0 || i >= nx || j >= ny) return false;
    const t = cell[j * nx + i]; if (t < 0) return false;
    const a = tris[t], b = tris[t + 1], c = tris[t + 2];
    const ax = lonlat[a * 2], ay = lonlat[a * 2 + 1], bx = lonlat[b * 2], by = lonlat[b * 2 + 1], cx = lonlat[c * 2], cy = lonlat[c * 2 + 1];
    const den = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy);
    const l1 = ((by - cy) * (x - cx) + (cx - bx) * (y - cy)) / den, l2 = ((cy - ay) * (x - cx) + (ax - cx) * (y - cy)) / den, l3 = 1 - l1 - l2;
    for (let k = 0; k < 2; k++) {
      const va = uvA[a * 2 + k] * l1 + uvA[b * 2 + k] * l2 + uvA[c * 2 + k] * l3, vb = uvB[a * 2 + k] * l1 + uvB[b * 2 + k] * l2 + uvB[c * 2 + k] * l3;
      out[k] = va + (vb - va) * mix;
    }
    return true;
  }
  let seed = 0x9e3779b9;
  const rand = () => { seed = (seed + 0x6d2b79f5) | 0; let z = Math.imul(seed ^ (seed >>> 15), 1 | seed); z ^= z + Math.imul(z ^ (z >>> 7), 61 | z); return ((z ^ (z >>> 14)) >>> 0) / 4294967296; };
  const P = cfg.particles, L = cfg.trail, STEP = 1 / 30;
  const px = new Float32Array(P), py = new Float32Array(P), age = new Float32Array(P), life = new Float32Array(P), sp = new Float32Array(P);
  const hist = new Float32Array(P * L * 2); // the trail in Mercator, a ring of L points per particle
  let head = 0, acc = 0;
  const born = (p) => {
    for (let tries = 0; tries < 30; tries++) {
      const x = W + rand() * (E - W), y = S + rand() * (N - S);
      const i = Math.floor((x - W) / R), j = Math.floor((y - S) / R);
      if (cell[j * nx + i] < 0) continue;
      px[p] = x; py[p] = y; break;
    }
    age[p] = 0; life[p] = cfg.life[0] + rand() * (cfg.life[1] - cfg.life[0]); sp[p] = 0;
    const mx = mercX(px[p]), my = mercY(py[p]);
    for (let k = 0; k < L; k++) { hist[(p * L + k) * 2] = mx; hist[(p * L + k) * 2 + 1] = my; }
  };
  const hours = (t) => {
    const F = run.hours.length, a = Math.min(F - 1, Math.floor(t)), b = Math.min(F - 1, a + 1);
    if (a !== hourA) { uvA = a === hourB ? uvB : uvOf(a); hourA = a; }
    if (b !== hourB) { uvB = uvOf(b); hourB = b; }
    return t - a;
  };
  hours(0);
  for (let p = 0; p < P; p++) { born(p); age[p] = rand() * life[p]; } // born at all ages, so the flow does not pulse
  function step(t, k) {
    const mix = hours(t);
    head = (head + 1) % L;
    for (let p = 0; p < P; p++) {
      age[p] += STEP;
      if (age[p] > life[p] || !velocity(px[p], py[p], mix)) { born(p); continue; }
      const [u, v] = out;
      px[p] += (u * k * STEP) / Math.cos((py[p] * Math.PI) / 180); py[p] += v * k * STEP; sp[p] = Math.hypot(u, v);
      hist[(p * L + head) * 2] = mercX(px[p]); hist[(p * L + head) * 2 + 1] = mercY(py[p]);
    }
  }
  const verts = new Float32Array(P * (L - 1) * 2 * 3);
  return {
    // advance by dt seconds of the room's clock, at time t (hours of the run); k is degrees a second per m/s
    update(dt, t, k) { acc = Math.min(acc + dt, 4 * STEP); while (acc >= STEP) { acc -= STEP; step(t, k); } },
    prime(t, k) { for (let s = 0; s < L; s++) step(t, k); },
    // the trails as line segments: x, y (Mercator) and alpha, two vertices each
    vertices() {
      let o = 0;
      for (let p = 0; p < P; p++) {
        const fade = 0.8 * Math.min(1, age[p] / 0.4, (life[p] - age[p]) / 0.6) * Math.min(1, 0.35 + sp[p] / 6);
        for (let s = 0; s < L - 1; s++) {
          const q0 = (p * L + ((head - s + L) % L)) * 2, q1 = (p * L + ((head - s - 1 + L) % L)) * 2, a = fade * (1 - s / (L - 1));
          verts[o++] = hist[q0]; verts[o++] = hist[q0 + 1]; verts[o++] = a;
          verts[o++] = hist[q1]; verts[o++] = hist[q1 + 1]; verts[o++] = a * (1 - 1 / (L - 1));
        }
      }
      return verts;
    },
    count: P * (L - 1) * 2,
  };
}

function meshLayer(maplibregl, d, state, flow) {
  const { n, lonlat, tris, frames } = d;
  let gl, prog, lineProg, flowProg, pos, idx, edges, edgeCount, hsA, hsB, sstBuf, flowBuf, shownA = -1, shownB = -1;
  const hsOf = (h) => { const f = new Float32Array(n), o = h * n * 3; for (let i = 0; i < n; i++) f[i] = frames[o + i] * d.run.scales.hs; return f; };
  const merc = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) { const m = maplibregl.MercatorCoordinate.fromLngLat([lonlat[i * 2], lonlat[i * 2 + 1]]); merc[i * 2] = m.x; merc[i * 2 + 1] = m.y; }
  const compile = (vs, fs) => {
    const p = gl.createProgram();
    for (const [type, src] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]]) {
      const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      gl.attachShader(p, s);
    }
    gl.linkProgram(p); return p;
  };
  return {
    id: 'grid-mesh', type: 'custom', renderingMode: '2d',
    onAdd(_map, context) {
      gl = context;
      prog = compile(
        'uniform mat4 uMatrix; uniform float uMix; attribute vec2 aPos; attribute float aA; attribute float aB; attribute float aT; varying float vH; varying float vT; void main() { vH = mix(aA, aB, uMix); vT = aT; gl_Position = uMatrix * vec4(aPos, 0.0, 1.0); }',
        `precision mediump float; uniform float uMode; varying float vH; varying float vT;\n${rampGLSL('rampHs', LAYERS.hs.ramp)}${rampGLSL('rampSst', LAYERS.sst.ramp)} void main() { gl_FragColor = vec4(uMode > 0.5 ? rampSst(vT) : rampHs(vH), 0.86); }`);
      lineProg = compile(
        'uniform mat4 uMatrix; attribute vec2 aPos; void main() { gl_Position = uMatrix * vec4(aPos, 0.0, 1.0); }',
        'precision mediump float; uniform vec4 uColor; void main() { gl_FragColor = uColor; }');
      flowProg = compile(
        'uniform mat4 uMatrix; attribute vec2 aPos; attribute float aAlpha; varying float vA; void main() { vA = aAlpha; gl_Position = uMatrix * vec4(aPos, 0.0, 1.0); }',
        'precision mediump float; uniform vec3 uColor; varying float vA; void main() { gl_FragColor = vec4(uColor, vA); }');
      pos = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, pos); gl.bufferData(gl.ARRAY_BUFFER, merc, gl.STATIC_DRAW);
      idx = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idx); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, tris, gl.STATIC_DRAW);
      const seen = new Set(), e = [];
      for (let t = 0; t < tris.length; t += 3) for (const [a, b] of [[tris[t], tris[t + 1]], [tris[t + 1], tris[t + 2]], [tris[t + 2], tris[t]]]) {
        const k = a < b ? a * 65536 + b : b * 65536 + a; if (!seen.has(k)) { seen.add(k); e.push(a, b); }
      }
      edges = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, edges); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(e), gl.STATIC_DRAW); edgeCount = e.length;
      hsA = gl.createBuffer(); hsB = gl.createBuffer(); flowBuf = gl.createBuffer();
      sstBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, sstBuf); gl.bufferData(gl.ARRAY_BUFFER, d.sst ?? new Float32Array(n), gl.STATIC_DRAW);
    },
    render(_gl, matrix) {
      const F = d.run.hours.length, a = Math.min(F - 1, Math.floor(state.t)), b = Math.min(F - 1, a + 1);
      if (a !== shownA) { gl.bindBuffer(gl.ARRAY_BUFFER, hsA); gl.bufferData(gl.ARRAY_BUFFER, hsOf(a), gl.DYNAMIC_DRAW); shownA = a; }
      if (b !== shownB) { gl.bindBuffer(gl.ARRAY_BUFFER, hsB); gl.bufferData(gl.ARRAY_BUFFER, hsOf(b), gl.DYNAMIC_DRAW); shownB = b; }
      const m = new Float32Array(matrix);
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      const bind = (p, name, buf, size, stride = 0, offset = 0) => { const l = gl.getAttribLocation(p, name); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, size, gl.FLOAT, false, stride, offset); return l; };
      // the sea, by triangle: its height or its temperature
      gl.useProgram(prog);
      gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'uMatrix'), false, m);
      gl.uniform1f(gl.getUniformLocation(prog, 'uMix'), state.t - a);
      gl.uniform1f(gl.getUniformLocation(prog, 'uMode'), state.layer === 'sst' ? 1 : 0);
      const l1 = bind(prog, 'aPos', pos, 2), l2 = bind(prog, 'aA', hsA, 1), l3 = bind(prog, 'aB', hsB, 1), l5 = bind(prog, 'aT', sstBuf, 1);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idx); gl.drawElements(gl.TRIANGLES, tris.length, gl.UNSIGNED_SHORT, 0);
      for (const l of [l1, l2, l3, l5]) gl.disableVertexAttribArray(l);
      // the edges of the triangles
      gl.useProgram(lineProg);
      gl.uniformMatrix4fv(gl.getUniformLocation(lineProg, 'uMatrix'), false, m);
      gl.uniform4f(gl.getUniformLocation(lineProg, 'uColor'), 1, 1, 1, 0.12);
      const l4 = bind(lineProg, 'aPos', pos, 2);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, edges); gl.drawElements(gl.LINES, edgeCount, gl.UNSIGNED_SHORT, 0);
      gl.disableVertexAttribArray(l4);
      // the flow, on top
      gl.useProgram(flowProg);
      gl.uniformMatrix4fv(gl.getUniformLocation(flowProg, 'uMatrix'), false, m);
      gl.uniform3f(gl.getUniformLocation(flowProg, 'uColor'), 1, 0.98, 0.94);
      gl.bindBuffer(gl.ARRAY_BUFFER, flowBuf); gl.bufferData(gl.ARRAY_BUFFER, flow.vertices(), gl.STREAM_DRAW);
      const f1 = bind(flowProg, 'aPos', flowBuf, 2, 12, 0), f2 = bind(flowProg, 'aAlpha', flowBuf, 1, 12, 8);
      gl.drawArrays(gl.LINES, 0, flow.count);
      gl.disableVertexAttribArray(f1); gl.disableVertexAttribArray(f2);
    },
  };
}

export function createGrid(grid, { still = false } = {}) {
  const w = grid.words;
  const el = document.createElement('section'); el.id = 'grid'; el.hidden = true; el.setAttribute('aria-label', grid.label);
  const mapEl = document.createElement('div'); mapEl.className = 'map';
  const panel = document.createElement('div'); panel.className = 'panel';
  // the head: the title, then two small buttons: fold the panel, and the whole screen
  const head = document.createElement('div'); head.className = 'head';
  const title = document.createElement('h2'); title.textContent = grid.title;
  const fold = document.createElement('button'); fold.className = 'fold';
  const full = document.createElement('button'); full.className = 'full'; full.textContent = '⛶'; full.title = w.full; full.setAttribute('aria-label', w.full);
  if (!document.fullscreenEnabled) full.hidden = true; // an iPhone has no fullscreen for a page
  head.append(title, fold, full);
  const time = document.createElement('p'); time.className = 'time'; time.textContent = w.loading;
  const row = document.createElement('div'); row.className = 'row';
  const play = document.createElement('button'); play.textContent = w.pause;
  const slider = document.createElement('input'); slider.type = 'range'; slider.min = '0'; slider.step = '0.01'; slider.value = '0'; slider.setAttribute('aria-label', 'hour');
  row.append(play, slider);
  // the layer: the sea's height or its temperature (when `just grid` could read it)
  const layers = document.createElement('div'); layers.className = 'row layers'; layers.setAttribute('role', 'group');
  const pick = {};
  for (const name of ['hs', 'sst']) {
    const b = document.createElement('button'); b.textContent = name === 'hs' ? w.hs : w.sst; b.onclick = () => setLayer(name);
    pick[name] = b; layers.append(b);
  }
  // the views: a button for each of `grid.presets`, which moves the map to its bounds
  const views = document.createElement('div'); views.className = 'row views'; views.setAttribute('role', 'group'); views.setAttribute('aria-label', w.presets);
  const view = {};
  for (const p of grid.presets) {
    const b = document.createElement('button'); b.textContent = p.label; b.title = p.hint; b.dataset.view = p.id; b.disabled = true; b.onclick = () => setView(p.id);
    view[p.id] = b; views.append(b);
  }
  const layerLabel = document.createElement('p'); layerLabel.className = 'dim';
  const legend = document.createElement('div'); legend.className = 'legend';
  const scale = document.createElement('div'); scale.className = 'scale';
  const flowLabel = document.createElement('p'); flowLabel.className = 'dim flow'; flowLabel.textContent = w.flow;
  const credit = document.createElement('p'); credit.className = 'dim more'; credit.textContent = grid.credit;
  const note = document.createElement('p'); note.className = 'dim more'; note.textContent = grid.note;
  const sources = document.createElement('p'); sources.className = 'dim more'; sources.textContent = grid.sources;
  const back = document.createElement('button'); back.className = 'back'; back.textContent = `Esc · ${w.back}`;
  row.classList.add('more'); layerLabel.classList.add('more'); flowLabel.classList.add('more');
  panel.append(head, time, row, layers, views, layerLabel, legend, scale, flowLabel, credit, note, sources, back);
  const tip = document.createElement('div'); tip.className = 'tip';
  el.append(mapEl, panel, tip);
  document.body.append(el);

  const state = { t: 0, playing: !still, open: false, map: null, d: null, layer: 'hs', flow: null, zoom0: 0 };
  let onBack = () => {};
  back.onclick = () => onBack();
  play.onclick = () => { state.playing = !state.playing; play.textContent = state.playing ? w.pause : w.play; };
  slider.oninput = () => { state.t = Number(slider.value); state.playing = false; play.textContent = w.play; showTime(); state.map?.triggerRepaint(); };
  play.textContent = state.playing ? w.pause : w.play;

  // the map takes the whole window: the panel starts folded to the title, the time, the layer
  // and its legend; the room's signature and switches step aside while it is open (style.css)
  function setFolded(on) {
    panel.classList.toggle('folded', on);
    fold.textContent = on ? '+' : '−'; fold.title = on ? w.unfold : w.fold; fold.setAttribute('aria-label', fold.title);
    fold.setAttribute('aria-expanded', String(!on));
  }
  setFolded(true);
  fold.onclick = () => setFolded(!panel.classList.contains('folded'));
  full.onclick = () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()).catch(() => {});
  document.addEventListener('fullscreenchange', () => { full.setAttribute('aria-pressed', String(!!document.fullscreenElement)); state.map?.resize(); });

  function setLayer(name) {
    if (name === 'sst' && !state.d?.sst) name = 'hs';
    state.layer = name;
    for (const [k, b] of Object.entries(pick)) b.setAttribute('aria-pressed', String(k === name));
    const { ramp, ticks } = LAYERS[name], lo = ramp[0][0], hi = ramp.at(-1)[0];
    legend.style.background = `linear-gradient(90deg, ${ramp.map(([v, c]) => `${c} ${((v - lo) / (hi - lo)) * 100}%`).join(', ')})`;
    scale.replaceChildren(...ticks.map((v) => { const t = document.createElement('span'); t.textContent = String(v); return t; }));
    layerLabel.textContent = name === 'sst' ? `${w.sstLong}, ${w.c} · ${w.sstDay} ${state.d.run.sst.date}` : `${w.hsLong}, ${w.m}`;
    state.map?.triggerRepaint();
  }
  setLayer('hs');

  // a view moves the map to its bounds, eased; under reduced motion it jumps. The mark is on the
  // view that was picked, and a drag or a zoom by the visitor (a move with an `originalEvent`) clears it.
  function markView(id) { for (const [k, b] of Object.entries(view)) b.setAttribute('aria-pressed', String(k === id)); }
  function setView(id) {
    const p = grid.presets.find((x) => x.id === id);
    if (!p || !state.map) return;
    markView(id);
    state.map.fitBounds(p.bounds, { padding: fitPadding(), duration: still ? 0 : 1400 });
  }
  markView(grid.presets[0].id); // it opens on the whole domain

  const fmt = (iso) => `${iso.replace('T', ' ')} UTC`;
  function showTime() {
    if (!state.d) return;
    const hours = state.d.run.hours, h = Math.min(hours.length - 1, Math.round(state.t));
    time.textContent = `+${h} h · ${fmt(hours[h])}`;
    slider.value = String(state.t);
  }

  // what the map keeps clear when it fits the domain: the panel beside it (or under it, on a
  // phone) and the shot buttons at the bottom
  function fitPadding() {
    const p = panel.getBoundingClientRect(), shots = document.getElementById('shots')?.getBoundingClientRect();
    const bottom = shots ? Math.max(12, innerHeight - shots.top + 8) : 12;
    if (innerWidth > 600) return { top: 12, bottom, left: 12, right: Math.min(innerWidth / 2, innerWidth - p.left + 12) };
    return { top: 12, bottom: Math.max(bottom, innerHeight - p.top + 8), left: 12, right: 12 };
  }

  async function build() {
    const [{ default: maplibregl }, d] = await Promise.all([import('maplibre-gl'), data(grid.files), import('maplibre-gl/dist/maplibre-gl.css')]);
    state.d = d; slider.max = String(d.run.hours.length - 1);
    pick.sst.disabled = !d.sst; if (!d.sst) pick.sst.title = w.noSst;
    for (const b of Object.values(view)) b.disabled = false;
    state.flow = flowField(d, grid.flow);
    const [W, S, E, N] = grid.bbox;
    const map = new maplibregl.Map({
      container: mapEl, attributionControl: false, // the sources are in the panel, and folded in the corner
      // the coast from the top of the window to the bottom, beside the folded panel and above the shots
      bounds: [[W, S], [E, N]], fitBoundsOptions: { padding: fitPadding() }, maxBounds: [[W - 45, S - 30], [E + 45, N + 30]],
      renderWorldCopies: false, dragRotate: false, pitchWithRotate: false, fadeDuration: 0,
      style: {
        version: 8,
        sources: { land: { type: 'geojson', data: asset(grid.files.land) } },
        layers: [
          { id: 'sea', type: 'background', paint: { 'background-color': '#08131f' } },
          { id: 'land', type: 'fill', source: 'land', paint: { 'fill-color': '#1d2029' } },
          { id: 'coast', type: 'line', source: 'land', paint: { 'line-color': '#3a4252', 'line-width': 1 } },
        ],
      },
    });
    map.touchZoomRotate.disableRotation();
    // the sources, folded into an ⓘ in the corner (the whole text is in the open panel too)
    map.addControl(new maplibregl.AttributionControl({ compact: true, customAttribution: grid.sources }), 'top-left');
    map.once('load', () => el.querySelector('.maplibregl-ctrl-attrib')?.classList.remove('maplibregl-compact-show'));
    state.zoom0 = map.getZoom();
    for (const type of ['move', 'zoom']) map.on(type, (e) => { if (e.originalEvent) markView(null); }); // a move of the visitor (a drag, a wheel, a pinch) carries its event; fitBounds does not
    if (still) state.flow.prime(state.t, grid.flow.speed); // under reduced motion the trails stand still
    map.on('load', () => { map.addLayer(meshLayer(maplibregl, d, state, state.flow)); map.once('idle', () => { state.ready = true; }); });
    for (const [name, lon, lat] of grid.places) {
      const m = document.createElement('div'); m.className = 'place'; m.textContent = name;
      new maplibregl.Marker({ element: m, anchor: 'left' }).setLngLat([lon, lat]).addTo(map);
    }
    // hover: the nearest node, from buckets of half a degree
    const buckets = new Map(), key = (x, y) => `${Math.floor(x * 2)},${Math.floor(y * 2)}`;
    for (let i = 0; i < d.n; i++) { const k = key(d.lonlat[i * 2], d.lonlat[i * 2 + 1]); if (!buckets.has(k)) buckets.set(k, []); buckets.get(k).push(i); }
    map.on('mousemove', (e) => {
      const { lng, lat } = e.lngLat; let best = -1, bd = Infinity;
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (const k of buckets.get(`${Math.floor(lng * 2) + i},${Math.floor(lat * 2) + j}`) ?? []) {
        const dd = (d.lonlat[k * 2] - lng) ** 2 + (d.lonlat[k * 2 + 1] - lat) ** 2; if (dd < bd) { bd = dd; best = k; }
      }
      if (best < 0) { tip.classList.remove('on'); return; }
      const h = Math.min(d.run.hours.length - 1, Math.round(state.t)), o = h * d.n * 3, sc = d.run.scales;
      const hs = (d.frames[o + best] * sc.hs).toFixed(2), sp = (d.frames[o + d.n + best] * sc.speed).toFixed(1), from = Math.round(d.frames[o + 2 * d.n + best] * sc.dir);
      const temp = d.sst ? ` · ${w.sst} ${d.sst[best].toFixed(1)} ${w.c}` : '';
      tip.textContent = `${w.node} ${best} · ${d.lonlat[best * 2 + 1].toFixed(2)}°, ${d.lonlat[best * 2].toFixed(2)}°\n${w.hs} ${hs} ${w.m}${temp}\n${w.wind} ${sp} ${w.ms} ${w.from} ${from}° · ${w.toward} ${(from + 180) % 360}°`;
      tip.style.transform = `translate(${e.point.x + 14}px, ${e.point.y + 14}px)`; tip.classList.add('on');
    });
    map.on('mouseout', () => tip.classList.remove('on'));
    state.map = map; showTime();
  }

  let warmed = false;
  return {
    get open() { return state.open; },
    get ready() { return !!state.ready; }, // the map and the mesh are drawn (`just record` waits for it)
    // fully shown: the room behind can stop drawing
    get covering() { return state.open && el.classList.contains('on'); },
    onBack(fn) { onBack = fn; },
    // the map's code and its files, asked for ahead of the click that needs them (a pointer on the
    // shot's button, src/app.js): the camera's move to the chart then ends on a map that is there
    warm() { if (!state.map && !warmed) { warmed = true; Promise.all([import('maplibre-gl'), data(grid.files), import('maplibre-gl/dist/maplibre-gl.css')]).catch(() => { warmed = false; }); } },
    async show() {
      if (state.open) return;
      state.open = true; el.hidden = false; document.body.classList.add('gridding');
      requestAnimationFrame(() => el.classList.add('on'));
      try { if (!state.map) await build(); else state.map.resize(); } catch { time.textContent = w.missing; }
    },
    hide() {
      if (!state.open) return;
      state.open = false; el.classList.remove('on'); tip.classList.remove('on'); document.body.classList.remove('gridding');
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      setTimeout(() => { if (!state.open) el.hidden = true; }, 400);
    },
    update(dt) {
      if (!state.open || !state.d) return;
      if (state.playing) { state.t = (state.t + dt * 3) % (state.d.run.hours.length - 1); showTime(); } // three hours a second
      // the flow keeps the same speed on the screen at every zoom
      if (state.flow && !still && state.map) state.flow.update(dt, state.t, grid.flow.speed * 2 ** (state.zoom0 - state.map.getZoom()));
      state.map?.triggerRepaint();
    },
  };
}
