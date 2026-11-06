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
    synth: (kind) => synth(ctx, kind),
    // A gain node tapes can plug their own WebAudio graphs into.
    bus() { const g = ctx.createGain(); g.connect(listener.getInput()); return g; },
  };
}

function synth(ctx, kind) {
  const sr = ctx.sampleRate;
  const len = { rain: 4, hum: 2, click: 0.05, thunk: 0.35, lofi: 8 }[kind] ?? 0.1;
  // lofi: two soft seventh chords, four seconds each, a kick on the beat and vinyl crackle
  const chords = [[174.6, 220, 261.6, 329.6], [164.8, 196, 246.9, 293.7]];
  const b = ctx.createBuffer(2, Math.floor(sr * len), sr);
  for (let ch = 0; ch < 2; ch++) {
    const d = b.getChannelData(ch); let lp = 0;
    for (let i = 0; i < d.length; i++) {
      const t = i / sr, n = Math.random() * 2 - 1;
      if (kind === 'rain') { lp += (n - lp) * 0.35; d[i] = lp * 0.5 + (Math.random() < 0.0006 ? n : 0); }
      else if (kind === 'hum') d[i] = 0.25 * Math.sin(2 * Math.PI * 60 * t) + 0.1 * Math.sin(2 * Math.PI * 120 * t);
      else if (kind === 'click') d[i] = n * Math.exp(-t * 120);
      else if (kind === 'lofi') {
        const c = chords[Math.floor(t / 4) % 2], u = t % 4, beat = t % (60 / 72);
        let v = 0; for (const f of c) v += Math.sin(2 * Math.PI * f * t) * 0.05 + Math.sin(4 * Math.PI * f * t) * 0.012;
        v *= (0.7 + 0.3 * Math.sin(2 * Math.PI * 4.5 * t)) * Math.min(1, u * 8) * Math.min(1, (4 - u) * 8);
        v += Math.sin(2 * Math.PI * (60 - beat * 40) * beat) * Math.exp(-beat * 18) * 0.3;
        d[i] = v + (Math.random() < 0.0004 ? n * 0.25 : n * 0.004);
      }
      else if (kind === 'thunk') d[i] = Math.sin(2 * Math.PI * (90 - t * 120) * t) * Math.exp(-t * 14) + n * 0.2 * Math.exp(-t * 60);
    }
  }
  return b;
}
