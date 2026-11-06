// The CV tape: Matheus Hoffmann's track record, year by year, in green
// phosphor, scrolling up like an old terminal; then his six works with a
// DOI. Everything it shows comes from config.cv and config.works.
// Click the screen to open the profile.
import { FACES } from '../art.js';

let W, H, cv, rows;
export default {
  mount({ width, height, config }) {
    W = width; H = height; cv = config.cv;
    rows = [
      { big: true, text: cv.name },
      { text: cv.title, dim: true }, { text: '' },
      ...cv.rows.map((r) => ({ when: r.when, text: `${r.where}`, sub: r.what })),
      { text: '' }, { big: true, text: 'works with a DOI' },
      ...config.works.map((w) => ({ when: '', text: w.title, sub: `doi ${w.doi}` })),
      { text: '' }, { text: '> click to open the profile', dim: true },
    ];
  },
  frame(ctx, t) {
    ctx.fillStyle = '#04100a'; ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, W * 0.7); g.addColorStop(0, 'rgba(60,255,140,0.07)'); g.addColorStop(1, 'rgba(0,0,0,0.4)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const lineH = 30, total = rows.length * lineH + H;
    const y0 = H - ((t * 26) % total); // scrolls up, then starts again
    ctx.save(); ctx.shadowColor = '#3cff8c'; ctx.shadowBlur = 6; ctx.textBaseline = 'middle';
    rows.forEach((r, i) => {
      const y = y0 + i * lineH; if (y < -lineH || y > H + lineH) return;
      if (r.big) { ctx.fillStyle = '#b9ffcf'; ctx.font = `34px ${FACES.terminal}`; ctx.fillText(r.text, 24, y); return; }
      ctx.fillStyle = r.dim ? '#3f9a62' : '#7dff9b';
      ctx.font = `22px ${FACES.terminal}`;
      if (r.when !== undefined) {
        ctx.fillStyle = '#3f9a62'; ctx.fillText(r.when, 24, y);
        ctx.fillStyle = '#7dff9b'; ctx.fillText(r.text, 128, y - 6);
        ctx.fillStyle = '#4fc07a'; ctx.font = `17px ${FACES.terminal}`; ctx.fillText(r.sub, 128, y + 10);
      } else ctx.fillText(r.text, 24, y);
    });
    ctx.restore();
    ctx.fillStyle = Math.floor(t * 2) % 2 ? '#7dff9b' : 'transparent'; ctx.fillRect(W - 30, H - 26, 12, 18); // the cursor
  },
  input() { window.open(cv.url, '_blank', 'noopener'); },
};
