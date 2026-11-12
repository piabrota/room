// The marola.dev tape: the sea of marola-dev on the screen, waves from a
// few sines like the tank on the wall, and its repositories as buoys
// that ride them. Everything it shows comes from config.sea. Click a
// buoy to open its repository, or anywhere else for marola.dev.
import { FACES, FONT_MONO } from '../art.js';

let W, H, sea, spots = [];
export default {
  mount({ width, height, config }) { W = width; H = height; sea = config.sea; },
  frame(ctx, t) {
    const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#04122a'); sky.addColorStop(1, '#0a3a66');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.fillStyle = '#5cc8ff'; ctx.shadowColor = '#5cc8ff'; ctx.shadowBlur = 14; ctx.font = `40px ${FACES.neon}`; ctx.fillText('marola.dev', 24, 64); ctx.restore();
    ctx.fillStyle = '#9fd8ff'; ctx.font = `13px ${FONT_MONO}`; ctx.fillText(sea.hint, 26, 90);
    const wave = (x, k) => 250 + k * 22 + Math.sin(x * 0.018 + t * 1.3 + k) * 10 + Math.sin(x * 0.041 - t * 0.9 + k * 2) * 5;
    for (let k = 3; k >= 0; k--) {
      ctx.fillStyle = `rgba(${20 + k * 10},${110 + k * 18},${190 + k * 12},${0.35 + k * 0.15})`;
      ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += 8) ctx.lineTo(x, wave(x, k)); ctx.lineTo(W, H); ctx.fill();
    }
    spots = sea.buoys.map((b, i) => {
      const x = 40 + i * ((W - 80) / (sea.buoys.length - 1)), y = wave(x, i % 2 ? 1 : 0) - 6;
      ctx.fillStyle = ['#BC2318', '#3FB950', '#1682D4', '#D29922'][i % 4]; ctx.beginPath(); ctx.arc(x, y, 7, 0, 7); ctx.fill();
      ctx.fillStyle = '#e6f4ff'; ctx.font = `10px ${FONT_MONO}`; ctx.save(); ctx.translate(x, y - 14); ctx.rotate(-0.6); ctx.fillText(b.id, 0, 0); ctx.restore();
      return { x, y, url: b.url };
    });
  },
  input({ type, x, y }) {
    if (type !== 'click') return;
    const hit = spots.find((s) => Math.hypot(s.x - x, s.y - y) < 18);
    window.open(hit ? hit.url : sea.url, '_blank', 'noopener');
  },
};
