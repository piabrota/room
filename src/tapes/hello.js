// An "about me" tape. Replace the text with your own.
let sig, W, H;
export default {
  mount({ width, height, signature }) { W = width; H = height; sig = signature; },
  frame(ctx, t) {
    ctx.fillStyle = '#10131c'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#f3ead8'; ctx.font = 'bold 34px monospace';
    const shown = sig.name.slice(0, Math.floor(t * 14));
    ctx.fillText(shown + (Math.floor(t * 2) % 2 ? '_' : ''), 28, 90);
    ctx.font = '18px monospace'; ctx.globalAlpha = Math.min(1, Math.max(0, t - 1.2));
    ctx.fillText(sig.tagline, 28, 130);
    sig.links.forEach((l, i) => ctx.fillText('> ' + l.label, 28, 190 + i * 30));
    ctx.globalAlpha = 1;
  },
  input({ y }) {
    const i = Math.floor((y - 170) / 30);
    const link = sig.links[i]; if (link) window.open(link.url, '_blank', 'noopener');
  },
};
