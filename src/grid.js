import * as THREE from 'three';

// ▲ grid: the tenth view (key 0). The camera lands on the chart on the
// right wall, and a map opens over the room: the Brazilian coast on a
// triangle mesh, its sea and wind hour by hour for 24 h
// (docs/SURVEY.md, section 6; the files come from `just grid`).
//
// MapLibre loads only the first time the view opens. The map draws only
// what ships in public/grid/ (the land of Natural Earth), nothing from
// another host (invariant 1), and no text layer, so it needs no fonts.
// The mesh is a custom WebGL layer: one buffer of node positions, one of
// triangles, and two of Hs (this hour and the next) blended on the GPU by
// `uMix`, with the triangles' edges drawn thin on top: the view is about
// the grid. Time is stepped by the room's clock (`update(dt)`), so
// `just record` films the same hours every run.

const RAMP = [[0, '#0b2a4a'], [0.5, '#155e8c'], [1, '#1f9bb8'], [1.75, '#79d0b0'], [2.5, '#f2d16b'], [3.5, '#f08a4b'], [5, '#d6333d']]; // Hs, m
const TOP = RAMP.at(-1)[0];

async function load(files) {
  const [run, mesh, frames] = await Promise.all([
    fetch(files.run).then((r) => (r.ok ? r.json() : Promise.reject(new Error('no run')))),
    fetch(files.mesh).then((r) => r.arrayBuffer()),
    fetch(files.frames).then((r) => r.arrayBuffer()),
  ]);
  const n = run.nodes;
  return { run, n, lonlat: new Float32Array(mesh, 0, n * 2), tris: new Uint16Array(mesh, n * 8, run.triangles * 3), frames: new Uint8Array(frames) };
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
  data(grid.files).then(({ n, lonlat, tris }) => {
    const [w, s, e, nn] = grid.bbox, x0 = 440, y0 = 160, h = H - 200, sc = h / (nn - s);
    const px = (i) => x0 + (lonlat[i * 2] - w) * sc * Math.cos(-15 * Math.PI / 180), py = (i) => y0 + (nn - lonlat[i * 2 + 1]) * sc;
    paper();
    ctx.strokeStyle = 'rgba(21,94,140,0.55)'; ctx.lineWidth = 0.6; ctx.beginPath();
    for (let t = 0; t < tris.length; t += 3) {
      const [a, b, c2] = [tris[t], tris[t + 1], tris[t + 2]];
      ctx.moveTo(px(a), py(a)); ctx.lineTo(px(b), py(b)); ctx.lineTo(px(c2), py(c2)); ctx.closePath();
    }
    ctx.stroke();
    ctx.font = '400 20px "JetBrains Mono", monospace'; ctx.fillStyle = '#4a5866';
    ctx.fillText(`${n} nodes`, 46, 190); ctx.fillText(`${tris.length / 3} triangles`, 46, 220);
    tex.needsUpdate = true;
  }).catch(() => {});
  return tex;
}

// The colour ramp as GLSL: Hs in metres to a colour.
const rampGLSL = () => {
  const c = (hex) => new THREE.Color(hex).convertSRGBToLinear();
  let s = `vec3 ramp(float h) { vec3 col = vec3(${c(RAMP[0][1]).toArray().map((v) => v.toFixed(4))});\n`;
  for (let i = 1; i < RAMP.length; i++) {
    const [h0] = RAMP[i - 1], [h1, hex] = RAMP[i];
    s += `  col = mix(col, vec3(${c(hex).toArray().map((v) => v.toFixed(4))}), smoothstep(${h0.toFixed(2)}, ${h1.toFixed(2)}, h));\n`;
  }
  return s + '  return pow(col, vec3(1.0 / 2.2)); }';
};

function meshLayer(maplibregl, d, state) {
  const { n, lonlat, tris, frames } = d;
  let gl, prog, lineProg, pos, idx, edges, edgeCount, hsA, hsB, wind, windCount, shownA = -1, shownB = -1, windHour = -1;
  const hsOf = (h) => { const f = new Float32Array(n), o = h * n * 3; for (let i = 0; i < n; i++) f[i] = frames[o + i] * d.run.scales.hs; return f; };
  // wind ticks at every 7th node: a short line downwind, its length the speed
  const ticks = []; for (let i = 0; i < n; i += 7) ticks.push(i);
  const merc = lonlat.length ? new Float32Array(n * 2) : null;
  for (let i = 0; i < n; i++) { const m = maplibregl.MercatorCoordinate.fromLngLat([lonlat[i * 2], lonlat[i * 2 + 1]]); merc[i * 2] = m.x; merc[i * 2 + 1] = m.y; }
  const windBuffer = (h) => {
    const out = new Float32Array(ticks.length * 4), o = h * n * 3, k = 0.0001; // 4 km of map a metre per second
    ticks.forEach((i, j) => {
      const sp = frames[o + n + i] * d.run.scales.speed, from = frames[o + 2 * n + i] * d.run.scales.dir * Math.PI / 180;
      const dx = -Math.sin(from) * sp * k, dy = Math.cos(from) * sp * k; // towards; mercator y grows south
      out.set([merc[i * 2], merc[i * 2 + 1], merc[i * 2] + dx, merc[i * 2 + 1] + dy], j * 4);
    });
    return out;
  };
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
        'uniform mat4 uMatrix; uniform float uMix; attribute vec2 aPos; attribute float aA; attribute float aB; varying float vH; void main() { vH = mix(aA, aB, uMix); gl_Position = uMatrix * vec4(aPos, 0.0, 1.0); }',
        `precision mediump float; varying float vH; ${rampGLSL()} void main() { gl_FragColor = vec4(ramp(vH), 0.86); }`);
      lineProg = compile(
        'uniform mat4 uMatrix; attribute vec2 aPos; void main() { gl_Position = uMatrix * vec4(aPos, 0.0, 1.0); }',
        'precision mediump float; uniform vec4 uColor; void main() { gl_FragColor = uColor; }');
      pos = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, pos); gl.bufferData(gl.ARRAY_BUFFER, merc, gl.STATIC_DRAW);
      idx = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idx); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, tris, gl.STATIC_DRAW);
      const seen = new Set(), e = [];
      for (let t = 0; t < tris.length; t += 3) for (const [a, b] of [[tris[t], tris[t + 1]], [tris[t + 1], tris[t + 2]], [tris[t + 2], tris[t]]]) {
        const k = a < b ? a * 65536 + b : b * 65536 + a; if (!seen.has(k)) { seen.add(k); e.push(a, b); }
      }
      edges = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, edges); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(e), gl.STATIC_DRAW); edgeCount = e.length;
      hsA = gl.createBuffer(); hsB = gl.createBuffer(); wind = gl.createBuffer(); windCount = ticks.length * 2;
    },
    render(_gl, matrix) {
      const F = d.run.hours.length, a = Math.min(F - 1, Math.floor(state.t)), b = Math.min(F - 1, a + 1);
      if (a !== shownA) { gl.bindBuffer(gl.ARRAY_BUFFER, hsA); gl.bufferData(gl.ARRAY_BUFFER, hsOf(a), gl.DYNAMIC_DRAW); shownA = a; }
      if (b !== shownB) { gl.bindBuffer(gl.ARRAY_BUFFER, hsB); gl.bufferData(gl.ARRAY_BUFFER, hsOf(b), gl.DYNAMIC_DRAW); shownB = b; }
      const hour = Math.round(state.t);
      if (hour !== windHour) { gl.bindBuffer(gl.ARRAY_BUFFER, wind); gl.bufferData(gl.ARRAY_BUFFER, windBuffer(Math.min(F - 1, hour)), gl.DYNAMIC_DRAW); windHour = hour; }
      const m = new Float32Array(matrix);
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      // the sea, by triangle
      gl.useProgram(prog);
      gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'uMatrix'), false, m);
      gl.uniform1f(gl.getUniformLocation(prog, 'uMix'), state.t - a);
      const bind = (p, name, buf, size) => { const l = gl.getAttribLocation(p, name); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, size, gl.FLOAT, false, 0, 0); return l; };
      const l1 = bind(prog, 'aPos', pos, 2), l2 = bind(prog, 'aA', hsA, 1), l3 = bind(prog, 'aB', hsB, 1);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idx); gl.drawElements(gl.TRIANGLES, tris.length, gl.UNSIGNED_SHORT, 0);
      gl.disableVertexAttribArray(l2); gl.disableVertexAttribArray(l3);
      // the edges of the triangles, then the wind
      gl.useProgram(lineProg);
      gl.uniformMatrix4fv(gl.getUniformLocation(lineProg, 'uMatrix'), false, m);
      gl.uniform4f(gl.getUniformLocation(lineProg, 'uColor'), 1, 1, 1, 0.16);
      const l4 = bind(lineProg, 'aPos', pos, 2);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, edges); gl.drawElements(gl.LINES, edgeCount, gl.UNSIGNED_SHORT, 0);
      gl.uniform4f(gl.getUniformLocation(lineProg, 'uColor'), 1, 0.97, 0.9, 0.7);
      bind(lineProg, 'aPos', wind, 2); gl.drawArrays(gl.LINES, 0, windCount);
      gl.disableVertexAttribArray(l4); gl.disableVertexAttribArray(l1);
    },
  };
}

export function createGrid(grid, { still = false } = {}) {
  const w = grid.words;
  const el = document.createElement('section'); el.id = 'grid'; el.hidden = true; el.setAttribute('aria-label', grid.label);
  const mapEl = document.createElement('div'); mapEl.className = 'map';
  const panel = document.createElement('div'); panel.className = 'panel';
  const title = document.createElement('h2'); title.textContent = grid.title;
  const time = document.createElement('p'); time.className = 'time'; time.textContent = w.loading;
  const row = document.createElement('div'); row.className = 'row';
  const play = document.createElement('button'); play.textContent = w.pause;
  const slider = document.createElement('input'); slider.type = 'range'; slider.min = '0'; slider.step = '0.01'; slider.value = '0'; slider.setAttribute('aria-label', 'hour');
  row.append(play, slider);
  const legend = document.createElement('div'); legend.className = 'legend';
  legend.style.background = `linear-gradient(90deg, ${RAMP.map(([h, c]) => `${c} ${(h / TOP) * 100}%`).join(', ')})`;
  const scale = document.createElement('div'); scale.className = 'scale';
  for (let h = 0; h <= TOP; h++) { const s = document.createElement('span'); s.textContent = String(h); scale.append(s); }
  const hsLabel = document.createElement('p'); hsLabel.className = 'dim'; hsLabel.textContent = `${w.hs}, ${w.m} · ${w.wind}: ↗`;
  const credit = document.createElement('p'); credit.className = 'dim'; credit.textContent = grid.credit;
  const note = document.createElement('p'); note.className = 'dim'; note.textContent = grid.note;
  const sources = document.createElement('p'); sources.className = 'dim'; sources.textContent = grid.sources;
  const back = document.createElement('button'); back.className = 'back'; back.textContent = `Esc · ${w.back}`;
  panel.append(title, time, row, hsLabel, legend, scale, credit, note, sources, back);
  const tip = document.createElement('div'); tip.className = 'tip';
  el.append(mapEl, panel, tip);
  document.body.append(el);

  const state = { t: 0, playing: !still, open: false, map: null, d: null };
  let onBack = () => {};
  back.onclick = () => onBack();
  play.onclick = () => { state.playing = !state.playing; play.textContent = state.playing ? w.pause : w.play; };
  slider.oninput = () => { state.t = Number(slider.value); state.playing = false; play.textContent = w.play; showTime(); state.map?.triggerRepaint(); };
  play.textContent = state.playing ? w.pause : w.play;

  const fmt = (iso) => `${iso.replace('T', ' ')} UTC`;
  function showTime() {
    if (!state.d) return;
    const hours = state.d.run.hours, h = Math.min(hours.length - 1, Math.round(state.t));
    time.textContent = `+${h} h · ${fmt(hours[h])}`;
    slider.value = String(state.t);
  }

  async function build() {
    const [{ default: maplibregl }, d] = await Promise.all([import('maplibre-gl'), data(grid.files), import('maplibre-gl/dist/maplibre-gl.css')]);
    state.d = d; slider.max = String(d.run.hours.length - 1);
    const [W, S, E, N] = grid.bbox;
    const map = new maplibregl.Map({
      container: mapEl, attributionControl: false, // the sources are in the panel
      bounds: [[W, S], [E, N]], fitBoundsOptions: { padding: { top: 24, bottom: 24, left: 24, right: 340 } }, maxBounds: [[W - 45, S - 30], [E + 45, N + 30]],
      renderWorldCopies: false, dragRotate: false, pitchWithRotate: false, fadeDuration: 0,
      style: {
        version: 8,
        sources: { land: { type: 'geojson', data: grid.files.land } },
        layers: [
          { id: 'sea', type: 'background', paint: { 'background-color': '#08131f' } },
          { id: 'land', type: 'fill', source: 'land', paint: { 'fill-color': '#1d2029' } },
          { id: 'coast', type: 'line', source: 'land', paint: { 'line-color': '#3a4252', 'line-width': 1 } },
        ],
      },
    });
    map.touchZoomRotate.disableRotation();
    map.on('load', () => { map.addLayer(meshLayer(maplibregl, d, state)); map.once('idle', () => { state.ready = true; }); });
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
      tip.textContent = `${w.node} ${best} · ${d.lonlat[best * 2 + 1].toFixed(2)}°, ${d.lonlat[best * 2].toFixed(2)}°\n${w.hs} ${hs} ${w.m} · ${w.wind} ${sp} ${w.ms} from ${from}°`;
      tip.style.transform = `translate(${e.point.x + 14}px, ${e.point.y + 14}px)`; tip.classList.add('on');
    });
    map.on('mouseout', () => tip.classList.remove('on'));
    state.map = map; showTime();
  }

  return {
    get open() { return state.open; },
    get ready() { return !!state.ready; }, // the map and the mesh are drawn (`just record` waits for it)
    // fully shown: the room behind can stop drawing
    get covering() { return state.open && el.classList.contains('on'); },
    onBack(fn) { onBack = fn; },
    async show() {
      if (state.open) return;
      state.open = true; el.hidden = false;
      requestAnimationFrame(() => el.classList.add('on'));
      try { if (!state.map) await build(); else state.map.resize(); } catch { time.textContent = w.missing; }
    },
    hide() {
      if (!state.open) return;
      state.open = false; el.classList.remove('on'); tip.classList.remove('on');
      setTimeout(() => { if (!state.open) el.hidden = true; }, 400);
    },
    update(dt) {
      if (!state.open || !state.d) return;
      if (state.playing) { state.t = (state.t + dt * 3) % (state.d.run.hours.length - 1); showTime(); } // three hours a second
      state.map?.triggerRepaint();
    },
  };
}
