// The ouroboric-dev tape: the snake that eats its tail, turning, and
// the repositories of Ouroboric's factory around it, one lit at a time.
// Everything it shows comes from config.loop. Click to open the org.
import { FACES, FONT_MONO } from '../art.js';

let W, H, loop;
export default {
  mount({ width, height, config }) { W = width; H = height; loop = config.loop; },
  frame(ctx, t) {
    ctx.fillStyle = '#f2e6c9'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#c2410c'; ctx.font = `20px ${FACES.pixel}`; ctx.fillText('ouroboric-dev', 22, 44);
    ctx.fillStyle = '#7a4a2a'; ctx.font = `12px ${FONT_MONO}`; ctx.fillText(loop.hint, 22, 66);
    const cx = W / 2, cy = 228, R = 92, a0 = t * 0.6;
    ctx.lineCap = 'round';
    for (let k = 0; k < 60; k++) { // the body, thicker toward the head
      const a = a0 + (k / 60) * Math.PI * 1.9;
      ctx.strokeStyle = k % 2 ? '#2f6b3a' : '#3a8a49'; ctx.lineWidth = 6 + k * 0.22;
      ctx.beginPath(); ctx.arc(cx, cy, R, a, a + 0.12); ctx.stroke();
    }
    const ah = a0 + Math.PI * 1.95; // the head, at the tail
    ctx.fillStyle = '#245a2f'; ctx.beginPath(); ctx.arc(cx + Math.cos(ah) * R, cy + Math.sin(ah) * R, 13, 0, 7); ctx.fill();
    ctx.fillStyle = '#f2e6c9'; ctx.beginPath(); ctx.arc(cx + Math.cos(ah) * R + 4, cy + Math.sin(ah) * R - 4, 2.5, 0, 7); ctx.fill();
    const on = Math.floor(t / 1.6) % loop.crates.length;
    ctx.textAlign = 'center';
    loop.crates.forEach((c, i) => {
      const a = (i / loop.crates.length) * Math.PI * 2 - Math.PI / 2, x = cx + Math.cos(a) * (R + 62), y = cy + Math.sin(a) * (R + 46);
      ctx.fillStyle = i === on ? '#c2410c' : '#7a4a2a'; ctx.font = `${i === on ? 9 : 8}px ${FACES.pixel}`; ctx.fillText(c.id, x, y);
    });
    ctx.fillStyle = '#c2410c'; ctx.font = `13px ${FONT_MONO}`; ctx.fillText(loop.crates[on].line, cx, cy + 6);
    ctx.textAlign = 'left';
  },
  input() { window.open(loop.url, '_blank', 'noopener'); },
};
