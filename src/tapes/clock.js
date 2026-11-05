// A mood tape: a VCR-style clock over a slow gradient, on the time of
// config.place.
let W, H, place;
export default {
  mount({ width, height, config }) { W = width; H = height; place = config?.place; },
  frame(ctx, t) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, `hsl(${220 + Math.sin(t * 0.2) * 20},50%,18%)`); g.addColorStop(1, '#05060a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const d = new Date();
    const s = place ? d.toLocaleTimeString('en-GB', { timeZone: place.timeZone, hour12: false }) : d.toTimeString().slice(0, 8);
    ctx.fillStyle = '#7fd4ff'; ctx.font = 'bold 72px monospace'; ctx.textAlign = 'center';
    ctx.fillText(s, W / 2, H / 2 + 24); ctx.textAlign = 'left';
    ctx.font = '18px monospace'; ctx.fillText('PLAY ▶  SP', 24, 36);
    if (place) { ctx.textAlign = 'center'; ctx.fillText(place.city.toUpperCase(), W / 2, H / 2 + 70); ctx.textAlign = 'left'; }
  },
};
