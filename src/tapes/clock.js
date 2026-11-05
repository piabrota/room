// A mood tape: a VCR-style clock over a slow gradient.
let W, H;
export default {
  mount({ width, height }) { W = width; H = height; },
  frame(ctx, t) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, `hsl(${220 + Math.sin(t * 0.2) * 20},50%,18%)`); g.addColorStop(1, '#05060a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const d = new Date(), s = d.toTimeString().slice(0, 8);
    ctx.fillStyle = '#7fd4ff'; ctx.font = 'bold 72px monospace'; ctx.textAlign = 'center';
    ctx.fillText(s, W / 2, H / 2 + 24); ctx.textAlign = 'left';
    ctx.font = '18px monospace'; ctx.fillText('PLAY ▶  SP', 24, 36);
  },
};
