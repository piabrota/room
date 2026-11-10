import * as THREE from 'three';

// Rio outside the window, in depth: a sky, far hills, the sugarloaf and
// its sister, the city's lights along the shore and the bay below, each
// on its own layer at its own distance. When the camera moves, the near
// layers slide past the far ones, so the window has a real view and not
// a picture.
//
// With the photographs of config.outside (credited in CREDITS.md), one
// for the night and one for the day, the city is a photograph, 25 m behind the glass, its sky fading into the
// drawn one, its brightest lights twinkling, and the drawn hills, city and
// bay are hidden. Without it, or while it loads, the drawn view shows.

function layer(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d'); draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return { tex: t, ctx, c };
}
function mulberry(a) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const ridge = (ctx, w, h, pts, color) => {
  ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, h);
  for (const [x, y] of pts) ctx.lineTo(x * w, y * h);
  ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
};

export function buildOutside(parent, { center = new THREE.Vector3(2.35, 1.7, -2), aim: aimAt = [0.3, 3.2], night: nightPhoto, day: dayPhoto, small = false } = {}) {
  const root = new THREE.Group(); root.name = 'outside'; parent.add(root);
  const drawn = new THREE.Group(); root.add(drawn);
  let g = root;
  const rnd = mulberry(11);
  const plane = (tex, w, h, pos, opts = {}) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, fog: false, toneMapped: false, depthWrite: false, ...opts }));
    m.position.copy(center).add(new THREE.Vector3(...pos)); g.add(m); return m;
  };

  // the sky, with the moon and stars, far away
  const sky = layer(1024, 512, (ctx, w, h) => {
    const gr = ctx.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#03050b'); gr.addColorStop(0.6, '#0e1830'); gr.addColorStop(1, '#2a2a44');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 400; i++) { ctx.fillStyle = `rgba(255,255,255,${0.2 + rnd() * 0.6})`; const s = rnd() * 1.6; ctx.fillRect(rnd() * w, rnd() * h * 0.75, s, s); }
    const mx = w * 0.32, my = h * 0.22;
    const halo = ctx.createRadialGradient(mx, my, 10, mx, my, 120); halo.addColorStop(0, 'rgba(244,236,214,0.35)'); halo.addColorStop(1, 'rgba(244,236,214,0)');
    ctx.fillStyle = halo; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#f4ecd6'; ctx.beginPath(); ctx.arc(mx, my, 22, 0, 7); ctx.fill();
  });
  const nightSky = plane(sky.tex, 120, 60, [0, 8, -60], { transparent: false });
  const daySky = plane(layer(256, 256, (ctx, w, h) => {
    const gr = ctx.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#6f9fd6'); gr.addColorStop(0.65, '#b9cde0'); gr.addColorStop(1, '#d9dfe3');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, w, h);
  }).tex, 120, 60, [0, 8, -60.5], { transparent: false });
  daySky.visible = false;
  g = drawn; // what follows is the drawn view, hidden when the photograph is in

  // far hills across the bay
  const far = layer(1024, 256, (ctx, w, h) => ridge(ctx, w, h, [[0, 0.7], [0.1, 0.45], [0.22, 0.55], [0.35, 0.3], [0.5, 0.5], [0.62, 0.4], [0.78, 0.6], [0.9, 0.35], [1, 0.55]], '#141c30'));
  plane(far.tex, 90, 11, [0, -3.5, -45]);

  // the sugarloaf and its little sister, with the cable car between them
  const near = layer(1024, 512, (ctx, w, h) => {
    ridge(ctx, w, h, [[0, 0.95], [0.18, 0.86], [0.3, 0.62], [0.36, 0.5], [0.42, 0.62], [0.47, 0.8], [0.55, 0.42], [0.6, 0.12], [0.64, 0.06], [0.69, 0.14], [0.73, 0.55], [0.8, 0.86], [1, 0.95]], '#0a0f1c');
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0.36 * w, 0.5 * h); ctx.lineTo(0.64 * w, 0.06 * h); ctx.stroke();
    ctx.fillStyle = '#ffd38a'; ctx.fillRect(0.5 * w, 0.27 * h, 4, 3);
  });
  plane(near.tex, 30, 15, [5, -2.6, -28]);

  // the city along the shore: lights that twinkle
  const W = 1024, H = 128, lights = Array.from({ length: 700 }, () => ({ x: rnd() * W, y: H * (0.25 + rnd() * 0.6), r: 0.7 + rnd() * 1.6, warm: rnd() < 0.82, p: rnd() * 6.28 }));
  const city = layer(W, H, () => {});
  const drawCity = (t) => {
    const ctx = city.ctx; ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#070a12'; ctx.fillRect(0, H * 0.2, W, H * 0.8);
    for (const l of lights) { ctx.fillStyle = l.warm ? `rgba(255,200,130,${0.55 + 0.45 * Math.sin(t * 1.7 + l.p)})` : `rgba(190,215,255,${0.6 + 0.4 * Math.sin(t * 2.3 + l.p)})`; ctx.fillRect(l.x, l.y, l.r, l.r); }
    city.tex.needsUpdate = true;
  };
  drawCity(0);
  plane(city.tex, 60, 3.2, [0, -4.6, -20]);

  // the bay: a flat sea far below, with the moon's road on it
  const sea = layer(512, 512, (ctx, w, h) => {
    const gr = ctx.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0c1528'); gr.addColorStop(1, '#03050a');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, w, h);
  });
  const water = plane(sea.tex, 120, 60, [0, -6.2, -30], { transparent: false });
  water.rotation.x = -Math.PI / 2;
  // the moon's road: one instanced draw of forty glints
  const N = 40, gm = new THREE.MeshBasicMaterial({ color: '#f4ecd6', transparent: true, opacity: 0.45, fog: false, toneMapped: false, depthWrite: false });
  const glints = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), gm, N); g.add(glints);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), pos = new THREE.Vector3(), scl = new THREE.Vector3();
  const setGlints = (t) => {
    for (let i = 0; i < N; i++) {
      pos.copy(center).add(new THREE.Vector3(-9 - i * 0.05 + Math.sin(t * 1.4 + i * 0.7) * 0.25, -6.15, -18 - i));
      scl.set(0.4 + i * 0.12, 1, 0.06 + i * 0.006);
      glints.setMatrixAt(i, m4.compose(pos, q, scl));
    }
    glints.instanceMatrix.needsUpdate = true;
  };
  setGlints(0);

  // near trees and a rooftop, a few metres out: they slide across the
  // view when the camera moves, which gives the window its depth
  g = root;
  const drawTrees = (leaf, lit) => layer(1024, 256, (ctx, w, h) => {
    const r = mulberry(23); ctx.fillStyle = leaf;
    ctx.beginPath(); ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 8) ctx.lineTo(x, h * (0.45 + 0.25 * Math.sin(x * 0.011) * Math.sin(x * 0.003 + 1) + r() * 0.06));
    ctx.lineTo(w, h); ctx.fill();
    ctx.fillStyle = lit ? leaf : '#8d8a84'; ctx.fillRect(w * 0.62, h * 0.28, w * 0.2, h); // a neighbour's roof
    for (let i = 0; i < 9; i++) { ctx.fillStyle = lit ? (r() < 0.5 ? '#ffcf8a' : '#2a2416') : '#4d5a66'; ctx.fillRect(w * (0.64 + (i % 3) * 0.06), h * (0.4 + Math.floor(i / 3) * 0.18), 14, 10); }
    for (const px of [0.18, 0.86]) { // two palms
      ctx.fillStyle = leaf; const bx = w * px; ctx.fillRect(bx - 2, h * 0.08, 4, h);
      for (let k = 0; k < 7; k++) { const a = -Math.PI + (k / 6) * Math.PI; ctx.beginPath(); ctx.ellipse(bx + Math.cos(a) * 26, h * 0.1 + Math.sin(a) * 8 + 10, 30, 5, a + Math.PI / 2 + 1.4, 0, 7); ctx.fill(); }
    }
  });
  const nightTrees = plane(drawTrees('#04060b', true).tex, 14, 3.5, [0.6, -2.7, -6]);
  const dayTrees = plane(drawTrees('#2f4a2c', false).tex, 14, 3.5, [0.6, -2.7, -6]);
  dayTrees.visible = false;

  // The photographs: each is set 25 m behind the glass so that its
  // landmark (`anchor`, as a fraction of the picture from the top left)
  // sits where the window looks.
  let twinkle = null, isDay = false;
  const photos = {};
  const aim = new THREE.Vector2(...aimAt); // where the landmark sits, from the middle of the window, 25 m out
  function loadPhoto(kind, { photo, anchor = [0.5, 0.5] }) {
    const img = new Image();
    img.onload = () => {
      const W = img.naturalWidth, H = img.naturalHeight, c = document.createElement('canvas'); c.width = W; c.height = H;
      const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
      if (kind === 'night') { // a darker sky at the top
        const dark = ctx.createLinearGradient(0, 0, 0, H * 0.45); dark.addColorStop(0, 'rgba(3,6,14,0.85)'); dark.addColorStop(1, 'rgba(3,6,14,0)');
        ctx.fillStyle = dark; ctx.fillRect(0, 0, W, H * 0.45);
      }
      const data = ctx.getImageData(0, 0, W, H).data;
      ctx.globalCompositeOperation = 'destination-in'; // the top fades into the drawn sky
      const fade = ctx.createLinearGradient(0, 0, 0, H * 0.12); fade.addColorStop(0, 'rgba(0,0,0,0)'); fade.addColorStop(1, 'rgba(0,0,0,1)');
      ctx.fillStyle = fade; ctx.fillRect(0, 0, W, H);
      const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
      const PW = 44, PH = PW * H / W, at = [aim.x - (anchor[0] - 0.5) * PW, aim.y - (0.5 - anchor[1]) * PH, -25];
      g = root;
      photos[kind] = plane(tex, PW, PH, at, { color: kind === 'night' ? new THREE.Color(0.86, 0.86, 0.9) : new THREE.Color(0.95, 0.95, 0.95) });
      if (kind === 'night') {
        // the brightest lights twinkle: points over them, faded in and out
        const pts = [], phase = [], r = mulberry(31);
        for (let k = 0; k < 40000 && pts.length < 3 * 420; k++) {
          const x = (r() * W) | 0, y = (H * 0.15 + r() * H * 0.85) | 0, i = (y * W + x) * 4;
          if (data[i] > 235 && data[i + 1] > 190) {
            pts.push(center.x + at[0] + (x / W - 0.5) * PW, center.y + at[1] + (0.5 - y / H) * PH, center.z + at[2] + 0.05);
            phase.push(r() * 6.28);
          }
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
        geo.setAttribute('phase', new THREE.Float32BufferAttribute(phase, 1));
        const mat = new THREE.ShaderMaterial({
          uniforms: { time: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
          vertexShader: 'attribute float phase; uniform float time; varying float a; void main() { a = 0.5 + 0.5 * sin(time * (1.3 + fract(phase) * 2.0) + phase); a = a * a * a; gl_PointSize = 2.5; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
          fragmentShader: 'varying float a; void main() { vec2 d = gl_PointCoord - 0.5; gl_FragColor = vec4(vec3(1.0, 0.85, 0.6) * a * smoothstep(0.5, 0.1, length(d)), 1.0); }',
        });
        twinkle = new THREE.Points(geo, mat); root.add(twinkle);
      }
      show();
    };
    // the small file (1280 px) on a phone, a small screen or a slow line (src/quality.js); the large one if it is missing
    const lite = photo.replace(/\.(jpe?g|webp)$/, '.lite.$1');
    img.onerror = () => { if (img.src.endsWith(lite)) img.src = photo; };
    img.src = small && lite !== photo ? lite : photo;
  }
  // night: the night photograph (or the drawn view while it loads), the
  // moon's sky, dark trees with lit windows; day: the day photograph,
  // a blue sky, green trees
  function show() {
    nightSky.visible = !isDay; daySky.visible = isDay;
    nightTrees.visible = !isDay; dayTrees.visible = isDay;
    if (photos.night) photos.night.visible = !isDay;
    if (twinkle) twinkle.visible = !isDay;
    if (photos.day) photos.day.visible = isDay;
    drawn.visible = !isDay && !photos.night;
  }
  // each photograph loads the first time its light is asked for: a night visit never downloads
  // (or decodes, which costs a phone more) the day's
  const asked = {};
  const want = (kind) => { const def = kind === 'day' ? dayPhoto : nightPhoto; if (def && !asked[kind]) { asked[kind] = true; loadPhoto(kind, def); } };

  let last = -1;
  const update = (t) => {
    if (twinkle) { twinkle.material.uniforms.time.value = t; return; }
    if (!isDay && t - last > 1 / 10) { last = t; drawCity(t); setGlints(t); }
  };
  update.setDay = (day) => { isDay = day; want(day ? 'day' : 'night'); show(); };
  return update;
}
