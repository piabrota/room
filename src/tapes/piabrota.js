// The piabrota tape: a radio piece in chapters. The words and links are
// config.piabrotaTape; the music is public/audio/tape-piabrota.mp3
// (`just compose`), or, when that file is missing, the same score
// played live (src/score.js). Everything plays through audio.bus(), so
// the sound button mutes it, and stop() releases every node it made.
//
// On the screen: click a link to open it, click the bar at the bottom
// to jump to a chapter. The deck's REW and FF step a chapter back and on.
import { piabrotaTape } from '../config.js';
import { score, midiToHz } from '../score.js';

const { chapters } = piabrotaTape;
const { starts, events, duration } = score(chapters);

let W, H, audio, bus, analyser, levels;
let nodes = [];        // everything started for the current pass, stopped on seek or stop
let buffer = null;     // the decoded track, or null when playing the live score
let t0 = 0;            // audio clock time at which the piece's 0:00 played
let loading = null;    // the track's fetch, so stop() during it is safe
let stopped = true;
let boxes = [];        // clickable link rows of the chapter on screen
const BAR_Y = 352;

const now = () => audio.ctx.currentTime;
const pos = () => Math.max(0, now() - t0);
const chapterAt = (s) => { let i = 0; while (i + 1 < starts.length && starts[i + 1] <= s) i++; return i; };
const clock = (s) => [Math.floor(s / 3600), Math.floor(s / 60) % 60, Math.floor(s) % 60].map((n) => String(n).padStart(2, '0')).join(':');

async function loadTrack() {
  try {
    const res = await fetch(piabrotaTape.track.src);
    if (!res.ok) throw new Error(res.status);
    return await audio.ctx.decodeAudioData(await res.arrayBuffer());
  } catch {
    return null; // no file yet: the live score plays instead
  }
}

function silence() {
  for (const n of nodes) { try { n.stop?.(); } catch { /* already stopped */ } n.disconnect(); }
  nodes = [];
}

// Start the piece at `offset` seconds.
function play(offset) {
  silence();
  if (stopped) return;
  const ctx = audio.ctx;
  t0 = now() - offset;
  if (buffer) {
    const src = ctx.createBufferSource();
    src.buffer = buffer; src.connect(analyser); src.start(now(), offset);
    nodes.push(src);
  } else {
    live(offset);
  }
}

// The live score: pads and bells from src/score.js, and a soft hiss.
function live(offset) {
  const ctx = audio.ctx, at = now() - offset;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800; lp.connect(analyser);
  nodes.push(lp);
  for (const e of events) {
    if (e.t + e.dur < offset) continue;
    const start = Math.max(now(), at + e.t), end = at + e.t + e.dur;
    const g = ctx.createGain(); g.connect(e.kind === 'pad' ? lp : analyser); nodes.push(g);
    const partials = e.kind === 'pad' ? [[1, 'triangle', 1], [1.003, 'sine', 0.6]] : [[1, 'sine', 1], [2.76, 'sine', 0.25]];
    for (const [ratio, type, amp] of partials) {
      const o = ctx.createOscillator(), og = ctx.createGain();
      o.type = type; o.frequency.value = midiToHz(e.midi) * ratio; og.gain.value = amp;
      o.connect(og).connect(g); o.start(start); o.stop(end + 0.1);
      nodes.push(o, og);
    }
    g.gain.setValueAtTime(0, start);
    if (e.kind === 'pad') {
      g.gain.linearRampToValueAtTime(e.gain, Math.min(end, start + 1.2));
      g.gain.setValueAtTime(e.gain, Math.max(start, end - 1.5));
      g.gain.linearRampToValueAtTime(0, end);
    } else {
      g.gain.linearRampToValueAtTime(e.gain, start + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, end);
    }
  }
  // tape hiss, so the live score sounds like the same tape
  const n = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), d = n.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const hiss = ctx.createBufferSource(), hp = ctx.createBiquadFilter(), hg = ctx.createGain();
  hiss.buffer = n; hiss.loop = true; hp.type = 'highpass'; hp.frequency.value = 5000; hg.gain.value = 0.012;
  hiss.connect(hp).connect(hg).connect(analyser); hiss.start();
  nodes.push(hiss, hp, hg);
}

function text(ctx, s, x, y, font, color) { ctx.font = font; ctx.fillStyle = color; ctx.fillText(s, x, y); }

export default {
  mount(deps) {
    ({ width: W, height: H, audio } = deps);
    stopped = false; buffer = null; boxes = [];
    bus = audio.bus(); bus.gain.value = 0.9;
    analyser = audio.ctx.createAnalyser(); analyser.fftSize = 256; analyser.connect(bus);
    levels = new Uint8Array(analyser.frequencyBinCount);
    t0 = now();
    loading = loadTrack().then((b) => { loading = null; if (stopped) return; buffer = b; play(0); });
  },

  frame(ctx) {
    if (!loading && pos() >= duration) play(0); // the tape loops
    const s = loading ? 0 : pos(), i = chapterAt(s), ch = chapters[i];
    const local = s - starts[i];

    ctx.fillStyle = '#071019'; ctx.fillRect(0, 0, W, H);

    // the VCR's on-screen display
    text(ctx, loading ? '■ LOADING' : '▶ PLAY', 24, 34, 'bold 18px monospace', '#e8f1f8');
    text(ctx, `SP  ${clock(s)}`, W - 170, 34, 'bold 18px monospace', '#e8f1f8');

    // the chapter, fading in
    ctx.globalAlpha = Math.min(1, local / 0.8);
    text(ctx, `${String(i + 1).padStart(2, '0')}  ${ch.title}`, 24, 80, 'bold 24px monospace', '#5fb4f0');
    let y = 112;
    ch.lines.forEach((l, k) => {
      ctx.globalAlpha = Math.min(1, Math.max(0, (local - 0.6 - k * 0.5) / 0.6));
      text(ctx, l, 24, y, '16px monospace', '#d8e2ea'); y += 22;
    });
    y += 8; boxes = [];
    ch.links.forEach((l, k) => {
      ctx.globalAlpha = Math.min(1, Math.max(0, (local - 1.5 - k * 0.4) / 0.6));
      text(ctx, '> ' + l.label, 24, y, '14px monospace', '#f3d27a');
      boxes.push({ y0: y - 17, y1: y + 7, url: l.url }); y += 24;
    });
    ctx.globalAlpha = 1;

    // a level meter from the tape's own sound
    analyser.getByteFrequencyData(levels);
    for (let b = 0; b < 24; b++) {
      const v = levels[b * 2] / 255;
      ctx.fillStyle = `rgba(95,180,240,${0.25 + v * 0.6})`;
      ctx.fillRect(W - 24 - (24 - b) * 7, BAR_Y - 14 - v * 40, 5, v * 40 + 2);
    }

    // the timeline: one segment per chapter, click to jump
    ctx.fillStyle = '#1b2a38'; ctx.fillRect(24, BAR_Y, W - 48, 6);
    ctx.fillStyle = '#5fb4f0'; ctx.fillRect(24, BAR_Y, (W - 48) * (s / duration), 6);
    ctx.fillStyle = '#071019';
    for (const st of starts.slice(1)) ctx.fillRect(24 + (W - 48) * (st / duration) - 1, BAR_Y, 2, 6);
  },

  input({ type, x, y }) {
    if (type === 'rew' || type === 'ff') { // a chapter back (or to this one's start), or on
      if (loading) return;
      const i = chapterAt(pos()), to = type === 'ff' ? (i + 1) % chapters.length : pos() - starts[i] > 3 ? i : (i + chapters.length - 1) % chapters.length;
      play(starts[to]); return;
    }
    if (type !== 'click') return;
    if (y > BAR_Y - 12 && y < BAR_Y + 20 && !loading) {
      const s = ((x - 24) / (W - 48)) * duration;
      play(starts[chapterAt(Math.max(0, Math.min(duration - 0.01, s)))]);
      return;
    }
    const hit = boxes.find((b) => y >= b.y0 && y <= b.y1);
    if (hit) window.open(hit.url, '_blank', 'noopener');
  },

  stop() {
    stopped = true; silence();
    analyser?.disconnect(); bus?.disconnect();
    analyser = bus = null; buffer = null; boxes = [];
  },
};
