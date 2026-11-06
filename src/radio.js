// piabrota RADIO (config.radio): free-licensed lofi, one track after
// another from a random start. Each track streams from an <audio>
// element into the room's sound (audio.bus()), so the sound button mutes
// it too. A track that cannot load is replaced by a synthesized lofi bed
// (invariant 7) until the visitor skips or turns the radio off.
export function createRadio(audio, { tracks, volume = 0.6 }) {
  const out = audio.bus(); out.gain.value = volume;
  let i = Math.floor(Math.random() * tracks.length), on = false, el = null, node = null, bed = null;
  const listeners = new Set();
  const emit = () => listeners.forEach((f) => f(state()));
  const state = () => ({ on, track: on ? tracks[i] : null });

  function release() {
    if (el) { el.onended = el.onerror = null; el.pause(); el.removeAttribute('src'); el.load(); el = null; }
    node?.disconnect(); node = null;
    if (bed) { try { bed.stop(); } catch {} bed.disconnect(); bed = null; }
  }
  function fallback(t) {
    if (!on || bed || tracks[i] !== t) return;
    release();
    bed = audio.ctx.createBufferSource(); bed.buffer = audio.synth(t.fallback); bed.loop = true;
    bed.connect(out); bed.start();
  }
  function start() {
    release();
    const t = tracks[i];
    el = new Audio(); el.preload = 'auto'; el.src = t.src;
    node = audio.ctx.createMediaElementSource(el); node.connect(out);
    el.onended = () => next();
    el.onerror = () => fallback(t);
    el.play().catch(() => fallback(t));
    emit();
  }
  function next(step = 1) { i = (i + step + tracks.length) % tracks.length; if (on) start(); }

  return {
    get on() { return on; },
    toggle() { on = !on; if (on) start(); else { release(); emit(); } return on; },
    next() { next(1); },
    // LOFI view: the element keeps time on its own, so it is paused too
    pause() { el?.pause(); },
    resume() { if (on) el?.play().catch(() => {}); },
    onChange(f) { listeners.add(f); f(state()); },
  };
}
