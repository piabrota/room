// An interactive tape: click the screen to play notes. Shows how a
// tape can make its own sound through the room's audio bus.
let W, H, audio, bus, notes = [];
const scale = [0, 3, 5, 7, 10, 12, 15];
export default {
  mount(deps) { ({ width: W, height: H, audio } = deps); bus = audio.bus(); bus.gain.value = 0.3; },
  frame(ctx, t, dt) {
    ctx.fillStyle = '#1a1208'; ctx.fillRect(0, 0, W, H);
    const cols = scale.length;
    for (let i = 0; i < cols; i++) {
      ctx.fillStyle = `hsl(${40 + i * 12},70%,${30 + i * 4}%)`;
      ctx.fillRect(i * (W / cols) + 4, H - 120, W / cols - 8, 100);
    }
    notes = notes.filter((n) => (n.life -= dt) > 0);
    for (const n of notes) { ctx.globalAlpha = n.life; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(n.x, n.y, 30 * (1.5 - n.life), 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1; ctx.fillStyle = '#e8b33a'; ctx.font = '18px monospace'; ctx.fillText('click a key', 24, 36);
  },
  input({ x, y }) {
    const i = Math.min(scale.length - 1, Math.floor(x / (W / scale.length)));
    const ctx = audio.ctx, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'triangle'; o.frequency.value = 220 * Math.pow(2, scale[i] / 12);
    g.gain.setValueAtTime(0.0001, ctx.currentTime); g.gain.exponentialRampToValueAtTime(1, ctx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8);
    o.connect(g).connect(bus); o.start(); o.stop(ctx.currentTime + 0.9);
    notes.push({ x, y, life: 1 });
  },
  stop() { bus?.disconnect(); },
};
