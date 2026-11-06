import * as THREE from 'three';

// The pictures of the placeholder room, drawn in code on canvases from
// config: the project frames, the piabrota eye, the window on Rio, the
// photos on the board, the book spines and the note. Nothing here is a
// file, and every word comes from config.js.

export const FONT_TITLE = '"Fjalla One", Impact, sans-serif';
export const FONT_MONO = '"JetBrains Mono", ui-monospace, Menlo, monospace';
const CJK = '"Hiragino Mincho ProN", "Yu Mincho", "Noto Serif CJK JP", "Noto Sans CJK JP", "Source Han Serif", serif';

export async function fontsReady() {
  try {
    await Promise.all([document.fonts.load(`48px ${FONT_TITLE}`), document.fonts.load(`20px ${FONT_MONO}`)]);
  } catch { /* the system fonts will do */ }
}

function canvas(w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}
export function texture(c) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
function fit(ctx, text, max, size, font) {
  let s = size;
  do { ctx.font = `${s}px ${font}`; s -= 2; } while (ctx.measureText(text).width > max && s > 8);
}

// A framed print for one project: its glyph, its name, its line.
export function frameArt({ glyph, title, line, color, theme }) {
  const [c, ctx] = canvas(384, 480);
  ctx.fillStyle = '#e9e4d8'; ctx.fillRect(0, 0, 384, 480); // the mat
  ctx.fillStyle = theme.bg; ctx.fillRect(28, 28, 328, 424);
  // a glow of the lane colour behind the glyph
  const g = ctx.createRadialGradient(192, 190, 10, 192, 190, 170);
  g.addColorStop(0, color + '66'); g.addColorStop(1, color + '00');
  ctx.fillStyle = g; ctx.fillRect(28, 28, 328, 424);
  ctx.fillStyle = theme.text; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const latin = /^[\x20-\x7e]+$/.test(glyph);
  fit(ctx, glyph, 260, glyph.length > 1 ? 120 : 170, latin ? FONT_TITLE : CJK);
  ctx.fillText(glyph, 192, 196);
  ctx.fillStyle = color; ctx.fillRect(56, 330, 272, 4);
  ctx.fillStyle = theme.text; fit(ctx, title, 272, 46, FONT_TITLE); ctx.fillText(title, 192, 372);
  ctx.fillStyle = theme.muted; fit(ctx, line, 280, 19, FONT_MONO); ctx.fillText(line, 192, 414);
  return texture(c);
}

// The piabrota mark: an open green eye on red (as piabrota.art shows it).
export function eyeArt(theme) {
  const [c, ctx] = canvas(512, 512);
  const s = 512 / 100;
  ctx.scale(s, s);
  ctx.fillStyle = theme.accent; roundRect(ctx, 0, 0, 100, 100, 22); ctx.fill();
  ctx.fillStyle = theme.eye.white;
  ctx.beginPath(); ctx.moveTo(12, 50); ctx.quadraticCurveTo(50, 18, 88, 50); ctx.quadraticCurveTo(50, 82, 12, 50); ctx.fill();
  ctx.fillStyle = theme.eye.iris; ctx.beginPath(); ctx.arc(50, 50, 14, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = theme.eye.pupil; ctx.beginPath(); ctx.arc(50, 50, 6, 0, Math.PI * 2); ctx.fill();
  return texture(c);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

// The window: Rio at night. A bay, a sugarloaf-shaped hill, the city's
// lights along the shore and the moon on the water. Animated: lights
// twinkle and the reflection shimmers.
export function windowArt() {
  const W = 640, H = 512;
  const [c, ctx] = canvas(W, H);
  const rnd = mulberry(7);
  const lights = Array.from({ length: 260 }, () => {
    const x = rnd() * W, shore = 330 + Math.sin(x / 70) * 6;
    return { x, y: shore - rnd() * 38 * (0.4 + rnd()), r: 0.6 + rnd() * 1.4, hue: rnd() < 0.8 ? '255,196,120' : '200,220,255', p: rnd() * 6.28 };
  });
  const stars = Array.from({ length: 90 }, () => ({ x: rnd() * W, y: rnd() * 230, r: rnd() * 1.1, p: rnd() * 6.28 }));
  const hill = (x0, w, h, base) => {
    ctx.beginPath(); ctx.moveTo(x0 - w * 0.6, base);
    ctx.bezierCurveTo(x0 - w * 0.25, base - h * 0.2, x0 - w * 0.28, base - h, x0, base - h);
    ctx.bezierCurveTo(x0 + w * 0.3, base - h, x0 + w * 0.25, base - h * 0.3, x0 + w * 0.7, base); ctx.fill();
  };
  function draw(t) {
    const sky = ctx.createLinearGradient(0, 0, 0, 330);
    sky.addColorStop(0, '#060912'); sky.addColorStop(0.7, '#14203a'); sky.addColorStop(1, '#2a2a40');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, 330);
    for (const s of stars) { ctx.fillStyle = `rgba(255,255,255,${0.35 + 0.35 * Math.sin(t * 1.3 + s.p)})`; ctx.fillRect(s.x, s.y, s.r + 0.5, s.r + 0.5); }
    // moon
    ctx.fillStyle = '#f4ecd6'; ctx.beginPath(); ctx.arc(140, 92, 22, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(244,236,214,0.08)'; ctx.beginPath(); ctx.arc(140, 92, 48, 0, Math.PI * 2); ctx.fill();
    // hills, far to near
    ctx.fillStyle = '#121a2c'; hill(120, 380, 130, 330); hill(560, 300, 150, 330);
    ctx.fillStyle = '#0b1020'; hill(430, 120, 175, 330); hill(330, 90, 95, 330); // the sugarloaf and its little sister
    // cable car line
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(330, 238); ctx.lineTo(430, 158); ctx.stroke();
    // water
    const sea = ctx.createLinearGradient(0, 330, 0, H);
    sea.addColorStop(0, '#101a30'); sea.addColorStop(1, '#05070d');
    ctx.fillStyle = sea; ctx.fillRect(0, 330, W, H - 330);
    for (let y = 336; y < H; y += 6) {
      const w = 26 + (y - 330) * 0.35, x = 140 + Math.sin(t * 1.7 + y * 0.21) * (4 + (y - 330) * 0.05);
      ctx.fillStyle = `rgba(244,236,214,${0.25 * (1 - (y - 330) / (H - 330))})`; ctx.fillRect(x - w / 2, y, w, 2);
    }
    // the city along the shore, and its reflection
    for (const l of lights) {
      const a = 0.55 + 0.45 * Math.sin(t * 2 + l.p);
      ctx.fillStyle = `rgba(${l.hue},${a})`; ctx.fillRect(l.x, l.y, l.r, l.r);
      ctx.fillStyle = `rgba(${l.hue},${a * 0.18})`; ctx.fillRect(l.x + Math.sin(t * 2.5 + l.y) * 1.5, 660 - l.y, l.r, l.r * 3);
    }
  }
  draw(0);
  const tex = texture(c);
  let last = -1;
  return { tex, update(t) { if (t - last < 1 / 15) return; last = t; draw(t); tex.needsUpdate = true; } };
}

// A polaroid of a person: initials, handle, a line.
export function photoArt({ name, line, color, theme }) {
  const [c, ctx] = canvas(256, 300);
  ctx.fillStyle = '#f4f1ea'; ctx.fillRect(0, 0, 256, 300);
  const g = ctx.createLinearGradient(0, 16, 0, 220);
  g.addColorStop(0, color); g.addColorStop(1, theme.bg);
  ctx.fillStyle = g; ctx.fillRect(16, 16, 224, 200);
  ctx.fillStyle = theme.text; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `92px ${FONT_TITLE}`; ctx.fillText(name.slice(0, 2).toUpperCase(), 128, 120);
  ctx.fillStyle = '#1b1b1b'; fit(ctx, '@' + name, 220, 30, FONT_TITLE); ctx.fillText('@' + name, 128, 245);
  ctx.fillStyle = '#555'; fit(ctx, line, 228, 14, FONT_MONO); ctx.fillText(line, 128, 276);
  return texture(c);
}

// A book spine with its title running up.
export function spineArt({ title, color, theme }) {
  const [c, ctx] = canvas(64, 384);
  ctx.fillStyle = color; ctx.fillRect(0, 0, 64, 384);
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(0, 22, 64, 4); ctx.fillRect(0, 358, 64, 4);
  ctx.save(); ctx.translate(36, 192); ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = theme.text; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  fit(ctx, title, 300, 30, FONT_TITLE); ctx.fillText(title, 0, 0);
  ctx.restore();
  return texture(c);
}

// The note on the desk: a glyph and two lines, handwritten-ish.
export function noteArt({ glyph, lines, theme }) {
  const [c, ctx] = canvas(256, 192);
  ctx.fillStyle = '#efe6c8'; ctx.fillRect(0, 0, 256, 192);
  ctx.fillStyle = theme.accent; ctx.font = `64px ${CJK}`; ctx.textBaseline = 'middle'; ctx.fillText(glyph, 18, 64);
  ctx.fillStyle = '#2a2a2a';
  lines.forEach((l, i) => { fit(ctx, l, 220, 18, FONT_MONO); ctx.fillText(l, 18, 130 + i * 26); });
  return texture(c);
}

function mulberry(a) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// A record sleeve, drawn from its name: the name seeds the pattern, the
// palette and the composition, so every repository gets its own cover.
export function recordArt({ title, theme }) {
  const [c, ctx] = canvas(256, 256);
  let h = 2166136261; for (const ch of title) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  const rnd = mulberry(h >>> 0);
  const pal = [...Object.values(theme.lanes), theme.eye.white, theme.eye.iris, '#7a5cff', '#e2574c'];
  const pick = () => pal[Math.floor(rnd() * pal.length)];
  const bg = rnd() < 0.5 ? theme.bg : '#e9e4d8', ink = bg === theme.bg ? theme.text : theme.bg;
  ctx.fillStyle = bg; ctx.fillRect(0, 0, 256, 256);
  const kind = Math.floor(rnd() * 4);
  ctx.lineWidth = 2 + rnd() * 6;
  if (kind === 0) { // rings, off centre
    const x = 60 + rnd() * 136, y = 60 + rnd() * 100;
    for (let r = 200; r > 8; r -= 10 + rnd() * 14) { ctx.strokeStyle = pick(); ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke(); }
  } else if (kind === 1) { // waves
    const a = 6 + rnd() * 18, f = 0.02 + rnd() * 0.05;
    for (let y = 10; y < 210; y += 14) {
      ctx.strokeStyle = pick(); ctx.beginPath();
      for (let x = 0; x <= 256; x += 4) ctx.lineTo(x, y + Math.sin(x * f + y * 0.1) * a);
      ctx.stroke();
    }
  } else if (kind === 2) { // a grid of blocks
    const n = 3 + Math.floor(rnd() * 5), s = 216 / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (rnd() < 0.6) { ctx.fillStyle = pick(); ctx.fillRect(20 + i * s, 12 + j * s * 0.85, s - 4, s * 0.85 - 4); }
  } else { // rays from a corner
    const x = rnd() < 0.5 ? 0 : 256;
    for (let i = 0; i < 26; i++) { ctx.strokeStyle = pick(); ctx.beginPath(); ctx.moveTo(x, 210); const a = (i / 26) * Math.PI; ctx.lineTo(x + Math.cos(a) * 300 * (x ? -1 : 1), 210 - Math.sin(a) * 300); ctx.stroke(); }
  }
  ctx.fillStyle = bg; ctx.fillRect(0, 0, 256, 44); // the title on top, where it shows above the next sleeve
  ctx.fillStyle = ink; fit(ctx, title, 236, 26, FONT_TITLE); ctx.textBaseline = 'middle'; ctx.fillText(title, 12, 22);
  return texture(c);
}

// The side of a crate on the belt: its name, stencilled.
export function crateArt({ title, theme }) {
  const [c, ctx] = canvas(256, 128);
  ctx.fillStyle = '#8a6a46'; ctx.fillRect(0, 0, 256, 128);
  ctx.fillStyle = 'rgba(0,0,0,0.18)'; for (let y = 0; y < 128; y += 32) ctx.fillRect(0, y, 256, 3);
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 6; ctx.strokeRect(3, 3, 250, 122);
  ctx.fillStyle = theme.bg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  fit(ctx, title, 220, 44, FONT_TITLE); ctx.fillText(title, 128, 66);
  return texture(c);
}
