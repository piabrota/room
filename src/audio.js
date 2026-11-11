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
  const len = { rain: 4, click: 0.05, thunk: 0.35, lofi: 8, meow: 0.75, pop: 0.14, splash: 1.7 }[kind] ?? 0.1;
  // rain: drops on the glass, each a short falling blip, and no hiss under them
  const drops = kind === 'rain' ? Array.from({ length: 160 }, () => [Math.random() * len, 1800 + Math.random() * 2600, 0.04 + Math.random() * 0.1]) : [];
  // splash: after the plunge, the drops that fall back, each a short rising blip
  const plinks = kind === 'splash' ? Array.from({ length: 34 }, () => [0.12 + Math.random() ** 1.6 * 1.3, 1100 + Math.random() * 3200, 0.03 + Math.random() * 0.07]) : [];
  // lofi: two soft seventh chords, four seconds each, a kick on the beat and vinyl crackle
  const chords = [[174.6, 220, 261.6, 329.6], [164.8, 196, 246.9, 293.7]];
  const b = ctx.createBuffer(2, Math.floor(sr * len), sr), res = [];
  for (let ch = 0; ch < 2; ch++) {
    const d = b.getChannelData(ch); let lp = 0, ph = 0;
    for (let i = 0; i < d.length; i++) {
      const t = i / sr, n = Math.random() * 2 - 1;
      if (kind === 'rain') { let v = 0; for (const [t0, f, a] of drops) { const u = t - t0; if (u >= 0 && u < 0.03) v += Math.sin(2 * Math.PI * f * (1 - u * 8) * u) * Math.exp(-u * 180) * a; } d[i] = v; }
      else if (kind === 'click') d[i] = n * Math.exp(-t * 120);
      else if (kind === 'pop') { // rubber that snaps: a crack of bright noise and a quick falling tone
        const hp = n - lp; lp += (n - lp) * 0.35;
        d[i] = (hp * 0.9 * Math.exp(-t * 70) + Math.sin(2 * Math.PI * (1400 - t * 6000) * t) * 0.5 * Math.exp(-t * 110)) * Math.min(1, t * 4000);
      }
      else if (kind === 'splash') { // water into water: a deep plunge, a wash of noise that darkens as it fades, then the drops
        lp += (n - lp) * (0.04 + 0.5 * Math.exp(-t * 7));
        let v = lp * 0.9 * (1 - Math.exp(-t * 300)) * Math.exp(-t * 4.2);
        v += Math.sin(2 * Math.PI * (95 + 240 * t) * t) * 0.55 * Math.exp(-t * 11) * Math.min(1, t * 200); // the air it takes under, closing
        for (const [t0, f, a] of plinks) { const u = t - t0; if (u >= 0 && u < 0.05) v += Math.sin(2 * Math.PI * f * (1 + u * 6) * u) * Math.exp(-u * 90) * a; }
        d[i] = v;
      }
      else if (kind === 'lofi') {
        const c = chords[Math.floor(t / 4) % 2], u = t % 4, beat = t % (60 / 72);
        let v = 0; for (const f of c) v += Math.sin(2 * Math.PI * f * t) * 0.05 + Math.sin(4 * Math.PI * f * t) * 0.012;
        v *= (0.7 + 0.3 * Math.sin(2 * Math.PI * 4.5 * t)) * Math.min(1, u * 8) * Math.min(1, (4 - u) * 8);
        v += Math.sin(2 * Math.PI * (60 - beat * 40) * beat) * Math.exp(-beat * 18) * 0.3;
        d[i] = v + (Math.random() < 0.0004 ? n * 0.25 : n * 0.004);
      }
      else if (kind === 'meow') { // a cat: a voice of pulses through a mouth that opens "mi-a" and closes "-ow"
        const u = t / len;
        // the pitch: up from 560 Hz to about 820, then down to 520, with a little waver
        const f0 = 560 + 300 * Math.sin(Math.PI * Math.min(1, u * 1.25)) - 60 * u + 9 * Math.sin(2 * Math.PI * 5.5 * t) + 4 * n;
        ph += f0 / sr; if (ph >= 1) ph -= 1;
        const pulse = (ph < 0.4 ? Math.sin(Math.PI * ph / 0.4) : 0) - 0.25; // the glottis: a short open, a long shut
        // the mouth: two resonances that glide from "i" (F1 450, F2 2300) to "a" (900, 1600) to "u" (550, 1000)
        const m = u < 0.45 ? u / 0.45 : 1, w = u < 0.45 ? 0 : (u - 0.45) / 0.55;
        const F1 = 450 + 450 * m - 350 * w, F2 = 2300 - 700 * m - 600 * w;
        if (!res[ch]) res[ch] = [[0, 0], [0, 0]];
        let v = 0;
        for (const [k, F, bw, g] of [[0, F1, 120, 1], [1, F2, 180, 0.55]]) {
          const r = Math.exp(-Math.PI * bw / sr), c = 2 * r * Math.cos(2 * Math.PI * F / sr), st = res[ch][k];
          const y = (1 - r) * (pulse + 0.06 * n) + c * st[0] - r * r * st[1]; st[1] = st[0]; st[0] = y; v += g * y;
        }
        const env = Math.min(1, u / 0.08) * Math.pow(Math.max(0, 1 - u), 0.6) * (0.75 + 0.25 * Math.sin(Math.PI * Math.min(1, u * 1.6)));
        d[i] = v * env * 0.54;
      }
      else if (kind === 'thunk') d[i] = Math.sin(2 * Math.PI * (90 - t * 120) * t) * Math.exp(-t * 14) + n * 0.2 * Math.exp(-t * 60);
    }
  }
  return b;
}
