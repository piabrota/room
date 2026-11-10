import * as THREE from 'three';
import { FONT_TITLE, FONT_MONO, texture } from './art.js';

// The credits plate: a brass plate on the wall that says whose idea a room like this is
// (AGENTS.md, invariant 2). It is one mesh and one draw call, engraved on a canvas; its words
// come from config.credits.plate through the hotspot's `art`, and a click on it opens the
// credits card (the `credits` action, src/app.js). The card and the LOFI page are in
// src/creditscard.js.
//
//   creditsPlate('credits', { top, name, bottom }, [x, y, z], { turn, size })
//
// `position` is the middle of the plate, in metres, a little off the wall it hangs on; `turn`
// is its rotation about the vertical, for a wall other than the back one; `size` is its width
// and height. The name is cut in two lines, so it can be read from the desk.
export function creditsPlate(name, { top = '', name: who = '', bottom = '' } = {}, position = [0, 0, 0], { turn = 0, size = [0.36, 0.26], depth = 0.012 } = {}) {
  const [w, h] = size;
  const W = 768, H = Math.round((W * h) / w);
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d');

  // brushed brass, a little darker toward the edges
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#dcbd78'); g.addColorStop(0.5, '#c9a55c'); g.addColorStop(1, '#a98542');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  let s = 11; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 420; i++) {
    ctx.fillStyle = rnd() < 0.5 ? 'rgba(255,244,210,0.07)' : 'rgba(60,40,10,0.07)';
    ctx.fillRect(rnd() * W - 80, rnd() * H, 120 + rnd() * 320, 1);
  }
  const edge = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.62);
  edge.addColorStop(0, 'rgba(40,26,6,0)'); edge.addColorStop(1, 'rgba(40,26,6,0.32)');
  ctx.fillStyle = edge; ctx.fillRect(0, 0, W, H);

  // an engraved line around it, and a screw in each corner
  const ink = '#2a1d0a', lit = 'rgba(255,240,205,0.4)';
  const m = 30;
  ctx.lineWidth = 3;
  ctx.strokeStyle = lit; ctx.strokeRect(m, m + 2, W - 2 * m, H - 2 * m);
  ctx.strokeStyle = ink; ctx.strokeRect(m, m, W - 2 * m, H - 2 * m);
  for (const [x, y] of [[m + 30, m + 30], [W - m - 30, m + 30], [m + 30, H - m - 30], [W - m - 30, H - m - 30]]) {
    ctx.fillStyle = 'rgba(40,26,6,0.5)'; ctx.beginPath(); ctx.arc(x, y + 2, 13, 0, 7); ctx.fill();
    ctx.fillStyle = '#b5924e'; ctx.beginPath(); ctx.arc(x, y, 12, 0, 7); ctx.fill();
    ctx.strokeStyle = ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 8, y - 4); ctx.lineTo(x + 8, y + 4); ctx.stroke();
  }

  // the words, cut into the metal: a light edge under each dark letter
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const cut = (text, x, y) => { ctx.fillStyle = lit; ctx.fillText(text, x, y + 2); ctx.fillStyle = ink; ctx.fillText(text, x, y); };
  const sized = (texts, max, size, font) => { let px = size; do { ctx.font = `${px}px ${font}`; px -= 2; } while (px > 10 && texts.some((t) => ctx.measureText(t).width > max)); };
  const lines = who.toUpperCase().split(/\s+/).filter(Boolean);
  const small = Math.round(H * 0.075), inner = W - 2 * m - 110; // between the screws
  if ('letterSpacing' in ctx) ctx.letterSpacing = '5px';
  sized([top.toUpperCase()], inner, Math.round(H * 0.1), FONT_MONO); cut(top.toUpperCase(), W / 2, H * 0.17);
  if ('letterSpacing' in ctx) ctx.letterSpacing = '3px';
  sized(lines, W - 2 * m - 70, Math.round(H * 0.3), FONT_TITLE);
  const lh = parseInt(ctx.font, 10) * 1.02, y0 = H * 0.5 - ((lines.length - 1) * lh) / 2;
  lines.forEach((t, i) => cut(t, W / 2, y0 + i * lh));
  if ('letterSpacing' in ctx) ctx.letterSpacing = '1px';
  sized([bottom], inner, small, FONT_MONO); cut(bottom, W / 2, H * 0.85);

  // one box: the face carries the canvas, the other sides a spot of plain brass from its margin
  const geo = new THREE.BoxGeometry(w, h, depth);
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) if (i < 16 || i > 19) uv.setXY(i, 0.5, 0.012);
  const plate = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: texture(c), roughness: 0.45, metalness: 0.35 }));
  plate.name = name; plate.position.set(...position); plate.rotation.y = turn;
  plate.castShadow = plate.receiveShadow = true;
  return plate;
}
