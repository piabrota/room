import * as THREE from 'three';

// Surfaces for the placeholder room, drawn in code: wood grain, floor
// planks and plaster. Each is a small canvas used as a colour map (wood,
// planks) or a bump and roughness map (plaster), repeated. Grey-scale
// maps multiply the material's colour, so one texture serves every wood.

function make(w, h, draw, { repeat = [1, 1], color = true } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); t.anisotropy = 8;
  return t;
}
function noise(ctx, w, h, amount, rnd) {
  const img = ctx.getImageData(0, 0, w, h);
  for (let i = 0; i < img.data.length; i += 4) { const n = (rnd() - 0.5) * amount; img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n; }
  ctx.putImageData(img, 0, 0);
}
function mulberry(a) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

const cache = {};
// light grey wood grain, to multiply a wood colour
export function woodGrain() {
  return cache.wood ??= make(256, 256, (ctx, w, h) => {
    const rnd = mulberry(3);
    ctx.fillStyle = '#d8d8d8'; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) {
      const y0 = rnd() * h, a = 1 + rnd() * 4, f = 0.01 + rnd() * 0.03, shade = 150 + rnd() * 90;
      ctx.strokeStyle = `rgba(${shade},${shade},${shade},${0.25 + rnd() * 0.4})`; ctx.lineWidth = 0.5 + rnd() * 2;
      ctx.beginPath(); for (let x = 0; x <= w; x += 4) ctx.lineTo(x, y0 + Math.sin(x * f + i) * a); ctx.stroke();
    }
    noise(ctx, w, h, 18, rnd);
  });
}
// floor planks: grain, seams and a little variation from board to board
export function planks() {
  return cache.planks ??= make(512, 512, (ctx, w, h) => {
    const rnd = mulberry(5), rows = 8, rh = h / rows;
    for (let r = 0; r < rows; r++) {
      let x = -rnd() * 200;
      while (x < w) {
        const len = 180 + rnd() * 220, s = 180 + rnd() * 50;
        ctx.fillStyle = `rgb(${s},${s * 0.97},${s * 0.93})`; ctx.fillRect(x, r * rh, len, rh);
        for (let k = 0; k < 7; k++) {
          ctx.strokeStyle = `rgba(90,80,70,${0.08 + rnd() * 0.15})`; ctx.lineWidth = 1;
          const y = r * rh + 4 + rnd() * (rh - 8);
          ctx.beginPath(); ctx.moveTo(x, y); ctx.bezierCurveTo(x + len / 3, y + rnd() * 4 - 2, x + (2 * len) / 3, y + rnd() * 4 - 2, x + len, y); ctx.stroke();
        }
        ctx.fillStyle = 'rgba(30,20,15,0.6)'; ctx.fillRect(x, r * rh, 2, rh);
        x += len;
      }
      ctx.fillStyle = 'rgba(30,20,15,0.7)'; ctx.fillRect(0, r * rh, w, 2);
    }
    noise(ctx, w, h, 14, rnd);
  }, { repeat: [3, 3] });
}
// plaster: a soft bump for the walls
export function plaster() {
  return cache.plaster ??= make(256, 256, (ctx, w, h) => {
    const rnd = mulberry(9);
    ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) { const v = 100 + rnd() * 60; ctx.fillStyle = `rgba(${v},${v},${v},0.25)`; ctx.beginPath(); ctx.arc(rnd() * w, rnd() * h, 1 + rnd() * 6, 0, 7); ctx.fill(); }
    noise(ctx, w, h, 30, rnd);
  }, { repeat: [4, 2], color: false });
}
