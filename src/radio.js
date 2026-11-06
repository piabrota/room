// piabrota RADIO (config.radio): free-licensed lofi in stations, one
// track after another from a random start. Each track streams from an
// <audio> element into the room's sound (audio.bus()), so the sound
// button mutes it too. A track that cannot load is replaced by a
// synthesized lofi bed (invariant 7) until the visitor skips or turns the
// radio off.
//
// While it plays, the radio tells the listeners service (config.radio.
// listeners, scripts/listeners.mjs) that one more person is listening,
// over one EventSource, and shows the count it sends back. Without the
// service the count stays hidden; nothing else changes.
export function createRadio(audio, { stations, volume = 0.6, listeners: liveUrl }) {
  const out = audio.bus(); out.gain.value = volume;
  let station = stations[0], i = 0, on = false, el = null, node = null, bed = null, live = null, count = null;
  const pick = () => { i = Math.floor(Math.random() * station.tracks.length); };
  pick();
  const subs = new Set();
  const state = () => ({ on, station, track: on ? station.tracks[i] : null, listeners: count });
  const emit = () => subs.forEach((f) => f(state()));

  function release() {
    if (el) { el.onended = el.onerror = null; el.pause(); el.removeAttribute('src'); el.load(); el = null; }
    node?.disconnect(); node = null;
    if (bed) { try { bed.stop(); } catch {} bed.disconnect(); bed = null; }
  }
  function fallback(t) {
    if (!on || bed || station.tracks[i] !== t) return;
    release();
    bed = audio.ctx.createBufferSource(); bed.buffer = audio.synth(t.fallback); bed.loop = true;
    bed.connect(out); bed.start();
  }
  function start() {
    release();
    const t = station.tracks[i];
    el = new Audio(); el.preload = 'auto'; el.src = t.src;
    node = audio.ctx.createMediaElementSource(el); node.connect(out);
    el.onended = () => next();
    el.onerror = () => fallback(t);
    el.play().catch(() => fallback(t));
    emit();
  }
  function next(step = 1) { i = (i + step + station.tracks.length) % station.tracks.length; if (on) start(); }

  function listen(yes) {
    live?.close(); live = null; count = null;
    if (!yes || !liveUrl || typeof EventSource === 'undefined') return;
    live = new EventSource(liveUrl);
    live.onmessage = (e) => { const n = Number(e.data); if (Number.isFinite(n)) { count = n; emit(); } };
    live.onerror = () => { if (live?.readyState === EventSource.CLOSED) { count = null; emit(); } };
  }

  return {
    stations,
    get on() { return on; },
    toggle() { on = !on; listen(on); if (on) start(); else { release(); emit(); } return on; },
    next() { next(1); },
    tune(id) {
      const s = stations.find((x) => x.id === id); if (!s || s === station) return;
      station = s; pick(); if (on) start(); else emit();
    },
    // LOFI view: the element keeps time on its own, so it is paused too,
    // and the visitor no longer counts as listening
    pause() { el?.pause(); if (on) listen(false); },
    resume() { if (on) { el?.play().catch(() => {}); listen(true); } },
    onChange(f) { subs.add(f); f(state()); },
  };
}
