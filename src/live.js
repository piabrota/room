import * as THREE from 'three';

// Copacabana, live, behind the window (config.outside.live; AGENTS.md, invariants 1 and 7).
//
// A YouTube live stream cannot be a texture (its frames are another host's), so the room
// lets it show through: the stream plays in an iframe *behind* the canvas, and a plane
// behind the glass draws nothing, not even alpha (`hole`), so the canvas is clear there.
// The window's frame, its leaves, the glass, the rain and the curtains are drawn in front
// of it as before, and the wall around the opening hides the rest. Each frame the iframe
// is laid on that plane in perspective (a CSS matrix3d from the plane's four corners), so
// it moves with the camera like a view 1.5 m out, not like a sticker on the screen.
//
// The iframe is made on the visitor's click and removed when they switch back, muted (the
// room's sound stays the room's), and nothing of YouTube's loads before the click.

const W = 4.8, H = 2.7, BACK = 1.5; // the plane: 16:9, metres, behind the frame
const PX = [1600, 900]; // the iframe's own size, before the transform

export function createLive(holder, cfg, { scene, camera, center, onChange = () => {} } = {}) {
  const none = { on: false, toggle() {}, close() {}, update() {} };
  if (!holder || !cfg?.embed) return none;

  const hole = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.ShaderMaterial({
    vertexShader: 'void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'void main() { gl_FragColor = vec4(0.0); }', // a clear pixel: the iframe shows through
    blending: THREE.NoBlending, depthWrite: true, fog: false, toneMapped: false,
  }));
  hole.name = 'live_hole'; hole.visible = false; hole.renderOrder = -1;
  hole.position.set(center.x, center.y, center.z - BACK);
  scene.add(hole);

  holder.setAttribute('aria-hidden', 'true');
  const corners = [[-W / 2, H / 2], [W / 2, H / 2], [W / 2, -H / 2], [-W / 2, -H / 2]].map(([x, y]) => new THREE.Vector3(x, y, 0).add(hole.position));
  const p = new THREE.Vector4(), m = new THREE.Matrix4();
  let on = false, frame = null;

  function show() {
    if (on) return; on = true;
    frame = document.createElement('iframe');
    frame.src = cfg.embed; frame.title = cfg.title;
    frame.allow = 'autoplay; encrypted-media; picture-in-picture';
    frame.referrerPolicy = 'strict-origin-when-cross-origin'; frame.tabIndex = -1;
    frame.width = PX[0]; frame.height = PX[1];
    holder.replaceChildren(frame); holder.hidden = false; hole.visible = true;
    onChange(true);
  }
  function hide() {
    if (!on) return; on = false;
    holder.replaceChildren(); frame = null; holder.hidden = true; hole.visible = false; // the stream goes with its iframe
    onChange(false);
  }

  // the screen point of each corner, in CSS pixels; null when a corner is behind the camera
  function project() {
    const out = [], w = innerWidth, h = innerHeight;
    for (const c of corners) {
      p.set(c.x, c.y, c.z, 1).applyMatrix4(camera.matrixWorldInverse).applyMatrix4(camera.projectionMatrix);
      if (p.w <= 0.01) return null;
      out.push([(p.x / p.w + 1) * w / 2, (1 - p.y / p.w) * h / 2]);
    }
    return out;
  }
  // the 2D projective map that sends the unit square to the four points (Heckbert), as a CSS matrix3d
  function homography([[x0, y0], [x1, y1], [x2, y2], [x3, y3]]) {
    const dx1 = x1 - x2, dx2 = x3 - x2, dy1 = y1 - y2, dy2 = y3 - y2, sx = x0 - x1 + x2 - x3, sy = y0 - y1 + y2 - y3;
    const d = dx1 * dy2 - dx2 * dy1, g = (sx * dy2 - dx2 * sy) / d, hh = (dx1 * sy - sx * dy1) / d;
    const a = x1 - x0 + g * x1, b = x3 - x0 + hh * x3, c = x0, e = y1 - y0 + g * y1, f = y3 - y0 + hh * y3, k = y0;
    // from the iframe's pixels to the unit square, then to the screen
    m.set(a / PX[0], b / PX[1], 0, c, e / PX[0], f / PX[1], 0, k, 0, 0, 1, 0, g / PX[0], hh / PX[1], 0, 1);
    return `matrix3d(${m.elements.map((v) => +v.toFixed(9)).join(',')})`;
  }
  function update() {
    if (!on || !frame) return;
    camera.updateMatrixWorld();
    const pts = project();
    frame.style.visibility = pts ? 'visible' : 'hidden';
    if (pts) frame.style.transform = homography(pts);
  }

  return { get on() { return on; }, toggle() { (on ? hide : show)(); }, close: hide, update, hole };
}
