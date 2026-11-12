// The code of the music: one of the radio's lofi pieces plays, and its Csound score (music/<name>.sco)
// runs up the screen while it plays, the line at the reading head lit. The pieces are the radio's
// own tracks (config.radio, through this tape's `pieces` in config.tapes); the score's file is the
// track's name. A click on the screen goes to the next piece. The sound plays through audio.bus(),
// so the sound button mutes it, and stop() releases every node, fetch and timer it made.
import { FACES } from '../art.js';

let W, H, audio, bus, def;
let scores = {};            // name -> loader of the score's text (Vite's glob, made on mount)
let piece = 0, lines = [], buffer = null, source = null, t0 = 0, token = 0;
let stopped = true;

const name = (src) => src.split('/').pop().replace(/\.[^.]+$/, '');
const now = () => audio.ctx.currentTime;

function silence() {
  if (source) { try { source.stop(); } catch { /* already stopped */ } source.disconnect(); source = null; }
}

async function load(i) {
  const my = ++token;
  silence(); buffer = null; lines = [];
  const track = def.pieces[i], key = Object.keys(scores).find((k) => name(k) === name(track.src));
  try { lines = key ? (await scores[key]()).split('\n') : []; } catch { lines = []; }
  try {
    const res = await fetch(track.src);
    if (!res.ok) throw new Error(res.status);
    const b = await audio.ctx.decodeAudioData(await res.arrayBuffer());
    if (my !== token || stopped) return;
    buffer = b;
  } catch { buffer = null; } // no sound: the code still runs, at the score's own pace
  if (my !== token || stopped) return;
  t0 = now();
  if (buffer) {
    source = audio.ctx.createBufferSource(); source.buffer = buffer; source.connect(bus);
    source.onended = () => { if (!stopped && my === token) next(); };
    source.start();
  }
}

function next() { piece = (piece + 1) % def.pieces.length; load(piece); }

// a line of Csound, in colour: comments, statements, instrument names and numbers
function drawLine(ctx, text, x, y, lit) {
  const t = text.replace(/\t/g, '  ');
  if (/^\s*;/.test(t)) { ctx.fillStyle = lit ? '#c7b98a' : '#6f6a58'; ctx.fillText(t, x, y); return; }
  const parts = t.split(/(\s+|"[^"]*"|;.*$)/).filter(Boolean);
  for (const p of parts) {
    if (p.startsWith(';')) ctx.fillStyle = '#6f6a58';
    else if (p.startsWith('"')) ctx.fillStyle = '#ff9fb2';
    else if (/^[iftbsem]$/.test(p) || /^#\w+/.test(p)) ctx.fillStyle = '#ffb347';
    else if (/^-?[\d.]+$/.test(p)) ctx.fillStyle = lit ? '#e6fff0' : '#7dd3a6';
    else if (/^\$/.test(p)) ctx.fillStyle = '#9ec5ff';
    else ctx.fillStyle = lit ? '#ffffff' : '#c9d1d9';
    ctx.fillText(p, x, y); x += ctx.measureText(p).width;
  }
}

export default {
  mount(deps) {
    ({ width: W, height: H, audio } = deps);
    def = deps.config.tapes.find((t) => t.id === 'csound');
    scores = import.meta.glob('../../music/*.sco', { query: '?raw', import: 'default' });
    stopped = false; piece = 0;
    bus = audio.bus(); bus.gain.value = 0.9;
    load(piece);
  },

  frame(ctx) {
    const track = def.pieces[piece];
    const dur = buffer?.duration ?? Math.max(60, lines.length * 0.6);
    const s = Math.max(0, now() - t0);
    if (!buffer && s > dur && lines.length) next(); // silent: move on at the score's pace
    const p = Math.min(1, s / dur);

    ctx.fillStyle = '#0b0d12'; ctx.fillRect(0, 0, W, H);
    const LH = 18, top = 46, bottom = H - 28, head = top + (bottom - top) * 0.42;
    ctx.save(); ctx.beginPath(); ctx.rect(0, top, W, bottom - top); ctx.clip();
    ctx.font = `15px ${FACES.terminal}`; ctx.textBaseline = 'middle';
    const at = p * Math.max(0, lines.length - 1), first = Math.floor(at - (head - top) / LH) - 1;
    ctx.fillStyle = 'rgba(255,179,71,0.12)'; ctx.fillRect(0, head - LH / 2, W, LH);
    for (let i = Math.max(0, first); i < lines.length; i++) {
      const y = head + (i - at) * LH;
      if (y > bottom + LH) break;
      const lit = Math.round(at) === i;
      ctx.fillStyle = '#3a3f4b'; ctx.fillText(String(i + 1).padStart(3, ' '), 8, y);
      drawLine(ctx, lines[i], 46, y, lit);
    }
    ctx.restore();

    // the header: the piece, its file, and where the reading head is
    ctx.fillStyle = '#0b0d12'; ctx.fillRect(0, 0, W, top);
    ctx.font = `bold 17px ${FACES.terminal}`; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = '#ffb347';
    ctx.fillText(track.title, 12, 22);
    ctx.font = `12px ${FACES.terminal}`; ctx.fillStyle = '#7dd3a6';
    ctx.fillText(`${def.lang} · music/${name(track.src)}.sco · ${piece + 1}/${def.pieces.length}`, 12, 38);
    ctx.fillStyle = '#0b0d12'; ctx.fillRect(0, bottom, W, H - bottom);
    ctx.fillStyle = '#22262f'; ctx.fillRect(12, bottom + 12, W - 24, 3);
    ctx.fillStyle = '#ffb347'; ctx.fillRect(12, bottom + 12, (W - 24) * p, 3);
    ctx.fillStyle = '#6f6a58'; ctx.textAlign = 'right'; ctx.fillText(def.hint, W - 12, 22); ctx.textAlign = 'left';
  },

  input() { next(); },

  stop() {
    stopped = true; token++; silence();
    bus?.disconnect(); bus = null; buffer = null; lines = [];
  },
};
