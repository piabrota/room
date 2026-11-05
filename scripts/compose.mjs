// `just compose [samples] [out]`: makes the room's sounds from four
// field recordings on freesound.org (all CC BY 4.0, see CREDITS.md) and
// the score of src/score.js.
//
//   ambience.mp3       a city at 3 a.m. with traffic far below, 2 min loop
//   rain.mp3           rain on a metal windowsill, 1 min loop
//   eject.mp3          a VHS cassette ejected from a video recorder
//   insert.mp3         the same, reversed: the cassette going in
//   tape-piabrota.mp3  the piabrota tape: the score, the rain and the city,
//                      and the VCR's clunk between chapters
//
// The recordings are not in the repository (156 MB of WAV for one of
// them). Download them from freesound into <samples> (default
// `samples/`, which git ignores) with the names freesound gives them:
// the script finds each by the sound's number in its file name. The
// freesound previews (MP3) work too, at a lower quality.
//
// Loop beds are cut with a crossfade at the seam, so they loop without
// a click, and normalized to -18 LUFS (invariant 7).
import { execFileSync } from 'node:child_process';
import { readdirSync, writeFileSync, mkdtempSync, rmSync, statSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { piabrotaTape } from '../src/config.js';
import { score, midiToHz, padEnvelope } from '../src/score.js';

const root = new URL('..', import.meta.url).pathname;
const samplesDir = resolve(process.argv[2] || join(root, 'samples'));
const outDir = resolve(process.argv[3] || join(root, 'public/audio'));
const SR = 44100;

const SOUNDS = {
  eject: { id: '267832', by: 'magedu', name: 'video_recorder_eject_cassette' },
  city: { id: '219877', by: 'klankbeeld', name: 'city hum 3am winter 140217_0090' },
  traffic: { id: '174242', by: 'klankbeeld', name: 'traffic along flat LONG 130104_00' },
  rain: { id: '350358', by: 'YleArkisto', name: 'Sade ikkunalaudalle / Rain on a metal windowsill' },
};

const files = existsSync(samplesDir) ? readdirSync(samplesDir) : [];
const missing = [];
for (const s of Object.values(SOUNDS)) {
  const f = files.find((n) => new RegExp(`(^|\\D)${s.id}(\\D|$)`).test(n));
  if (f) s.path = join(samplesDir, f); else missing.push(s);
}
if (missing.length) {
  console.error(`✗ missing in ${samplesDir}:`);
  for (const s of missing) console.error(`  ${s.id} by ${s.by}: "${s.name}", https://freesound.org/people/${s.by}/sounds/${s.id}/`);
  process.exit(1);
}

const tmp = mkdtempSync(join(tmpdir(), 'room-compose-'));
const ffmpeg = (args) => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });
const MP3 = ['-ar', String(SR), '-c:a', 'libmp3lame', '-b:a', '128k'];
const norm = (lufs) => `loudnorm=I=${lufs}:TP=-1.5:LRA=11,aresample=${SR},asetpts=N/SR/TB`;
const prep = (i, from, len) => `[${i}:a]atrim=${from}:${from + len},asetpts=N/SR/TB,aresample=${SR},aformat=sample_fmts=fltp:channel_layouts=stereo`;

// Cut `wav` (at least len + xf seconds) into a loop of `len` seconds:
// the first `xf` seconds are the crossfade of its start and of what
// follows `len`, so the last sample leads into the first.
function loop(wav, len, xf, out) {
  ffmpeg(['-t', String(xf), '-i', wav, '-ss', String(len), '-t', String(xf), '-i', wav, '-ss', String(xf), '-t', String(len - xf), '-i', wav,
    '-filter_complex', `[0:a]afade=t=in:d=${xf}[h];[1:a]afade=t=out:d=${xf}[t];[h][t]amix=inputs=2:normalize=0[x];[x][2:a]concat=n=2:v=0:a=1,asetpts=N/SR/TB,${norm(-18)}[o]`,
    '-map', '[o]', ...MP3, out]);
}

try {
  // 1. ambience: the city hum (before the heating outlet at 3:40) with
  //    the far traffic of Breda, low-passed, under it
  ffmpeg(['-i', SOUNDS.city.path, '-i', SOUNDS.traffic.path, '-filter_complex', [
    `${prep(0, 30, 126)}[c]`,
    `${prep(1, 120, 126)},lowpass=f=700,volume=-9dB[tr]`,
    `[c][tr]amix=inputs=2:normalize=0[o]`,
  ].join(';'), '-map', '[o]', join(tmp, 'city.wav')]);
  loop(join(tmp, 'city.wav'), 120, 6, join(outDir, 'ambience.mp3'));

  // 2. rain on the windowsill
  ffmpeg(['-i', SOUNDS.rain.path, '-filter_complex', `${prep(0, 20, 64)}[o]`, '-map', '[o]', join(tmp, 'rain.wav')]);
  loop(join(tmp, 'rain.wav'), 60, 4, join(outDir, 'rain.mp3'));

  // 3. eject and insert: the cassette, trimmed, and the cassette reversed
  const clunk = `[0:a]aresample=${SR},silenceremove=start_periods=1:start_threshold=-50dB,${norm(-16)}`;
  ffmpeg(['-i', SOUNDS.eject.path, '-filter_complex', `${clunk},areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse[o]`, '-map', '[o]', '-ac', '1', ...MP3, join(outDir, 'eject.mp3')]);
  ffmpeg(['-i', join(outDir, 'eject.mp3'), '-af', 'areverse', '-ac', '1', ...MP3, join(outDir, 'insert.mp3')]);

  // 4. the piabrota tape: render the score, then mix it with the room
  const { starts, events, duration } = score(piabrotaTape.chapters);
  const n = Math.ceil(duration * SR), L = new Float32Array(n), R = new Float32Array(n);
  for (const e of events) {
    const f = midiToHz(e.midi), i0 = Math.floor(e.t * SR), i1 = Math.min(n, Math.ceil((e.t + e.dur) * SR));
    const pan = e.kind === 'pad' ? 0.5 + ((e.midi % 5) - 2) * 0.12 : 0.5 + ((e.midi % 3) - 1) * 0.3;
    for (let i = i0; i < i1; i++) {
      const x = (i - i0) / SR, w = 2 * Math.PI * f * x;
      let v;
      if (e.kind === 'pad') {
        // a soft triangle and a sine 5 cents above it
        v = (Math.sin(w) - Math.sin(3 * w) / 9 + Math.sin(5 * w) / 25 + 0.6 * Math.sin(w * 1.003)) * padEnvelope(x, e.dur);
      } else {
        v = (Math.sin(w) + 0.25 * Math.sin(w * 2.76)) * Math.min(1, x / 0.01) * Math.exp(-x * 9.2 / e.dur);
      }
      v *= e.gain; L[i] += v * (1 - pan); R[i] += v * pan;
    }
  }
  const pcm = Buffer.alloc(n * 8);
  for (let i = 0; i < n; i++) { pcm.writeFloatLE(L[i], i * 8); pcm.writeFloatLE(R[i], i * 8 + 4); }
  const scorePath = join(tmp, 'score.f32');
  writeFileSync(scorePath, pcm);

  const clunks = starts.slice(1).map((s, k) => `[c${k}]adelay=${Math.round((s - 0.3) * 1000)}:all=1[d${k}]`);
  ffmpeg([
    '-f', 'f32le', '-ar', String(SR), '-ac', '2', '-i', scorePath,
    '-i', SOUNDS.rain.path, '-i', SOUNDS.city.path, '-i', join(outDir, 'eject.mp3'),
    '-filter_complex', [
      `[0:a]lowpass=f=2400,aecho=0.8:0.7:420|660:0.25|0.18[pad]`,
      `${prep(1, 100, duration)},highpass=f=300,volume=-17dB[rain]`,
      `${prep(2, 250, duration)},volume=-12dB[city]`,
      `[3:a]aresample=${SR},aformat=channel_layouts=stereo,volume=-8dB,asplit=${starts.length - 1}${starts.slice(1).map((_, k) => `[c${k}]`).join('')}`,
      ...clunks,
      `[pad][rain][city]${starts.slice(1).map((_, k) => `[d${k}]`).join('')}amix=inputs=${3 + starts.length - 1}:normalize=0:duration=first[m]`,
      `[m]afade=t=in:d=3,afade=t=out:st=${duration - 4}:d=4,${norm(-18)}[o]`,
    ].join(';'),
    '-map', '[o]', '-t', String(duration), ...MP3, join(outDir, 'tape-piabrota.mp3'),
  ]);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

for (const f of ['ambience', 'rain', 'eject', 'insert', 'tape-piabrota']) {
  console.log(`✓ ${f}.mp3  ${(statSync(join(outDir, `${f}.mp3`)).size / 1024 / 1024).toFixed(2)} MB`);
}
