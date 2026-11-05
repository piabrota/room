// The bots tape: piabrota's two GitHub Apps and the agents behind them,
// typed out like a terminal, one line at a time. Everything it shows
// comes from config.bots. Click the screen to open the bot on GitHub.
import { FONT_MONO, FONT_TITLE } from '../art.js';

let W, H, lines, bots;
export default {
  mount({ width, height, config }) {
    W = width; H = height; bots = config.bots;
    lines = bots.flatMap((b) => [
      { text: b.name, color: b.color, big: true },
      { text: b.role, color: '#9aa3b2' },
      ...b.agents.map(([name, what]) => ({ text: `  ${name.padEnd(16)} ${what}`, color: '#edeff3' })),
      { text: '', color: '#000' },
    ]);
  },
  frame(ctx, t) {
    ctx.fillStyle = '#07090d'; ctx.fillRect(0, 0, W, H);
    const total = lines.reduce((a, l) => a + l.text.length + 4, 0);
    const chars = Math.floor((t % (total / 60 + 8)) * 60); // types it all, holds, starts again
    let used = 0, y = 34;
    const rows = [];
    for (const l of lines) {
      const n = Math.max(0, Math.min(l.text.length, chars - used)); used += l.text.length + 4;
      rows.push({ ...l, shown: l.text.slice(0, n), done: n === l.text.length });
      if (n < l.text.length) break;
    }
    const lineH = 21, scroll = Math.max(0, rows.length * lineH + 40 - H);
    ctx.save(); ctx.translate(0, -scroll);
    for (const r of rows) {
      ctx.fillStyle = r.color;
      ctx.font = r.big ? `26px ${FONT_TITLE}` : `13px ${FONT_MONO}`;
      ctx.fillText(r.shown + (!r.done && Math.floor(t * 3) % 2 ? '▌' : ''), 22, y);
      y += r.big ? 30 : lineH;
    }
    ctx.restore();
  },
  input() { window.open(bots[0].url, '_blank', 'noopener'); },
};
