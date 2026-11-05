// The score of the piabrota tape, as data. Two players read it:
//   scripts/compose.mjs renders it offline and mixes it with the room's
//   field recordings into public/audio/tape-piabrota.mp3;
//   src/tapes/piabrota.js plays it live in WebAudio when that file is
//   missing, so the tape always has its music (invariant 7).
//
// A slow pad in D that changes chord four times per chapter, and a small
// pentatonic bell at the start of each chapter. Pure functions, no DOM,
// no WebAudio, so Node can import it too.

const PROGRESSION = [
  [50, 57, 61, 64, 66], // Dmaj9
  [47, 54, 57, 62, 66], // Bm9 (no 9th doubled)
  [43, 50, 54, 59, 62], // Gmaj7
  [45, 52, 57, 59, 64], // Asus2
];
const BELL = [74, 78, 81, 83, 86, 88]; // D pentatonic, high

export const midiToHz = (m) => 440 * Math.pow(2, (m - 69) / 12);

// chapters: [{ seconds }]. Returns the start time of each chapter and
// every note event: { t, dur, midi, kind: 'pad' | 'bell', gain }.
export function score(chapters) {
  const starts = [];
  const events = [];
  let t = 0, step = 0;
  chapters.forEach((ch, i) => {
    starts.push(t);
    const len = ch.seconds / 4;
    for (let k = 0; k < 4; k++, step++) {
      const chord = PROGRESSION[step % PROGRESSION.length];
      for (const midi of chord) events.push({ t: t + k * len, dur: len + 1.5, midi, kind: 'pad', gain: 0.07 });
    }
    // three bell notes, walking up the pentatonic from a place set by the chapter
    for (let n = 0; n < 3; n++) {
      events.push({ t: t + 0.4 + n * 0.45, dur: 3, midi: BELL[(i + n * 2) % BELL.length], kind: 'bell', gain: 0.12 - n * 0.025 });
    }
    t += ch.seconds;
  });
  return { starts, events, duration: t };
}

// The pad's amplitude envelope: slow in, slow out, so chords overlap.
export function padEnvelope(x, dur) {
  const a = 1.2, r = 1.5;
  if (x < 0 || x > dur) return 0;
  if (x < a) return x / a;
  if (x > dur - r) return (dur - x) / r;
  return 1;
}
