import * as THREE from 'three';

// The pictures of the placeholder room, drawn in code on canvases from
// config: the project frames, the piabrota eye, the window on Rio, the
// photos on the board, the book spines and the note. Nothing here is a
// file, and every word comes from config.js.

export const FONT_TITLE = '"Fjalla One", Impact, sans-serif';
export const FONT_MONO = '"JetBrains Mono", ui-monospace, Menlo, monospace';
// The retro faces of the tape labels and the paper things (OFL or
// Apache 2.0, from npm through @fontsource, CREDITS.md).
export const FACES = {
  marker: '"Permanent Marker", "Comic Sans MS", cursive',
  neon: 'Monoton, Impact, sans-serif',
  pixel: '"Press Start 2P", monospace',
  terminal: 'VT323, ui-monospace, monospace',
  typewriter: '"Special Elite", "Courier New", monospace',
};
const CJK = '"Hiragino Mincho ProN", "Yu Mincho", "Noto Serif CJK JP", "Noto Sans CJK JP", "Source Han Serif", serif';

export async function fontsReady() {
  try {
    await Promise.all([FONT_TITLE, FONT_MONO, ...Object.values(FACES)].map((f) => document.fonts.load(`40px ${f}`)));
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

// A letter board: white letters pressed into black felt, a quotation in
// capitals and who said it, under a ring that closes on itself.
export function quoteArt({ text, by, theme }) {
  const [c, ctx] = canvas(512, 352);
  ctx.fillStyle = '#16171b'; ctx.fillRect(0, 0, 512, 352);
  ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1;
  for (let y = 10; y < 352; y += 12) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke(); } // the felt's grooves
  ctx.strokeStyle = theme.accent; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(256, 62, 34, 34, 0, 0, 7); ctx.stroke();
  ctx.fillStyle = '#f2efe6'; ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
  const words = text.toUpperCase().split(' '), rows = [];
  for (const w of words) { const last = rows[rows.length - 1]; if (last && (last + ' ' + w).length <= 12) rows[rows.length - 1] = last + ' ' + w; else rows.push(w); }
  rows.forEach((r, i) => { ctx.font = `38px ${FONT_MONO}`; ctx.fillText(r.split('').join(String.fromCharCode(8202)), 256, 140 + i * 50); });
  ctx.fillStyle = '#b9b4a8'; ctx.font = `22px ${FONT_MONO}`; ctx.fillText(`— ${by.toUpperCase()}`, 256, 140 + rows.length * 50 + 14);
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

// ── the realistic things: noise, plastics, labels and paper ──

// Fine noise, for the grain of plastic and paper (as a bump map).
export function noiseTex(size = 256, amount = 40, seed = 5) {
  const [c, ctx] = canvas(size, size), img = ctx.createImageData(size, size), r = mulberry(seed);
  for (let i = 0; i < size * size; i++) { const v = 128 + (r() - 0.5) * amount; img.data.set([v, v, v, 255], i * 4); }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
const grime = (ctx, w, h, n, alpha, seed = 9) => { // scuffs and dust, so nothing is flat
  const r = mulberry(seed);
  for (let i = 0; i < n; i++) { ctx.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '255,255,255'},${alpha * r()})`; ctx.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 2); }
};

// The label on a VHS tape's spine: paper, a printed rule, the title by hand or in a retro face.
export function tapeSpineArt({ text, face = 'marker', paper = '#f4efe4', ink = '#222' }) {
  const [c, ctx] = canvas(512, 72);
  ctx.fillStyle = '#121214'; ctx.fillRect(0, 0, 512, 72);
  grime(ctx, 512, 72, 300, 0.12, text.length);
  const x0 = 26, y0 = 10, w = 460, h = 52; // the label leaves the black shell at the ends
  ctx.fillStyle = paper; ctx.fillRect(x0, y0, w, h);
  ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(x0, y0 + h - 4, w, 4);
  ctx.strokeStyle = ink; ctx.globalAlpha = 0.35; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x0 + 8, y0 + 12); ctx.lineTo(x0 + w - 8, y0 + 12); ctx.stroke(); ctx.globalAlpha = 1;
  ctx.fillStyle = ink; ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
  const f = FACES[face] ?? FACES.marker;
  fit(ctx, text, w - 40, face === 'pixel' ? 22 : face === 'neon' ? 34 : 38, f);
  if (face === 'neon') { ctx.shadowColor = ink; ctx.shadowBlur = 8; }
  ctx.fillText(text, x0 + w / 2, y0 + h / 2 + 4); ctx.shadowBlur = 0;
  ctx.font = `10px ${FONT_MONO}`; ctx.globalAlpha = 0.5; ctx.textAlign = 'left'; ctx.fillText('VHS  T-120', x0 + 8, y0 + 6); ctx.globalAlpha = 1;
  return texture(c);
}

// The top of a VHS cassette: black shell, the window on the reels, a label.
export function tapeTopArt({ text, face = 'marker', paper = '#f4efe4', ink = '#222' }) {
  const [c, ctx] = canvas(512, 288);
  ctx.fillStyle = '#141416'; ctx.fillRect(0, 0, 512, 288);
  ctx.strokeStyle = '#1e1e21'; ctx.lineWidth = 2; for (let y = 8; y < 288; y += 6) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke(); } // the shell's texture
  grime(ctx, 512, 288, 900, 0.1, text.length + 3);
  ctx.fillStyle = '#0a0a0b'; ctx.fillRect(130, 150, 252, 96); // the window
  for (const [x, r] of [[190, 44], [322, 30]]) { // the two reels, one full and one nearly empty
    ctx.fillStyle = '#2a2420'; ctx.beginPath(); ctx.arc(x, 198, r, 0, 7); ctx.fill();
    ctx.fillStyle = '#d9d6cf'; ctx.beginPath(); ctx.arc(x, 198, 14, 0, 7); ctx.fill();
    ctx.fillStyle = '#0a0a0b'; for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; ctx.fillRect(x + Math.cos(a) * 8 - 2, 198 + Math.sin(a) * 8 - 2, 4, 4); }
  }
  ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.fillRect(130, 150, 252, 30); // a reflection on the window
  ctx.fillStyle = paper; ctx.fillRect(70, 24, 372, 104);
  ctx.fillStyle = ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  fit(ctx, text, 330, face === 'pixel' ? 26 : 46, FACES[face] ?? FACES.marker); ctx.fillText(text, 256, 80);
  return texture(c);
}

// Beige plastic, for the computer and the fax: a colour with a little grime.
export function plasticArt(color = '#d6ccb8', seed = 3) {
  const [c, ctx] = canvas(256, 256);
  ctx.fillStyle = color; ctx.fillRect(0, 0, 256, 256);
  grime(ctx, 256, 256, 2500, 0.06, seed);
  const g = ctx.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, 'rgba(255,255,255,0.05)'); g.addColorStop(1, 'rgba(60,40,10,0.08)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256);
  return texture(c);
}

// A keyboard seen from above: rows of beige keys with dark legends.
export function keyboardArt() {
  const [c, ctx] = canvas(512, 192);
  ctx.fillStyle = '#b9ad95'; ctx.fillRect(0, 0, 512, 192);
  const rows = [15, 14, 13, 12], r = mulberry(4);
  rows.forEach((n, j) => {
    const kw = 452 / 15, y = 22 + j * 36, x0 = 18 + j * 8;
    for (let i = 0; i < n; i++) {
      const x = x0 + i * kw; ctx.fillStyle = '#8f846e'; ctx.fillRect(x, y + 2, kw - 3, 31);
      ctx.fillStyle = r() < 0.15 ? '#cfc5b0' : '#e2d9c4'; ctx.fillRect(x + 1, y, kw - 5, 27);
    }
  });
  ctx.fillStyle = '#8f846e'; ctx.fillRect(130, 168, 240, 18); ctx.fillStyle = '#e2d9c4'; ctx.fillRect(131, 166, 236, 15); // the space bar
  grime(ctx, 512, 192, 800, 0.08, 4);
  return texture(c);
}

// The front of the VCR: brushed black, the cassette door, buttons and a green clock.
export function vcrFrontArt() {
  const [c, ctx] = canvas(512, 80);
  ctx.fillStyle = '#1c1c1f'; ctx.fillRect(0, 0, 512, 80);
  for (let y = 0; y < 80; y += 2) { ctx.fillStyle = `rgba(255,255,255,${0.015 + (y % 6 ? 0 : 0.02)})`; ctx.fillRect(0, y, 512, 1); }
  ctx.fillStyle = '#0b0b0c'; ctx.fillRect(40, 22, 220, 30); ctx.fillStyle = '#26262a'; ctx.fillRect(42, 24, 216, 6); // the door
  ctx.fillStyle = '#06110a'; ctx.fillRect(300, 22, 96, 26);
  ctx.fillStyle = '#5dff9a'; ctx.font = '22px VT323, monospace'; ctx.textBaseline = 'middle'; ctx.fillText('12:00', 318, 36);
  for (let i = 0; i < 5; i++) { ctx.fillStyle = '#3a3a40'; ctx.fillRect(300 + i * 20, 56, 14, 8); }
  ctx.fillStyle = '#9a9aa2'; ctx.font = `9px ${FONT_MONO}`; ctx.fillText('VIDEO CASSETTE RECORDER', 40, 64);
  return texture(c);
}

// Paper with words on it, typed: the fax's page and the confidential letter.
export function paperArt({ lines, w = 256, h = 360, stamp, ink = '#1d1d22', size = 15, paper = '#f3efe6' }) {
  const [c, ctx] = canvas(w, h);
  ctx.fillStyle = paper; ctx.fillRect(0, 0, w, h);
  grime(ctx, w, h, 400, 0.05, lines.length);
  ctx.fillStyle = ink; ctx.textBaseline = 'top';
  lines.forEach((l, i) => { ctx.font = `${i === 0 ? size + 4 : size}px ${FACES.typewriter}`; ctx.globalAlpha = 0.82 + (i % 3) * 0.06; ctx.fillText(l, 18, 20 + i * (size + 7), w - 30); });
  ctx.globalAlpha = 1;
  if (stamp) {
    ctx.save(); ctx.translate(w * 0.62, h * 0.8); ctx.rotate(-0.22); ctx.strokeStyle = ctx.fillStyle = 'rgba(190,30,30,0.78)';
    ctx.lineWidth = 4; ctx.font = `26px ${FACES.typewriter}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const tw = ctx.measureText(stamp).width + 24; ctx.strokeRect(-tw / 2, -20, tw, 40); ctx.fillText(stamp, 0, 2); ctx.restore();
  }
  return texture(c);
}

// A manila folder, seen from above, its tab labelled and stamped.
export function folderArt({ title, stamp = 'CONFIDENTIAL' }) {
  const [c, ctx] = canvas(512, 384);
  ctx.fillStyle = '#d8b878'; ctx.fillRect(0, 40, 512, 344); ctx.fillRect(300, 0, 180, 48); // the folder and its tab
  grime(ctx, 512, 384, 1500, 0.08, 12);
  ctx.fillStyle = '#f3efe6'; ctx.fillRect(316, 10, 150, 30);
  ctx.fillStyle = '#222'; ctx.font = `20px ${FACES.typewriter}`; ctx.textBaseline = 'middle'; ctx.fillText(title.toUpperCase(), 324, 26, 136);
  ctx.save(); ctx.translate(230, 210); ctx.rotate(-0.18); ctx.strokeStyle = ctx.fillStyle = 'rgba(180,25,25,0.82)'; ctx.lineWidth = 6;
  ctx.font = `46px ${FACES.typewriter}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const tw = ctx.measureText(stamp).width + 36; ctx.strokeRect(-tw / 2, -36, tw, 72); ctx.fillText(stamp, 0, 4); ctx.restore();
  ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.font = `22px ${FACES.typewriter}`; ctx.fillText(title, 40, 330);
  return texture(c);
}

// The sleeves at the front of the slipbox. `book`: a paperback of the
// book, drawn here (a road, a motorcycle and the sun), not its cover.
// `repo`: a dark card with a pill, like a badge on a README.
export function cardArt({ card, title, theme }) {
  const [c, ctx] = canvas(512, 512);
  if (card?.kind === 'book') {
    ctx.fillStyle = '#efe6cf'; ctx.fillRect(0, 0, 512, 512);
    grime(ctx, 512, 512, 3000, 0.07, 21);
    ctx.fillStyle = '#c0392b'; ctx.fillRect(0, 0, 512, 14); ctx.fillRect(0, 498, 512, 14);
    ctx.fillStyle = '#1d1d22'; ctx.textAlign = 'center';
    ctx.font = `30px ${FACES.typewriter}`; ctx.fillText(card.author.toUpperCase(), 256, 62);
    const words = card.title.split(' '), lines = [words.slice(0, 3).join(' '), words.slice(3).join(' ')];
    ctx.font = 'italic 40px Georgia, "Times New Roman", serif'; lines.forEach((l, i) => ctx.fillText(l, 256, 118 + i * 46, 470));
    ctx.font = '22px Georgia, serif'; ctx.fillStyle = '#6b5a3e'; ctx.fillText(card.sub, 256, 214);
    // the drawing: the sun, a road to the horizon, a motorcycle on it
    ctx.fillStyle = '#e8a33c'; ctx.beginPath(); ctx.arc(256, 330, 62, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#4f6b3a'; ctx.fillRect(40, 330, 432, 110);
    ctx.fillStyle = '#3a3a3e'; ctx.beginPath(); ctx.moveTo(236, 330); ctx.lineTo(276, 330); ctx.lineTo(380, 440); ctx.lineTo(132, 440); ctx.fill();
    ctx.strokeStyle = '#f0e2b0'; ctx.lineWidth = 3; ctx.setLineDash([10, 10]); ctx.beginPath(); ctx.moveTo(256, 332); ctx.lineTo(256, 440); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = '#111'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    for (const x of [214, 298]) { ctx.beginPath(); ctx.arc(x, 410, 22, 0, 7); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(214, 410); ctx.lineTo(244, 384); ctx.lineTo(280, 384); ctx.lineTo(298, 410); ctx.moveTo(244, 384); ctx.lineTo(256, 410); ctx.moveTo(280, 384); ctx.lineTo(288, 368); ctx.lineTo(300, 366); ctx.stroke();
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(258, 362, 9, 0, 7); ctx.fill(); ctx.fillRect(252, 368, 12, 18); // the rider
    ctx.fillStyle = '#1d1d22'; ctx.font = `22px ${FACES.typewriter}`; ctx.fillText(card.year, 256, 480);
    ctx.textAlign = 'left';
  } else if (card?.kind === 'repo') {
    ctx.fillStyle = '#0d1117'; ctx.fillRect(0, 0, 512, 512);
    grime(ctx, 512, 512, 1200, 0.05, 22);
    const [a, b] = card.pill; ctx.font = `bold 30px ${FONT_MONO}`;
    const wa = ctx.measureText(a).width + 36, wb = ctx.measureText(b).width + 36, x = (512 - wa - wb) / 2, y = 60, h = 56;
    ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, wa + wb, h, h / 2); ctx.clip();
    ctx.fillStyle = '#30363d'; ctx.fillRect(x, y, wa, h); ctx.fillStyle = '#2ea043'; ctx.fillRect(x + wa, y, wb, h); ctx.restore();
    ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle'; ctx.fillText(a, x + 18, y + h / 2 + 1); ctx.fillText(b, x + wa + 18, y + h / 2 + 1);
    // a slip-box: notes linked to notes
    const r = mulberry(7), pts = Array.from({ length: 14 }, () => [70 + r() * 372, 170 + r() * 170]);
    ctx.strokeStyle = 'rgba(63,185,80,0.55)'; ctx.lineWidth = 2;
    pts.forEach((p, i) => { const q = pts[(i * 5 + 3) % pts.length]; ctx.beginPath(); ctx.moveTo(...p); ctx.lineTo(...q); ctx.stroke(); });
    pts.forEach((p) => { ctx.fillStyle = '#e6edf3'; ctx.fillRect(p[0] - 9, p[1] - 6, 18, 12); });
    ctx.fillStyle = '#e6edf3'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.font = `44px ${FONT_TITLE}`; ctx.fillText(card.title, 256, 410);
    ctx.fillStyle = '#9aa3b2'; ctx.font = `20px ${FONT_MONO}`; ctx.fillText(card.line, 256, 450, 480);
    ctx.textAlign = 'left';
  } else return recordArt({ title, theme });
  return texture(c);
}
