import * as THREE from 'three';

// Browsers only allow audio after a user gesture, so call unlock()
// from the "enter" click. Every sound tries your file first and falls
// back to a tiny synthesized placeholder, so nothing breaks while
// you're still recording your own.
export function createAudio(camera) {
  const listener = new THREE.AudioListener();
  camera.add(listener);
  const ctx = listener.context;
  const loader = new THREE.AudioLoader();
  const buffers = new Map();
  let enabled = false;

  async function buffer(src, fallback) {
    const key = src + fallback;
    if (buffers.has(key)) return buffers.get(key);
    let b;
    try { b = await loader.loadAsync(src); } catch { b = synth(ctx, fallback); }
    buffers.set(key, b); return b;
  }

  return {
    listener, ctx,
    get enabled() { return enabled; },
    async unlock() { await ctx.resume(); enabled = true; listener.setMasterVolume(1); },
    toggle() { enabled = !enabled; listener.setMasterVolume(enabled ? 1 : 0); return enabled; },
    async loop({ src, volume = 0.5, fallback }, attachTo) {
      const a = attachTo ? new THREE.PositionalAudio(listener) : new THREE.Audio(listener);
      a.setBuffer(await buffer(src, fallback)); a.setLoop(true); a.setVolume(volume);
      if (attachTo) { a.setRefDistance(0.6); attachTo.add(a); }
      a.play(); return a;
    },
    async play({ src, fallback }, volume = 0.8) {
      const a = new THREE.Audio(listener);
      a.setBuffer(await buffer(src, fallback)); a.setVolume(volume); a.play();
    },
    // A gain node tapes can plug their own WebAudio graphs into.
    bus() { const g = ctx.createGain(); g.connect(listener.getInput()); return g; },
  };
}

function synth(ctx, kind) {
  const sr = ctx.sampleRate;
  const len = { rain: 4, hum: 2, click: 0.05, thunk: 0.35 }[kind] ?? 0.1;
  const b = ctx.createBuffer(2, Math.floor(sr * len), sr);
  for (let ch = 0; ch < 2; ch++) {
    const d = b.getChannelData(ch); let lp = 0;
    for (let i = 0; i < d.length; i++) {
      const t = i / sr, n = Math.random() * 2 - 1;
      if (kind === 'rain') { lp += (n - lp) * 0.35; d[i] = lp * 0.5 + (Math.random() < 0.0006 ? n : 0); }
      else if (kind === 'hum') d[i] = 0.25 * Math.sin(2 * Math.PI * 60 * t) + 0.1 * Math.sin(2 * Math.PI * 120 * t);
      else if (kind === 'click') d[i] = n * Math.exp(-t * 120);
      else if (kind === 'thunk') d[i] = Math.sin(2 * Math.PI * (90 - t * 120) * t) * Math.exp(-t * 14) + n * 0.2 * Math.exp(-t * 60);
    }
  }
  return b;
}
