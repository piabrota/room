// `just brasil`: renders the "lofi brasil" station of piabrota RADIO,
// four short pieces of bossa-nova lofi written in code for this room
// (the owner's, CC BY 4.0 like the rest of the room's sound). Each piece
// is its own progression and key; the comping is a nylon guitar
// (Karplus-Strong plucks) on a bossa rhythm, under a soft electric piano,
// a walking bass on the root and the fifth, a brushed kit and a few notes
// of melody. No noise bed: the hiss and crackle of lofi are left out.
//
//   public/audio/radio/brasil-<id>.mp3, normalized to -18 LUFS
//
// The pieces are seeded, so a render is the same every time.
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { radio } from '../src/config.js';

const root = new URL('..', import.meta.url).pathname;
const SR = 44100;

function mulberry(a) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const hz = (m) => 440 * 2 ** ((m - 69) / 12);

// chord qualities, as intervals from the root
const Q = {
  maj9: [0, 4, 7, 11, 14], m9: [0, 3, 7, 10, 14], '9': [0, 4, 7, 10, 14], '13': [0, 4, 10, 14, 21],
  m7b5: [0, 3, 6, 10], '7b9': [0, 4, 7, 10, 13], m6: [0, 3, 7, 9, 14], '69': [0, 4, 7, 9, 14],
};

// The pieces: a key (MIDI root of the tonic), a tempo and a progression of
// [degree in semitones from the tonic, quality, bars]. Written for the room.
export const pieces = [
  { id: 'urca', title: 'Urca, depois da chuva', key: 50, bpm: 82, seed: 3,
    prog: [[0, 'maj9', 2], [9, 'm9', 2], [2, 'm9', 2], [7, '13', 2], [4, 'm9', 2], [9, '7b9', 2], [2, 'm9', 2], [7, '13', 2]] },
  { id: 'botafogo', title: 'Botafogo às duas', key: 45, bpm: 78, seed: 7,
    prog: [[0, 'm9', 2], [5, '9', 2], [10, 'maj9', 2], [3, 'maj9', 2], [8, 'maj9', 1], [2, 'm7b5', 1], [7, '7b9', 2], [0, 'm6', 2], [7, '7b9', 2]] },
  { id: 'leme', title: 'Leme, maré baixa', key: 53, bpm: 86, seed: 11,
    prog: [[0, '69', 2], [5, '9', 2], [0, '69', 2], [2, 'm9', 1], [7, '13', 1], [4, 'm9', 2], [9, '7b9', 2], [2, 'm9', 2], [7, '13', 2]] },
  { id: 'santa-teresa', title: 'Bonde em Santa Teresa', key: 48, bpm: 80, seed: 19,
    prog: [[0, 'maj9', 2], [1, '9', 2], [2, 'm9', 2], [7, '13', 2], [0, 'maj9', 2], [8, '9', 2], [7, '13', 2], [7, '7b9', 2]] },
];

function render(p) {
  const rnd = mulberry(p.seed), beat = 60 / p.bpm, bar = beat * 4;
  const loopBars = p.prog.reduce((a, c) => a + c[2], 0), loops = Math.max(4, Math.ceil(150 / (loopBars * bar)));
  const total = loops * loopBars * bar + 4, N = Math.ceil(total * SR);
  const L = new Float32Array(N), R = new Float32Array(N);
  const add = (buf, i, v) => { if (i >= 0 && i < N) buf[i] += v; };

  // nylon guitar: Karplus-Strong, a soft pluck with a warm decay
  function pluck(t, m, vel, pan) {
    const f = hz(m), period = Math.round(SR / f), len = Math.floor(SR * 2.4);
    const ring = new Float32Array(period); for (let i = 0; i < period; i++) ring[i] = (rnd() * 2 - 1) * vel;
    let lp = 0; for (let i = 0; i < period; i++) { lp += (ring[i] - lp) * 0.5; ring[i] = lp; } // a soft attack: thumb, not pick
    const s = Math.floor(t * SR);
    for (let i = 0, k = 0; i < len; i++, k = (k + 1) % period) {
      const nxt = (k + 1) % period, v = ring[k];
      ring[k] = 0.4985 * (v + ring[nxt]);
      add(L, s + i, v * (1 - pan) * 0.9); add(R, s + i, v * pan * 0.9);
    }
  }
  // electric piano: two sines, a little FM, a slow tremolo
  function epiano(t, dur, ms, vel) {
    const s = Math.floor(t * SR), n = Math.floor((dur + 0.8) * SR);
    for (const m of ms) {
      const f = hz(m), ph = rnd() * 6.28;
      for (let i = 0; i < n; i++) {
        const tt = i / SR, env = Math.min(1, tt * 40) * Math.exp(-tt * 1.1) * (tt > dur ? Math.exp(-(tt - dur) * 6) : 1);
        const v = Math.sin(2 * Math.PI * f * tt + ph + 0.6 * Math.exp(-tt * 3) * Math.sin(2 * Math.PI * f * 2 * tt)) * env * vel * (0.85 + 0.15 * Math.sin(2 * Math.PI * 4.2 * (t + tt)));
        add(L, s + i, v * 0.35); add(R, s + i, v * 0.65);
      }
    }
  }
  function bass(t, m, dur) {
    const f = hz(m), s = Math.floor(t * SR), n = Math.floor((dur + 0.2) * SR);
    for (let i = 0; i < n; i++) {
      const tt = i / SR, env = Math.min(1, tt * 200) * Math.exp(-tt * 2.2) * (tt > dur ? Math.exp(-(tt - dur) * 20) : 1);
      const v = (Math.sin(2 * Math.PI * f * tt) + 0.25 * Math.sin(4 * Math.PI * f * tt)) * env * 0.42;
      add(L, s + i, v); add(R, s + i, v);
    }
  }
  function kick(t) {
    const s = Math.floor(t * SR);
    for (let i = 0; i < SR * 0.3; i++) { const tt = i / SR, v = Math.sin(2 * Math.PI * (55 + 60 * Math.exp(-tt * 30)) * tt) * Math.exp(-tt * 9) * 0.5; add(L, s + i, v); add(R, s + i, v); }
  }
  function rim(t, vel) { // a stick on the rim: a short, pitched click
    const s = Math.floor(t * SR);
    for (let i = 0; i < SR * 0.06; i++) { const tt = i / SR, v = (Math.sin(2 * Math.PI * 1700 * tt) * 0.6 + Math.sin(2 * Math.PI * 820 * tt) * 0.4) * Math.exp(-tt * 90) * vel; add(L, s + i, v * 0.7); add(R, s + i, v * 0.4); }
  }
  function brush(t, vel) { // a brush on the snare: filtered, soft and short
    const s = Math.floor(t * SR); let lp = 0, hp = 0;
    for (let i = 0; i < SR * 0.12; i++) { const tt = i / SR, n = rnd() * 2 - 1; lp += (n - lp) * 0.3; hp = lp - hp * 0.2; const v = hp * Math.exp(-tt * 35) * vel * 0.12; add(L, s + i, v * 0.4); add(R, s + i, v * 0.7); }
  }
  function flute(t, m, dur, vel) {
    const f = hz(m), s = Math.floor(t * SR), n = Math.floor((dur + 0.3) * SR);
    for (let i = 0; i < n; i++) {
      const tt = i / SR, env = Math.min(1, tt * 12) * (tt > dur ? Math.exp(-(tt - dur) * 10) : 1) * 0.9, vib = 1 + 0.004 * Math.sin(2 * Math.PI * 5 * tt) * Math.min(1, tt * 2);
      const v = (Math.sin(2 * Math.PI * f * vib * tt) + 0.12 * Math.sin(4 * Math.PI * f * vib * tt)) * env * vel;
      add(L, s + i, v * 0.55); add(R, s + i, v * 0.45);
    }
  }

  // the bossa rhythm in eighths over two bars: bass on 1 and 3 (root, fifth),
  // the guitar's chord on the syncopations
  const comp = [0, 3, 6, 10, 13]; // eighth notes of a two-bar clave
  let t0 = 1, mel = 0;
  for (let loop = 0; loop < loops; loop++) {
    for (const [deg, q, bars] of p.prog) {
      const rootM = p.key + deg, iv = Q[q];
      const voicing = iv.slice(1).map((x) => rootM + 12 + x).map((m) => (m > p.key + 30 ? m - 12 : m));
      for (let b = 0; b < bars; b++) {
        const tb = t0 + b * bar;
        bass(tb, rootM - 12, beat * 1.4); bass(tb + 2 * beat, rootM - 12 + 7, beat * 1.4);
        if (loop > 0 || b > 0) { kick(tb); kick(tb + 2 * beat); }
        for (let e = 0; e < 8; e++) { if (loop > 0) brush(tb + e * beat / 2 + (e % 2 ? 0.02 : 0), e % 2 ? 0.6 : 1); }
        if (loop > 0) for (const e of [3, 6]) rim(tb + e * beat / 2, 0.25);
      }
      for (let e = 0; e < bars * 8; e++) {
        if (!comp.includes(e % 16)) continue;
        const tt = t0 + e * beat / 2;
        voicing.forEach((m, k) => pluck(tt + k * 0.008, m, 0.45, 0.3));
      }
      epiano(t0, bars * bar * 0.95, voicing.map((m) => m + 12), loop === 0 ? 0.05 : 0.07);
      // a melody on the middle loops: chord tones, a step at a time, with rests
      if (loop > 0 && loop < loops - 1) {
        const tones = iv.map((x) => rootM + 24 + x);
        for (let e = 0; e < bars * 4; e++) {
          if (rnd() < 0.45) continue;
          mel = Math.max(0, Math.min(tones.length - 1, mel + (rnd() < 0.5 ? -1 : 1)));
          flute(t0 + e * beat + (rnd() < 0.3 ? beat / 2 : 0), tones[mel], beat * (rnd() < 0.3 ? 1.6 : 0.8), 0.07);
        }
      }
      t0 += bars * bar;
    }
  }
  // the lofi part: a gentle low-pass and tape saturation, no hiss
  let l1 = 0, r1 = 0;
  const out = new Float32Array(N * 2);
  for (let i = 0; i < N; i++) {
    l1 += (L[i] - l1) * 0.28; r1 += (R[i] - r1) * 0.28;
    const fade = Math.min(1, i / (SR * 1.5), (N - i) / (SR * 3));
    out[i * 2] = Math.tanh(l1 * 1.2) * fade; out[i * 2 + 1] = Math.tanh(r1 * 1.2) * fade;
  }
  return out;
}

const tmp = mkdtempSync(join(tmpdir(), 'brasil-'));
const only = process.argv[2];
for (const p of pieces) {
  if (only && p.id !== only) continue;
  const raw = join(tmp, `${p.id}.f32`);
  writeFileSync(raw, Buffer.from(render(p).buffer));
  const dst = join(root, 'public/audio/radio', `brasil-${p.id}.mp3`);
  execFileSync('ffmpeg', ['-nostdin', '-hide_banner', '-loglevel', 'error', '-y', '-f', 'f32le', '-ar', String(SR), '-ac', '2', '-i', raw,
    '-af', 'loudnorm=I=-18:TP=-1.5:LRA=11', '-ar', '44100', '-c:a', 'libmp3lame', '-b:a', '96k', dst]);
  console.log(`✓ ${dst.slice(root.length)} (${p.title})`);
}
rmSync(tmp, { recursive: true, force: true });
if (!radio.stations?.some((s) => s.id === 'brasil')) console.log('note: add the pieces to config.radio, station "brasil"');
