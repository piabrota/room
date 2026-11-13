import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { ROOM } from './shell.js';
import { FONT_TITLE, FONT_MONO, FACES } from './art.js';

// What makes the room lived in, and old: the things of a flat in Rio that someone works in, built
// here in metres, and the marks the years left on its walls and its floor.
//
//   the things   a standing lamp by the sofa, a pedestal fan by the desk, a coat rack by the door
//                with an umbrella and a bag, a pair of sandals, a door mat, a window air conditioner
//                high on the left wall, a calendar, a switch and sockets with their cables, a power
//                strip under the desk, a waste basket, magazines and a mug on the low table, newspapers
//                beside it, a receiver, a turntable and two speakers on the cabinet of card drawers,
//                record sleeves against it, a pile of books by the armchair
//   the marks    damp under the cornice and on the ceiling, hairline cracks, the paler rectangle
//                where a picture hung, rust under the air conditioner, grime above the skirting and
//                round the switch, scuffs on the skirting, paths worn pale on the floor, dirt along
//                its edges, a ring where a pot stood, and the soft shadow under each new thing
//
// Every word on them is `config.lived`. The things are drawn on one picture (an atlas) and merged
// into the room's static parts: one draw call for all of them, however many there are. The marks
// are flat pieces a millimetre off the wall, on a second picture with alpha: one more draw call.
// They are lit like the wall they lie on, so a stain is dark by night and by day. The lamp's shade
// is a mesh of its own (`stand_shade`), because it glows in the evening (src/room.js).

function mulberry(a) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// ── the things' picture: where each drawing is, in a square of 1024 ──
const CELLS = {
  news: [0, 0, 256, 352], mag0: [256, 0, 192, 256], mag1: [448, 0, 192, 256], mag2: [640, 0, 192, 256], mag3: [832, 0, 192, 256],
  cal: [256, 256, 224, 320], ac: [480, 256, 320, 208], speaker: [800, 256, 224, 320],
  sleeve0: [0, 352, 224, 224], sleeve1: [0, 576, 224, 224], deck: [224, 576, 320, 256], disc: [544, 576, 224, 224],
  mat: [480, 464, 320, 112], switch: [768, 576, 96, 128], socket: [864, 576, 96, 128],
  spine0: [0, 800, 384, 26], spine1: [0, 826, 384, 26], spine2: [0, 852, 384, 26], spine3: [0, 878, 384, 26], spine4: [0, 904, 384, 26],
  edge: [384, 832, 256, 64], hifi: [640, 800, 320, 96],
};
const SWATCHES = {
  cream: '#cfc5ad', black: '#17171a', dark: '#34343a', metal: '#8f9196', enamel: '#e4e0d4', blade: '#6f8fa6', cable: '#d8d0bd',
  strap: '#2456a8', sole: '#e9e4d6', bin: '#5c6b4a', paper: '#e6e1d2', card: '#9a7c55', coffee: '#2a1a12', canvas: '#b9a988', rubber: '#1f1f22', plug: '#b9b09a',
};
Object.keys(SWATCHES).forEach((k, i) => { CELLS[k] = [i * 64, 960, 64, 64]; });

function thingsAtlas(words, size) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const ctx = c.getContext('2d'), r = mulberry(41);
  ctx.scale(size / 1024, size / 1024);
  ctx.fillStyle = '#777'; ctx.fillRect(0, 0, 1024, 1024);
  const cell = (name, draw) => { const [x, y, w, h] = CELLS[name]; ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.translate(x, y); draw(w, h); ctx.restore(); };
  const text = (s, x, y, px, font, color, align = 'left', max) => { ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; let p = px; do { ctx.font = `${p}px ${font}`; p -= 1; } while (max && ctx.measureText(s).width > max && p > 6); ctx.fillText(s, x, y); };
  const speckle = (w, h, n, color, a) => { ctx.fillStyle = color; for (let i = 0; i < n; i++) { ctx.globalAlpha = a * r(); ctx.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); } ctx.globalAlpha = 1; };
  for (const [k, color] of Object.entries(SWATCHES)) cell(k, (w, h) => { ctx.fillStyle = color; ctx.fillRect(0, 0, w, h); speckle(w, h, 60, '#000', 0.06); });

  // the newspaper, folded once: its head, a headline, a picture, columns
  const n = words.paper;
  cell('news', (w, h) => {
    ctx.fillStyle = '#d6cfb8'; ctx.fillRect(0, 0, w, h);
    text(n.name, w / 2, 34, 26, FACES.typewriter, '#1d1a16', 'center', w - 20);
    ctx.fillStyle = '#1d1a16'; ctx.fillRect(10, 42, w - 20, 2); ctx.fillRect(10, 58, w - 20, 1);
    text(n.date, w / 2, 54, 9, FONT_MONO, '#3a352d', 'center', w - 24);
    text(n.head, 12, 92, 28, FONT_TITLE, '#16130f', 'left', w - 24);
    text(n.sub, 12, 108, 9, FONT_MONO, '#3a352d', 'left', w - 24);
    const g = ctx.createLinearGradient(0, 120, 0, 210); g.addColorStop(0, '#8f8c82'); g.addColorStop(0.55, '#5d5b55'); g.addColorStop(1, '#3d3c39');
    ctx.fillStyle = g; ctx.fillRect(12, 120, 138, 92);
    ctx.fillStyle = '#2c2b29'; ctx.beginPath(); ctx.moveTo(12, 190); ctx.quadraticCurveTo(60, 140, 96, 176); ctx.quadraticCurveTo(120, 160, 150, 186); ctx.lineTo(150, 212); ctx.lineTo(12, 212); ctx.fill(); // a hill over the water
    ctx.fillStyle = 'rgba(40,36,30,0.55)';
    for (let col = 0; col < 3; col++) for (let y = col === 2 ? 122 : 222; y < h - 10; y += 5) ctx.fillRect(12 + col * 80, y, 66 - r() * 14, 1.6);
    const fold = ctx.createLinearGradient(0, h / 2 - 8, 0, h / 2 + 8); fold.addColorStop(0, 'rgba(0,0,0,0)'); fold.addColorStop(0.5, 'rgba(60,50,30,0.16)'); fold.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = fold; ctx.fillRect(0, h / 2 - 8, w, 16);
    speckle(w, h, 200, '#7a6a40', 0.1);
  });
  // the magazines: a title, a plain drawing, a line
  words.magazines.slice(0, 4).forEach((m, i) => cell(`mag${i}`, (w, h) => {
    ctx.fillStyle = m.color; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = m.ink ?? '#f3ead6';
    ctx.globalAlpha = 0.9;
    if (i % 4 === 0) for (let k = 0; k < 4; k++) { ctx.beginPath(); for (let x = 0; x <= w; x += 6) ctx.lineTo(x, 150 + k * 22 + Math.sin(x * 0.08 + k) * 7); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.globalAlpha = 0.22; ctx.fill(); }
    else if (i % 4 === 1) { ctx.globalAlpha = 0.85; ctx.fillRect(40, 96, 112, 72); ctx.fillStyle = m.color; for (const x of [70, 122]) { ctx.beginPath(); ctx.arc(x, 132, 15, 0, 7); ctx.fill(); } }
    else if (i % 4 === 2) { ctx.globalAlpha = 0.8; ctx.lineWidth = 5; ctx.strokeStyle = ctx.fillStyle; ctx.beginPath(); ctx.moveTo(30, 200); ctx.lineTo(30, 140); ctx.lineTo(90, 140); ctx.lineTo(90, 110); ctx.lineTo(160, 110); ctx.stroke(); for (const [x, y] of [[30, 200], [90, 140], [160, 110]]) { ctx.beginPath(); ctx.arc(x, y, 9, 0, 7); ctx.fill(); } }
    else { ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.arc(w / 2, 140, 46, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1;
    text(m.title, 12, 58, 50, FONT_TITLE, m.ink ?? '#f3ead6', 'left', w - 24);
    text(m.line, 12, h - 16, 11, FONT_MONO, m.ink ?? '#f3ead6', 'left', w - 24);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(r() * w, r() * h); ctx.lineTo(r() * w, r() * h); ctx.stroke(); } // the creases of a magazine that was read
  }));
  // the calendar: a picture of a hill by the sea, the shop that gave it, the month
  const cal = words.calendar;
  cell('cal', (w, h) => {
    ctx.fillStyle = '#e9e2cf'; ctx.fillRect(0, 0, w, h);
    const sky = ctx.createLinearGradient(0, 8, 0, 120); sky.addColorStop(0, '#7fb1d6'); sky.addColorStop(1, '#f0d9a8');
    ctx.fillStyle = sky; ctx.fillRect(8, 8, w - 16, 118);
    ctx.fillStyle = '#2f7f9a'; ctx.fillRect(8, 96, w - 16, 30);
    ctx.fillStyle = '#39543a'; ctx.beginPath(); ctx.moveTo(8, 104); ctx.quadraticCurveTo(70, 20, 110, 92); ctx.quadraticCurveTo(140, 70, 176, 100); ctx.lineTo(176, 110); ctx.lineTo(8, 112); ctx.fill();
    ctx.fillStyle = '#a3261d'; ctx.fillRect(8, 130, w - 16, 34);
    text(cal.top, w / 2, 148, 15, FONT_TITLE, '#f6eedc', 'center', w - 28); text(cal.line, w / 2, 160, 7, FONT_MONO, '#f6eedc', 'center', w - 28);
    text(cal.month, w / 2, 190, 20, FONT_TITLE, '#2a2520', 'center', w - 20);
    const cw = (w - 28) / 7;
    cal.weekdays.forEach((d, i) => text(d, 14 + cw * (i + 0.5), 208, 9, FONT_MONO, i === 0 ? '#a3261d' : '#5a5246', 'center'));
    for (let d = 1; d <= cal.days; d++) { const k = d - 1 + cal.starts; text(String(d), 14 + cw * ((k % 7) + 0.5), 226 + Math.floor(k / 7) * 17, 12, FONT_MONO, k % 7 === 0 ? '#a3261d' : '#2a2520', 'center'); }
    ctx.fillStyle = 'rgba(120,100,60,0.12)'; ctx.fillRect(0, h - 26, w, 26); speckle(w, h, 120, '#7a6a40', 0.1);
  });
  // the air conditioner's front: louvres, and a panel in fake wood with two knobs
  cell('ac', (w, h) => {
    ctx.fillStyle = '#cdc3a9'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#b8ae94'; ctx.fillRect(8, 8, 206, h - 16);
    for (let y = 16; y < h - 14; y += 9) { ctx.fillStyle = '#4c473c'; ctx.fillRect(14, y, 194, 4); ctx.fillStyle = '#e0d8c2'; ctx.fillRect(14, y + 4, 194, 1.5); }
    ctx.fillStyle = '#b8ae94'; ctx.fillRect(108, 8, 5, h - 16);
    const wd = ctx.createLinearGradient(222, 0, 312, 0); wd.addColorStop(0, '#6b4a2e'); wd.addColorStop(0.5, '#7d5937'); wd.addColorStop(1, '#5d3f27');
    ctx.fillStyle = wd; ctx.fillRect(222, 8, 90, h - 16);
    ctx.strokeStyle = 'rgba(40,24,12,0.4)'; ctx.lineWidth = 1; for (let k = 0; k < 14; k++) { const x = 224 + r() * 86; ctx.beginPath(); ctx.moveTo(x, 8); ctx.lineTo(x + r() * 4 - 2, h - 8); ctx.stroke(); }
    for (const y of [66, 132]) { ctx.fillStyle = '#1c1b1a'; ctx.beginPath(); ctx.arc(267, y, 21, 0, 7); ctx.fill(); ctx.fillStyle = '#b9b6ae'; ctx.beginPath(); ctx.arc(267, y, 13, 0, 7); ctx.fill(); ctx.fillStyle = '#1c1b1a'; ctx.fillRect(265, y - 13, 4, 12); }
    text(words.ac.brand, 267, 184, 12, FONT_TITLE, '#e9dcc0', 'center', 80);
    ctx.fillStyle = 'rgba(90,70,30,0.10)'; ctx.fillRect(0, 0, w, h); speckle(w, h, 160, '#5a4a2a', 0.12);
  });
  // a loudspeaker: brown cloth in a wooden frame
  cell('speaker', (w, h) => {
    ctx.fillStyle = '#5a3d28'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#2b2520'; ctx.fillRect(12, 12, w - 24, h - 24);
    ctx.globalAlpha = 0.25; ctx.fillStyle = '#6b5a48'; for (let y = 12; y < h - 12; y += 3) ctx.fillRect(12, y, w - 24, 1); for (let x = 12; x < w - 12; x += 3) ctx.fillRect(x, 12, 1, h - 24); ctx.globalAlpha = 1;
    for (const [cy, rad] of [[104, 30], [214, 62]]) { const sh = ctx.createRadialGradient(w / 2, cy, rad * 0.2, w / 2, cy, rad); sh.addColorStop(0, 'rgba(0,0,0,0.28)'); sh.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = sh; ctx.fillRect(0, cy - rad, w, rad * 2); } // the cones, seen through the cloth
    ctx.fillStyle = '#b9a676'; ctx.fillRect(w / 2 - 22, h - 34, 44, 10); text(words.stereo.brand, w / 2, h - 26, 8, FONT_MONO, '#2b2520', 'center', 40);
  });
  // two record sleeves
  words.sleeves.slice(0, 2).forEach((s, i) => cell(`sleeve${i}`, (w, h) => {
    const [a, b, d] = s.colors;
    ctx.fillStyle = a; ctx.fillRect(0, 0, w, h);
    if (i === 0) { ctx.fillStyle = b; ctx.beginPath(); ctx.arc(w * 0.62, h * 0.56, 70, 0, 7); ctx.fill(); ctx.fillStyle = d; ctx.beginPath(); ctx.arc(w * 0.4, h * 0.62, 46, 0, 7); ctx.fill(); }
    else { for (let k = 0; k < 6; k++) { ctx.fillStyle = k % 2 ? b : d; ctx.fillRect(0, 70 + k * 24, w, 13); } }
    text(s.title, 14, 40, 26, FONT_TITLE, d, 'left', w - 28); text(s.by, 14, 56, 10, FONT_MONO, d, 'left', w - 28);
    ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(w / 2, h / 2, 86, 0, 7); ctx.stroke(); // the ring the record wore into the card
    speckle(w, h, 150, '#fff', 0.1);
  }));
  // the turntable from above: its plinth, the strip of controls
  cell('deck', (w, h) => {
    ctx.fillStyle = '#26221f'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#9d9a92'; ctx.fillRect(w - 62, 10, 52, h - 20);
    ctx.fillStyle = '#26221f'; for (const y of [40, 76]) { ctx.beginPath(); ctx.arc(w - 36, y, 11, 0, 7); ctx.fill(); }
    ctx.fillRect(w - 40, 120, 8, 96); ctx.fillStyle = '#d8d4c8'; ctx.fillRect(w - 46, 150, 20, 12);
    text('33', w - 52, 100, 9, FONT_MONO, '#26221f'); text('45', w - 30, 100, 9, FONT_MONO, '#26221f');
    speckle(w, h, 120, '#fff', 0.05);
  });
  // a record: grooves, and a label
  cell('disc', (w, h) => {
    ctx.fillStyle = '#0e0e10'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1; for (let rad = 44; rad < 108; rad += 3) { ctx.beginPath(); ctx.arc(w / 2, h / 2, rad, 0, 7); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(255,255,255,0.10)'; ctx.lineWidth = 14; ctx.beginPath(); ctx.arc(w / 2, h / 2, 76, -0.9, -0.3); ctx.stroke(); ctx.beginPath(); ctx.arc(w / 2, h / 2, 76, 2.2, 2.8); ctx.stroke(); // the light across the grooves
    ctx.fillStyle = words.sleeves[0].colors[1]; ctx.beginPath(); ctx.arc(w / 2, h / 2, 38, 0, 7); ctx.fill();
    ctx.fillStyle = '#e9e2cf'; ctx.beginPath(); ctx.arc(w / 2, h / 2, 4, 0, 7); ctx.fill();
  });
  // the door mat: coir, a darker border
  cell('mat', (w, h) => {
    ctx.fillStyle = '#7d6238'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#4a3a22'; ctx.lineWidth = 7; ctx.strokeRect(12, 12, w - 24, h - 24);
    for (let i = 0; i < 2600; i++) { const v = r(); ctx.fillStyle = v > 0.5 ? 'rgba(170,140,90,0.35)' : 'rgba(50,36,18,0.35)'; ctx.fillRect(r() * w, r() * h, 1, 2 + r() * 3); }
    const worn = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, 110); worn.addColorStop(0, 'rgba(60,48,30,0.4)'); worn.addColorStop(1, 'rgba(60,48,30,0)'); ctx.fillStyle = worn; ctx.fillRect(0, 0, w, h);
  });
  // a switch and a socket: yellowed plates, two screws each
  const plate = (w, h) => {
    ctx.fillStyle = '#d6cbb0'; ctx.fillRect(0, 0, w, h); ctx.strokeStyle = '#a89c80'; ctx.lineWidth = 2; ctx.strokeRect(3, 3, w - 6, h - 6);
    for (const y of [14, h - 14]) { ctx.fillStyle = '#8d8a80'; ctx.beginPath(); ctx.arc(w / 2, y, 4, 0, 7); ctx.fill(); ctx.fillStyle = '#4a4740'; ctx.fillRect(w / 2 - 3.5, y - 0.7, 7, 1.4); }
  };
  cell('switch', (w, h) => { plate(w, h); ctx.fillStyle = '#8f856c'; ctx.fillRect(w / 2 - 15, h / 2 - 25, 30, 50); ctx.fillStyle = '#e6dcc2'; ctx.fillRect(w / 2 - 12, h / 2 - 22, 24, 30); ctx.fillStyle = '#c7bca0'; ctx.fillRect(w / 2 - 12, h / 2 + 8, 24, 14); ctx.fillStyle = 'rgba(70,55,35,0.22)'; ctx.beginPath(); ctx.ellipse(w / 2, h / 2 + 4, 26, 34, 0, 0, 7); ctx.fill(); });
  cell('socket', (w, h) => { plate(w, h); ctx.fillStyle = '#b9ae92'; ctx.beginPath(); ctx.arc(w / 2, h / 2, 26, 0, 7); ctx.fill(); ctx.fillStyle = '#1c1b1a'; for (const x of [-11, 11]) { ctx.beginPath(); ctx.arc(w / 2 + x, h / 2, 4.5, 0, 7); ctx.fill(); } });
  // the spines of a pile of books, one row each
  ['#6e2f2a', '#28496b', '#c9b88e', '#3c5a43', '#8a6a2e'].forEach((color, i) => cell(`spine${i}`, (w, h) => {
    ctx.fillStyle = color; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = i === 2 ? '#3a2f22' : '#e6d9b8'; ctx.globalAlpha = 0.8; ctx.fillRect(40 + i * 12, h / 2 - 2, 150 - i * 14, 4); ctx.fillRect(w - 80, h / 2 - 1.5, 44, 3); ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(0, 0, w, 2); ctx.fillRect(0, h - 2, w, 2);
  }));
  // the edge of a pile of paper
  cell('edge', (w, h) => { ctx.fillStyle = '#d2cab2'; ctx.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 2) { ctx.fillStyle = `rgba(70,60,40,${0.12 + r() * 0.3})`; ctx.fillRect(0, y, w, 0.8); } });
  // the receiver's front: the dial, three knobs, a row of keys
  cell('hifi', (w, h) => {
    const m = ctx.createLinearGradient(0, 0, 0, h); m.addColorStop(0, '#c2bfb6'); m.addColorStop(1, '#8d8a82'); ctx.fillStyle = m; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#15130f'; ctx.fillRect(12, 10, 178, 34);
    ctx.fillStyle = '#e9a04a'; for (let x = 20; x < 184; x += 6) ctx.fillRect(x, 30, 1, x % 30 === 20 ? 9 : 5);
    text(words.stereo.dial, 20, 25, 9, FONT_MONO, '#e9a04a', 'left', 160); ctx.fillStyle = '#e04a2a'; ctx.fillRect(118, 12, 1.5, 30);
    for (const x of [222, 258, 294]) { ctx.fillStyle = '#3a3835'; ctx.beginPath(); ctx.arc(x, 30, 14, 0, 7); ctx.fill(); ctx.fillStyle = '#b9b6ae'; ctx.beginPath(); ctx.arc(x, 30, 10, 0, 7); ctx.fill(); ctx.fillStyle = '#3a3835'; ctx.fillRect(x - 1, 20, 2, 9); }
    for (let k = 0; k < 6; k++) { ctx.fillStyle = '#d8d4c8'; ctx.fillRect(14 + k * 26, 60, 20, 22); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(14 + k * 26, 80, 20, 2); }
    text(words.stereo.brand, w - 14, 80, 13, FONT_TITLE, '#2a2826', 'right', 130);
  });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ── the marks' picture: stains, cracks, wear; transparent where the wall is as it was ──
const MARKS = {
  damp: [0, 0, 384, 256], blotch: [384, 0, 256, 256], rust: [640, 0, 128, 384], ghost: [768, 0, 256, 320],
  crackA: [0, 256, 512, 128], crackB: [0, 384, 512, 128], blob: [512, 256, 128, 128], ring: [512, 384, 128, 128],
  scuff: [0, 512, 512, 64], hand: [640, 384, 128, 128], wear: [0, 576, 512, 256], base: [768, 320, 64, 256], soot: [832, 320, 64, 256],
  chip: [896, 320, 128, 128], scratch: [512, 576, 256, 256], corner: [768, 576, 256, 256], edge: [0, 832, 512, 96],
};
function marksAtlas(look, size) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const ctx = c.getContext('2d'), r = mulberry(23);
  ctx.scale(size / 1024, size / 1024);
  const hex = (h) => `${parseInt(h.slice(1, 3), 16)},${parseInt(h.slice(3, 5), 16)},${parseInt(h.slice(5, 7), 16)}`; // '#rrggbb' as the canvas takes it
  const damp = hex(look.wear.damp), grime = hex(look.wear.grime), pale = hex(look.wear.pale), rust = hex(look.wear.rust), worn = hex(look.wear.worn);
  const cell = (name, draw) => { const [x, y, w, h] = MARKS[name]; ctx.save(); ctx.beginPath(); ctx.rect(x + 2, y + 2, w - 4, h - 4); ctx.clip(); ctx.translate(x, y); draw(w, h); ctx.restore(); };
  // a soft patch: many faint discs round a point
  const cloud = (cx, cy, rad, color, a, n = 26, sx = 1, sy = 1) => {
    for (let i = 0; i < n; i++) {
      const an = r() * 6.283, d = Math.sqrt(r()) * rad * 0.6, x = cx + Math.cos(an) * d * sx, y = cy + Math.sin(an) * d * sy, q = rad * (0.25 + r() * 0.45);
      const g = ctx.createRadialGradient(x, y, 0, x, y, q); g.addColorStop(0, `rgba(${color},${a})`); g.addColorStop(1, `rgba(${color},0)`);
      ctx.fillStyle = g; ctx.fillRect(x - q, y - q, q * 2, q * 2);
    }
  };
  // a patch that water left: a faint body, and the line where it dried, uneven, stronger in places
  const tide = (cx, cy, rx, ry, color, a) => {
    const ph = [r() * 6.3, r() * 6.3, r() * 6.3, r() * 6.3];
    const pt = (t, q = 1) => { const s = 1 + 0.1 * Math.sin(t * 3 + ph[0]) + 0.06 * Math.sin(t * 7 + ph[1]) + 0.04 * Math.sin(t * 13 + ph[2]); return [cx + Math.cos(t) * rx * s * q, cy + Math.sin(t) * ry * s * q]; };
    for (const [q, f] of [[1, 0.16], [0.82, 0.1], [0.55, 0.08]]) { ctx.fillStyle = `rgba(${color},${a * f})`; ctx.beginPath(); for (let t = 0; t <= 6.3; t += 0.06) ctx.lineTo(...pt(t, q)); ctx.fill(); }
    for (let t = 0; t < 6.283; t += 0.05) {
      const e = 0.25 + 0.75 * Math.max(0, 0.5 * Math.sin(t * 2 + ph[3]) + 0.5 * Math.sin(t * 5 + ph[1]));
      for (const [lw, f] of [[5, 0.18], [1 + 1.4 * e, 0.8]]) { ctx.strokeStyle = `rgba(${color},${a * e * f})`; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(...pt(t)); ctx.lineTo(...pt(t + 0.058)); ctx.stroke(); }
    }
  };
  // damp under the cornice: it comes down from the top edge, in tongues
  cell('damp', (w, h) => {
    for (let i = 0; i < 9; i++) { const x = 40 + r() * (w - 80), len = 50 + r() * 130; cloud(x, len * 0.35, len * 0.7, damp, 0.05, 14, 0.5, 1); }
    cloud(w / 2, 26, 150, damp, 0.06, 30, 1.1, 0.25);
    tide(w * 0.36, 60, 96, 84, damp, 0.22); tide(w * 0.66, 44, 86, 62, damp, 0.18); tide(w * 0.5, 30, 150, 60, damp, 0.1);
    cloud(w * 0.4, 40, 60, grime, 0.03, 10);
  });
  // a blotch on the ceiling: rings, one inside the other
  cell('blotch', (w, h) => { cloud(w / 2, h / 2, 96, damp, 0.055, 30); tide(w / 2, h / 2, 86, 76, damp, 0.24); tide(w / 2 + 8, h / 2 - 6, 56, 50, damp, 0.16); tide(w / 2 - 6, h / 2 + 10, 30, 26, damp, 0.12); });
  // rust that ran down the wall
  cell('rust', (w, h) => {
    for (let i = 0; i < 5; i++) {
      const x = 16 + r() * r() * (w - 32), len = 60 + r() * (h - 90), wd = 1.5 + r() * 5;
      const g = ctx.createLinearGradient(0, 4, 0, len); g.addColorStop(0, `rgba(${rust},${0.2 + r() * 0.25})`); g.addColorStop(0.5, `rgba(${rust},0.14)`); g.addColorStop(1, `rgba(${rust},0)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - wd, 4); ctx.lineTo(x + wd, 4); ctx.lineTo(x + wd * 0.3 + r() * 3, len); ctx.lineTo(x - wd * 0.3, len); ctx.fill();
    }
    cloud(w / 2, 14, 60, rust, 0.07, 14, 1, 0.3); cloud(w / 2, 60, 70, grime, 0.03, 12, 0.6, 1);
  });
  // where a picture hung for years: the paint behind it kept its colour, the dust drew its edge, the nail is still there
  cell('ghost', (w, h) => {
    for (let i = 0; i < 6; i++) { ctx.fillStyle = `rgba(${pale},0.012)`; ctx.fillRect(22 - i * 2, 40 - i * 2, w - 44 + i * 4, h - 62 + i * 4); }
    ctx.fillStyle = `rgba(${pale},0.075)`; ctx.fillRect(24, 42, w - 48, h - 66);
    ctx.fillStyle = `rgba(${grime},0.16)`; ctx.fillRect(22, 38, w - 44, 3); ctx.fillStyle = `rgba(${grime},0.07)`; ctx.fillRect(20, 40, 2.5, h - 62); ctx.fillRect(w - 22.5, 40, 2.5, h - 62); ctx.fillRect(22, h - 23, w - 44, 2);
    ctx.fillStyle = 'rgba(20,16,12,0.9)'; ctx.beginPath(); ctx.arc(w / 2, 22, 2.6, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(20,16,12,0.3)'; ctx.fillRect(w / 2 - 1, 22, 2, 9); // the nail and its shadow
  });
  // hairline cracks: a line that wanders, and branches
  const crack = (w, h, seed) => {
    const q = mulberry(seed);
    const run = (x, y, dir, len, lw, depth) => {
      ctx.strokeStyle = `rgba(${grime},${0.5 + 0.2 * q()})`; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(x, y);
      for (let s = 0; s < len; s += 7) {
        dir += (q() - 0.5) * 0.7; dir *= 0.92; x += Math.cos(dir) * 7; y += Math.sin(dir) * 7;
        if (y < 8 || y > h - 8) dir = -dir * 0.5; y = Math.max(8, Math.min(h - 8, y)); ctx.lineTo(x, y);
        if (depth < 2 && q() < 0.07) { ctx.stroke(); run(x, y, dir + (q() > 0.5 ? 0.9 : -0.9), len * 0.3 * q() + 20, lw * 0.7, depth + 1); ctx.strokeStyle = `rgba(${grime},0.55)`; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(x, y); }
        if (x > w - 10) break;
      }
      ctx.stroke();
    };
    run(10, h / 2, 0, w - 20, 1.25, 0);
  };
  cell('crackA', (w, h) => crack(w, h, 5)); cell('crackB', (w, h) => crack(w, h, 11));
  // the soft shadow under a thing, and the ring a pot left
  cell('blob', (w, h) => { const g = ctx.createRadialGradient(w / 2, h / 2, 3, w / 2, h / 2, w / 2 - 3); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.5, 'rgba(0,0,0,0.55)'); g.addColorStop(0.8, 'rgba(0,0,0,0.14)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); });
  cell('ring', (w, h) => { tide(w / 2, h / 2, 42, 42, grime, 0.5); tide(w / 2 + 3, h / 2 + 2, 37, 38, grime, 0.25); cloud(w / 2, h / 2, 44, grime, 0.04, 14); });
  // scuffs on the skirting: pale strokes where shoes and a broom hit it
  cell('scuff', (w, h) => { for (let i = 0; i < 70; i++) { const x = r() * w, y = 8 + r() * (h - 16), len = 6 + r() * 34; ctx.strokeStyle = `rgba(${r() > 0.3 ? pale : grime},${0.1 + r() * 0.28})`; ctx.lineWidth = 0.8 + r() * 1.8; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len, y + (r() - 0.5) * 5); ctx.stroke(); } });
  // the grey a hand leaves round a switch
  cell('hand', (w, h) => { cloud(w / 2, h / 2, 50, grime, 0.045, 30, 0.8, 1); });
  // the floor's worn path: paler, duller, with fine scratches along it
  cell('wear', (w, h) => {
    cloud(w / 2, h / 2, 150, worn, 0.03, 40, 1.5, 0.55);
    for (let i = 0; i < 90; i++) { const x = 30 + r() * (w - 60), y = 40 + r() * (h - 80), len = 10 + r() * 50, a = (r() - 0.5) * 0.5; ctx.strokeStyle = `rgba(${worn},${0.06 + r() * 0.14})`; ctx.lineWidth = 0.7 + r(); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len); ctx.stroke(); }
  });
  // grime above the skirting (dark at the bottom) and the grey under the cornice (dark at the top)
  cell('base', (w, h) => { const g = ctx.createLinearGradient(0, h, 0, 0); g.addColorStop(0, `rgba(${grime},0.3)`); g.addColorStop(0.25, `rgba(${grime},0.12)`); g.addColorStop(1, `rgba(${grime},0)`); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); });
  cell('soot', (w, h) => { const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, `rgba(${grime},0.26)`); g.addColorStop(0.3, `rgba(${grime},0.1)`); g.addColorStop(1, `rgba(${grime},0)`); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); });
  // paint that chipped: small flakes gone, the darker coat under them
  cell('chip', (w, h) => { for (let i = 0; i < 16; i++) { const x = 20 + r() * (w - 40), y = 20 + r() * (h - 40), s = 2 + r() * 7; ctx.fillStyle = `rgba(${damp},${0.35 + r() * 0.3})`; ctx.beginPath(); for (let t = 0; t < 6.3; t += 1.1) ctx.lineTo(x + Math.cos(t) * s * (0.5 + r()), y + Math.sin(t) * s * (0.5 + r())); ctx.fill(); ctx.strokeStyle = `rgba(${pale},0.35)`; ctx.lineWidth = 0.8; ctx.stroke(); } });
  // the arcs a chair's feet drew on the floor
  cell('scratch', (w, h) => { for (let i = 0; i < 26; i++) { const cx = w / 2 + (r() - 0.5) * 60, cy = h * 1.1 + r() * 60, rad = 120 + r() * 170, a0 = -1.9 + r() * 0.5; ctx.strokeStyle = `rgba(${worn},${0.1 + r() * 0.18})`; ctx.lineWidth = 0.7 + r() * 1.1; ctx.beginPath(); ctx.arc(cx, cy, rad, a0, a0 + 0.25 + r() * 0.5); ctx.stroke(); } });
  // dirt in a corner of the floor (the corner is the picture's top left), and along its edge (the picture's top)
  cell('corner', (w, h) => { const g = ctx.createRadialGradient(0, 0, 10, 0, 0, w * 0.95); g.addColorStop(0, `rgba(${grime},0.42)`); g.addColorStop(0.4, `rgba(${grime},0.16)`); g.addColorStop(1, `rgba(${grime},0)`); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); });
  cell('edge', (w, h) => { const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, `rgba(${grime},0.36)`); g.addColorStop(0.35, `rgba(${grime},0.14)`); g.addColorStop(1, `rgba(${grime},0)`); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); for (let i = 0; i < 14; i++) cloud(r() * w, 6 + r() * 18, 30, grime, 0.03, 5, 1.6, 0.5); });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// a picture's place in its atlas, as [u0, v0, u1, v1], a pixel inside its edge
const rect = (cells, name) => { const [x, y, w, h] = cells[name]; return [(x + 1.5) / 1024, 1 - (y + h - 1.5) / 1024, (x + w - 1.5) / 1024, 1 - (y + 1.5) / 1024]; };
function skin(geo, name, from = 0, to = geo.attributes.uv.count, cells = CELLS) {
  const [u0, v0, u1, v1] = rect(cells, name), uv = geo.attributes.uv;
  for (let i = from; i < to; i++) uv.setXY(i, u0 + uv.getX(i) * (u1 - u0), v0 + uv.getY(i) * (v1 - v0));
  return geo;
}
function tint(geo, name, from = 0, to = geo.attributes.uv.count) {
  const [u0, v0, u1, v1] = rect(CELLS, name), uv = geo.attributes.uv;
  for (let i = from; i < to; i++) uv.setXY(i, (u0 + u1) / 2, (v0 + v1) / 2);
  return geo;
}
// a box in one colour, with a picture on some of its faces: { px, nx, py, ny, pz, nz }
const FACE = { px: 0, nx: 1, py: 2, ny: 3, pz: 4, nz: 5 };
function boxed(w, h, d, base, faces = {}) {
  const geo = tint(new THREE.BoxGeometry(w, h, d), base), plain = new THREE.BoxGeometry(w, h, d).attributes.uv;
  for (const [k, name] of Object.entries(faces)) { const f = FACE[k] * 4; for (let i = f; i < f + 4; i++) geo.attributes.uv.setXY(i, plain.getX(i), plain.getY(i)); skin(geo, name, f, f + 4); }
  return geo;
}
// moved and turned (about x, then y, then z), then put in place
const at = (geo, x, y, z, rx = 0, ry = 0, rz = 0) => { if (rx) geo.rotateX(rx); if (ry) geo.rotateY(ry); if (rz) geo.rotateZ(rz); return geo.translate(x, y, z); };
const fuse = (geos) => mergeGeometries(geos.map((q) => (q.index ? q.toNonIndexed() : q)));
const tube = (points, radius, color, segs = 16, sides = 5) => tint(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))), segs, radius, sides), color);

export function buildLived({ g, part, mesh, wood, woodPer, look, words, lite, anisotropy = 8, deskTop = 0.805, door = [-2.09, -1.01], win = [-1.08, 1.48], rose = [0.2, 0.9] }) {
  const { x0, x1, z0, z1, h: H } = ROOM;
  const things = new THREE.MeshStandardMaterial({ map: thingsAtlas(words, lite ? 512 : 1024), roughness: 0.8, side: THREE.DoubleSide });
  things.map.anisotropy = anisotropy;
  const put = (geos, pos = [0, 0, 0], turn = 0) => part(fuse(geos), pos, things, { rot: [0, turn, 0] });
  const brass = (geo, pos, rot) => part(geo, pos, look.brass, { rot, opts: { metalness: 0.8, roughness: 0.3 } }); // the room's own brass: no new material
  const seg = lite ? 12 : 24;

  // ── the standing lamp, between the sofa and the bookcase: a brass foot and stem, a cloth shade ──
  const LAMP = [-2.66, -0.74];
  brass(new THREE.CylinderGeometry(0.13, 0.15, 0.022, seg), [LAMP[0], 0.011, LAMP[1]]);
  brass(new THREE.CylinderGeometry(0.011, 0.011, 1.4, 8), [LAMP[0], 0.72, LAMP[1]]);
  brass(new THREE.SphereGeometry(0.02, 10, 8), [LAMP[0], 1.67, LAMP[1]]);
  const shade = mesh('stand_shade', new THREE.CylinderGeometry(0.12, 0.2, 0.25, seg, 1, true), new THREE.MeshStandardMaterial({ color: look.lampshade, emissive: '#ffb066', emissiveIntensity: 0, roughness: 0.95, side: THREE.DoubleSide }), [LAMP[0], 1.53, LAMP[1]]);
  shade.castShadow = false; g.userData.standGlow = shade.material;
  put([tube([[LAMP[0], 0.012, LAMP[1] - 0.14], [LAMP[0] - 0.1, 0.006, LAMP[1] - 0.3], [-2.9, 0.006, -0.9], [x0 + 0.03, 0.02, -1.02], [x0 + 0.02, 0.3, -1.05]], 0.0035, 'rubber', 20)]);

  // ── the pedestal fan by the desk, turned to the chair ──
  {
    const N = lite ? 12 : 26, hub = 1.14, parts = [];
    parts.push(at(tint(new THREE.CylinderGeometry(0.19, 0.2, 0.03, seg), 'cream'), 0, 0.015, 0), at(tint(new THREE.CylinderGeometry(0.03, 0.06, 0.05, 12), 'cream'), 0, 0.055, 0));
    parts.push(at(tint(new THREE.CylinderGeometry(0.014, 0.014, 0.98, 8), 'metal'), 0, 0.57, 0), at(tint(new THREE.CylinderGeometry(0.022, 0.022, 0.4, 8), 'cream'), 0, 0.28, 0));
    parts.push(at(tint(new THREE.CylinderGeometry(0.062, 0.05, 0.17, 14), 'cream'), 0, hub, -0.1, Math.PI / 2), at(tint(new THREE.SphereGeometry(0.05, 12, 8), 'cream'), 0, hub, -0.185));
    parts.push(at(tint(new THREE.CylinderGeometry(0.026, 0.03, 0.09, 10), 'cream'), 0, hub - 0.085, -0.1));
    for (const [zr, R, tb] of [[0.0, 0.215, 0.006], [0.045, 0.19, 0.003], [-0.045, 0.19, 0.003], [0.07, 0.12, 0.0025]]) parts.push(at(tint(new THREE.TorusGeometry(R, tb, 5, lite ? 20 : 40), 'metal'), 0, hub, zr));
    for (let i = 0; i < N; i++) for (const s of [1, -1]) { // the wires of the cage, front and back
      const a = (i / N) * Math.PI * 2 + (s < 0 ? 0.1 : 0);
      const wire = new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(new THREE.Vector3(0.04, 0, s * 0.075), new THREE.Vector3(0.17, 0, s * 0.075), new THREE.Vector3(0.215, 0, 0)), 4, 0.0016, 3);
      parts.push(at(tint(wire, 'metal'), 0, hub, 0, 0, 0, a));
    }
    parts.push(at(tint(new THREE.CylinderGeometry(0.045, 0.045, 0.012, 16), 'cream'), 0, hub, 0.076, Math.PI / 2));
    for (let i = 0; i < 3; i++) { // three blades, pitched
      const blade = new THREE.CircleGeometry(0.075, 12); blade.scale(1, 1.75, 1); blade.rotateY(0.4); blade.translate(0, 0.095, 0);
      parts.push(at(tint(blade, 'blade'), 0, hub, 0.01, 0, 0, (i / 3) * Math.PI * 2 + 0.3));
    }
    parts.push(at(tint(new THREE.CylinderGeometry(0.03, 0.03, 0.05, 12), 'dark'), 0, hub, 0.01, Math.PI / 2));
    put(parts, [1.72, 0, -1.28], -1.2);
    put([tube([[1.8, 0.03, -1.42], [1.92, 0.006, -1.62], [2.0, 0.006, -1.85], [1.97, 0.03, z0 + 0.03], [1.95, 0.3, z0 + 0.02]], 0.0035, 'cable', 20)]);
  }

  // ── by the door: a coat rack with a bag and an umbrella, sandals, the mat ──
  const RACK = [-0.72, 3.5];
  {
    const cyl = (r, len, per = woodPer) => { const q = new THREE.CylinderGeometry(r, r, len, 10), uv = q.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 0.14 / per, uv.getY(i) * len / per); return q; };
    const pieces = [at(cyl(0.021, 1.7), 0, 0.87, 0), at(new THREE.SphereGeometry(0.032, 12, 8), 0, 1.74, 0)];
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.4; pieces.push(at(at(cyl(0.016, 0.3), 0.13, 0.055, 0, 0, 0, 1.25), 0, 0, 0, 0, a)); } // four feet, down and out
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3, y = i % 2 ? 1.62 : 1.5; pieces.push(at(at(cyl(0.009, 0.15), 0.065, y + 0.04, 0, 0, 0, -0.95), 0, 0, 0, 0, a)); } // six pegs, up and out
    part(fuse(pieces), [RACK[0], 0, RACK[1]], wood);
    // a canvas bag on a peg, a black umbrella leaning on the stem
    const bag = [at(tint(new THREE.BoxGeometry(0.3, 0.34, 0.07, 2, 2, 1), 'canvas'), 0, 1.12, 0), tube([[-0.1, 1.29, 0], [-0.05, 1.5, 0.0], [0, 1.56, 0], [0.05, 1.5, 0.0], [0.1, 1.29, 0]], 0.007, 'canvas', 12, 4)];
    const p = bag[0].attributes.position; for (let i = 0; i < p.count; i++) if (p.getY(i) < 1.0) p.setZ(i, p.getZ(i) * 1.5); else if (p.getY(i) > 1.25) p.setZ(i, p.getZ(i) * 0.35); bag[0].computeVertexNormals();
    put(bag, [RACK[0] + 0.135, 0, RACK[1]], Math.PI / 2 + 0.15);
    const umb = [at(tint(new THREE.CylinderGeometry(0.034, 0.008, 0.62, 10), 'black'), 0, 0.36, 0), at(tint(new THREE.CylinderGeometry(0.005, 0.005, 0.26, 6), 'metal'), 0, 0.78, 0),
      tube([[0, 0.88, 0], [0, 0.95, 0], [0.02, 0.985, 0], [0.055, 0.97, 0], [0.06, 0.93, 0]], 0.009, 'card', 10, 6)];
    put(umb.map((q) => at(q, 0, 0, 0, 0, 0, 0.2)), [RACK[0] + 0.16, 0, RACK[1] + 0.1], -0.56);
    // the sandals, kicked off beside it
    const sandal = (x, z, turn) => {
      const sole = new THREE.CylinderGeometry(0.05, 0.05, 0.014, 14); sole.scale(1, 1, 2.55);
      const strap = (s) => tube([[0, 0.014, -0.07], [s * 0.025, 0.04, -0.03], [s * 0.046, 0.016, 0.02]], 0.0045, 'strap', 6, 4);
      put([at(tint(sole, 'sole'), 0, 0.007, 0), strap(1), strap(-1)], [x, 0, z], turn);
    };
    sandal(-0.33, 3.55, 0.2); sandal(-0.2, 3.6, -0.35);
    put([at(boxed(0.62, 0.012, 0.4, 'card', { py: 'mat' }), 0, 0.006, 0)], [-1.55, 0, 3.4], 0.03);
  }

  // ── the wall's own things: a switch by the door, sockets, the calendar, the air conditioner ──
  const plateGeo = (kind) => boxed(0.075, 0.115, 0.009, 'cream', { pz: kind });
  put([at(plateGeo('switch'), -0.9, 1.12, z1 - 0.0045, 0, Math.PI)]);                        // front wall, beside the door
  put([at(plateGeo('socket'), 1.95, 0.32, z0 + 0.0045), at(tint(new THREE.CylinderGeometry(0.017, 0.017, 0.02, 10), 'plug'), 1.95, 0.32, z0 + 0.019, Math.PI / 2)]); // back wall: the fan's
  put([at(plateGeo('socket'), 0.62, 0.32, z0 + 0.0045), at(tint(new THREE.CylinderGeometry(0.017, 0.017, 0.02, 10), 'plug'), 0.62, 0.32, z0 + 0.019, Math.PI / 2)]); // back wall, under the desk
  put([at(plateGeo('socket'), x0 + 0.0045, 0.32, -1.05, 0, Math.PI / 2), at(tint(new THREE.CylinderGeometry(0.017, 0.017, 0.02, 10), 'rubber'), x0 + 0.019, 0.32, -1.05, 0, 0, Math.PI / 2)]); // left wall: the lamp's
  put([at(skin(new THREE.PlaneGeometry(0.3, 0.43), 'cal'), x1 - 0.009, 1.63, 0.69, 0, -Math.PI / 2, 0), at(tint(new THREE.CylinderGeometry(0.003, 0.003, 0.02, 6), 'dark'), x1 - 0.01, 1.835, 0.69, 0, 0, Math.PI / 2)]); // the calendar on the right wall, and its nail
  {
    // the air conditioner: a box through the left wall, its front in the room, a cord to a socket of its own
    const AC = { y: 2.52, z: 1.93, w: 0.64, h: 0.4, d: 0.1 };
    put([at(boxed(AC.d, AC.h, AC.w, 'cream', { px: 'ac' }), x0 + AC.d / 2, AC.y, AC.z),
      at(boxed(0.014, AC.h + 0.05, AC.w + 0.05, 'cream'), x0 + 0.007, AC.y, AC.z),
      at(plateGeo('socket'), x0 + 0.0045, 2.36, 2.42, 0, Math.PI / 2), at(tint(new THREE.CylinderGeometry(0.017, 0.017, 0.02, 10), 'rubber'), x0 + 0.019, 2.36, 2.42, 0, 0, Math.PI / 2),
      tube([[x0 + 0.06, AC.y - AC.h / 2, AC.z + 0.24], [x0 + 0.03, 2.22, AC.z + 0.33], [x0 + 0.03, 2.24, 2.38], [x0 + 0.03, 2.36, 2.42]], 0.004, 'rubber', 14)]);
  }

  // ── under the desk: a power strip on the floor, its cord to the wall, the cords of what stands on the desk ──
  {
    const strip = [at(tint(new THREE.BoxGeometry(0.3, 0.035, 0.055), 'cream'), 0, 0.0175, 0)];
    for (let i = 0; i < 4; i++) strip.push(at(tint(new THREE.CylinderGeometry(0.016, 0.016, 0.03, 8), i % 2 ? 'rubber' : 'plug'), -0.105 + i * 0.07, 0.05, 0));
    put(strip, [0.25, 0, -1.8], 0.12);
    const cords = [tube([[0.4, 0.02, -1.8], [0.5, 0.006, -1.88], [0.6, 0.02, z0 + 0.03], [0.62, 0.3, z0 + 0.02]], 0.004, 'cable', 14)];
    [[0.02, 'rubber', -0.1], [0.1, 'rubber', 0.35], [0.17, 'cable', -0.55], [0.24, 'rubber', 0.95]].forEach(([dx, color, to], i) => {
      cords.push(tube([[0.25 - 0.105 + i * 0.07, 0.07, -1.8], [0.2 + dx, 0.25 + i * 0.04, -1.9], [to * 0.7, 0.6, z0 + 0.03 + i * 0.006], [to, deskTop + 0.01, z0 + 0.04]], 0.003, color, 16, 4));
    });
    put(cords);
  }

  // ── the waste basket beside the desk, and the paper that missed it ──
  {
    const prof = [[0, 0.006], [0.1, 0.006], [0.105, 0], [0.135, 0.3], [0.128, 0.3], [0.099, 0.012], [0, 0.012]].map((p) => new THREE.Vector2(...p));
    const ball = (x, y, z, s, seed) => { const q = new THREE.IcosahedronGeometry(s, 1), p = q.attributes.position; for (let i = 0; i < p.count; i++) { const k = 0.78 + 0.4 * Math.abs(Math.sin(p.getX(i) * 91.7 * seed + p.getY(i) * 57.3 + p.getZ(i) * 133.1)); p.setXYZ(i, p.getX(i) * k, p.getY(i) * k, p.getZ(i) * k); } q.computeVertexNormals(); return at(tint(q, 'paper'), x, y, z); };
    put([tint(new THREE.LatheGeometry(prof, lite ? 12 : 20), 'bin'), ball(0.02, 0.2, 0.01, 0.05, 1.3), ball(-0.05, 0.25, 0.04, 0.04, 2.1), ball(0.05, 0.27, -0.04, 0.035, 3.7), ball(0.24, 0.03, 0.13, 0.036, 4.9)], [1.52, 0, -1.66]);
  }

  // ── the low table before the sofa (its file is placed in src/room.js): magazines, a mug; newspapers under it ──
  {
    const T = { x: -1.72, z: 0.95, y: 0.46 };
    const magazine = (name, x, z, turn, y = T.y) => at(boxed(0.21, 0.006, 0.28, 'paper', { py: name }), x, y + 0.003, z, 0, turn);
    const mug = [tint(new THREE.LatheGeometry([[0, 0.004], [0.034, 0.004], [0.038, 0.012], [0.039, 0.09], [0.036, 0.09], [0.035, 0.014], [0, 0.012]].map((p) => new THREE.Vector2(...p)), 14), 'enamel'),
      at(tint(new THREE.CircleGeometry(0.035, 14), 'coffee'), 0, 0.07, 0, -Math.PI / 2), at(tint(new THREE.TorusGeometry(0.022, 0.006, 6, 10, Math.PI), 'enamel'), 0.039, 0.05, 0, 0, 0, -Math.PI / 2)];
    put([magazine('mag0', T.x - 0.02, T.z - 0.14, Math.PI / 2 + 0.12), magazine('mag1', T.x - 0.03, T.z - 0.12, Math.PI / 2 - 0.25, T.y + 0.006), magazine('mag2', T.x + 0.04, T.z + 0.02, Math.PI / 2 + 0.5, T.y + 0.012)]);
    put(mug, [T.x + 0.06, T.y, T.z + 0.24], 0.8);
    // the week's newspapers, on the floor at its end
    const pile = [];
    for (let i = 0; i < 5; i++) pile.push(at(boxed(0.3, 0.022, 0.38, 'paper', { py: 'news', pz: 'edge', nz: 'edge', px: 'edge', nx: 'edge' }), (i % 2) * 0.012 - 0.006, 0.011 + i * 0.022, (i % 3) * 0.01, 0, Math.PI / 2 + [0.05, -0.08, 0.02, 0.14, -0.04][i]));
    put(pile, [T.x - 0.03, 0, T.z + 0.66], 0.2);
  }

  // ── on the card cabinet under the chart (its file is placed in src/room.js): a receiver, a turntable, two speakers ──
  {
    const C = { x: 3.07, z: 1.3, y: 0.78 }, back = -Math.PI / 2; // the fronts face the room, which is -x
    const hifi = [at(boxed(0.42, 0.105, 0.3, 'black', { pz: 'hifi' }), 0, 0.0525, 0), at(boxed(0.43, 0.06, 0.34, 'black', { py: 'deck' }), 0, 0.137, 0),
      at(tint(new THREE.CylinderGeometry(0.148, 0.148, 0.014, seg * 2), 'metal'), -0.035, 0.174, 0), at(skin(new THREE.CircleGeometry(0.146, seg * 2), 'disc'), -0.035, 0.1825, 0, -Math.PI / 2),
      at(tint(new THREE.CylinderGeometry(0.014, 0.014, 0.04, 10), 'metal'), 0.13, 0.187, -0.12),
      tube([[0.13, 0.2, -0.12], [0.12, 0.2, 0.0], [0.075, 0.195, 0.085]], 0.004, 'metal', 8, 5), at(tint(new THREE.BoxGeometry(0.018, 0.012, 0.035), 'black'), 0.07, 0.19, 0.095, 0, 0.4)];
    put(hifi, [C.x, C.y, C.z + 0.02], back);
    for (const dz of [-0.47, 0.5]) put([at(boxed(0.22, 0.36, 0.19, 'card', { pz: 'speaker' }), 0, 0.18, 0)], [C.x + 0.02, C.y, C.z + dz], back + (dz < 0 ? 0.12 : -0.1));
    // two sleeves leaning on its front, on the floor
    const SLEEVES = 2.66;
    put([at(boxed(0.31, 0.31, 0.005, 'paper', { pz: 'sleeve0', nz: 'sleeve0' }), 0, 0.157, 0, -0.2)], [SLEEVES, 0, 0.98], back + 0.06);
    put([at(boxed(0.31, 0.31, 0.005, 'paper', { pz: 'sleeve1', nz: 'sleeve1' }), 0, 0.157, 0, -0.26)], [SLEEVES - 0.02, 0, 1.16], back - 0.1);
  }

  // ── beside the armchair: a pile of books on the floor ──
  {
    const pile = []; let y = 0;
    [[0.24, 0.035, 0.17, 0.1], [0.22, 0.028, 0.16, -0.2], [0.25, 0.045, 0.18, 0.05], [0.2, 0.025, 0.14, 0.3], [0.21, 0.03, 0.15, -0.1]].forEach(([w, t, d, turn], i) => {
      pile.push(at(boxed(w, t, d, 'paper', { pz: `spine${i}`, nz: `spine${i}`, py: `spine${i}`, ny: `spine${i}` }), 0, y + t / 2, 0, 0, turn)); y += t;
    });
    put(pile, [-1.9, 0, 2.27], 0.5);
  }

  // ── the marks of the years: one mesh of flat pieces on the walls, the ceiling and the floor ──
  const k = look.wear?.amount ?? 1;
  if (k > 0) {
    const geos = [];
    // a piece of the marks' picture, `w` by `h` metres, on a surface: 'back' (along x), 'left' and 'right' (along z),
    // 'front' (along x), 'floor' and 'ceiling' (x, z). `a` is how strong, `turn` turns it in its own plane, `off` is how far
    // it floats off the surface.
    const mark = (name, on, u, v, w, h, a = 1, { turn = 0, flip = false, off = on === 'right' ? 0.006 : 0.0016, color = [1, 1, 1] } = {}) => { // the right wall's stripes are painted 4 mm off it
      const geo = skin(new THREE.PlaneGeometry(w, h), name, 0, 4, MARKS), uv = geo.attributes.uv;
      if (flip) { const [a, b] = [uv.getX(0), uv.getX(1)]; uv.setX(0, b); uv.setX(1, a); uv.setX(2, b); uv.setX(3, a); } // mirrored
      if (turn) geo.rotateZ(turn);
      if (on === 'back') geo.translate(u, v, z0 + off);
      else if (on === 'front') geo.rotateY(Math.PI).translate(u, v, z1 - off);
      else if (on === 'left') geo.rotateY(Math.PI / 2).translate(x0 + off, v, u);
      else if (on === 'right') geo.rotateY(-Math.PI / 2).translate(x1 - off, v, u);
      else if (on === 'floor') geo.rotateX(-Math.PI / 2).translate(u, off, v);
      else geo.rotateX(Math.PI / 2).translate(u, H - off, v);
      const col = []; for (let i = 0; i < 4; i++) col.push(...color, Math.min(1, a * k));
      geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 4));
      geos.push(geo);
    };
    // damp: the corner of the back wall and the right wall, and the ceiling over it; another by the door
    mark('damp', 'back', 2.86, H - 0.15 - 0.3, 1.05, 0.62, 0.9);
    mark('damp', 'right', -1.45, H - 0.15 - 0.24, 0.9, 0.5, 0.7, { flip: true });
    mark('blotch', 'ceiling', 2.75, -1.35, 1.1, 1.0, 0.8, { turn: 0.4 });
    mark('blotch', 'ceiling', -1.9, 2.9, 0.8, 0.7, 0.55, { turn: 2.0 });
    mark('damp', 'left', 3.1, H - 0.15 - 0.22, 0.9, 0.46, 0.65);
    mark('damp', 'front', -2.5, H - 0.15 - 0.2, 0.8, 0.42, 0.5, { flip: true });
    if (!lite) mark('hand', 'ceiling', rose[0], rose[1], 1.9, 1.9, 0.7, { color: [1, 0.86, 0.6] }); // the ceiling has yellowed round the lamp
    // cracks: up from the door's head, down the left wall from the cornice, across the ceiling from the rose, under the window's corner
    mark('crackA', 'front', -0.82, 2.52, 0.95, 0.24, 0.8, { turn: -1.1 });
    mark('crackB', 'left', -1.05, 2.5, 1.0, 0.25, 0.7, { turn: 1.45 });
    mark('crackA', 'ceiling', -0.75, 0.2, 1.7, 0.42, 0.6, { turn: 0.5 });
    mark('crackB', 'ceiling', 1.5, 2.2, 1.5, 0.38, 0.5, { turn: -0.7 });
    mark('crackB', 'back', 2.08, 0.78, 0.7, 0.18, 0.7, { turn: -0.75 });
    mark('crackA', 'right', 2.7, 2.35, 1.1, 0.28, 0.5, { turn: 1.2 });
    // where a picture hung, on the left wall by the bookcase; chips of paint by the window and the door
    mark('ghost', 'left', -1.3, 1.9, 0.56, 0.7, 1);
    mark('chip', 'back', -1.62, 1.05, 0.3, 0.3, 0.8); mark('chip', 'front', -0.98, 0.55, 0.26, 0.26, 0.8); mark('chip', 'left', 2.2, 0.42, 0.3, 0.3, 0.7, { turn: 1 }); mark('chip', 'back', 1.98, 2.86, 0.22, 0.22, 0.6, { turn: 2 });
    // rust under the air conditioner; the hand's grey round the switch
    mark('rust', 'left', 1.93, 2.32 - 0.42, 0.52, 0.86, 0.85);
    mark('hand', 'front', -0.9, 1.1, 0.34, 0.4, 1);
    // grime above the skirting and grey under the cornice, all round
    const W = x1 - x0, D = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    // (the phone's look leaves out the wide pieces, the strips round the room and the floor's wear: they would cover most of the screen once more)
    const strip = (name, on, from, to) => lite ? null : (name === 'base' ? mark('base', on, (from + to) / 2, 0.162 + 0.2, to - from, 0.4, 0.75) : mark('soot', on, (from + to) / 2, H - 0.15 - 0.19, to - from, 0.38, 0.6));
    strip('base', 'back', x0, x1); strip('base', 'left', z0, z1); strip('base', 'right', z0, z1); strip('base', 'front', x0, door[0]); strip('base', 'front', door[1], x1); // not across the door
    strip('soot', 'back', x0, win[0]); strip('soot', 'back', win[1], x1); strip('soot', 'left', z0, z1); strip('soot', 'right', z0, z1); strip('soot', 'front', x0, x1); // not across the window
    // scuffs on the skirting, where feet pass (they float just off its face)
    for (const [on, u, len] of [['left', 1.9, 1.9], ['left', -1.0, 1.4], ['back', 1.9, 1.5], ['back', -1.3, 0.7], ['front', 0.4, 1.9], ['front', -2.5, 0.8], ['right', 0.7, 1.4]]) mark('scuff', on, u, 0.068, len, 0.125, 0.9, { off: 0.0195 });
    // the floor: paths worn pale from the door to the desk and along the sofa, dirt along the walls and in the corners
    if (!lite) {
    mark('wear', 'floor', -1.35, 2.35, 2.6, 1.3, 0.9, { turn: 1.25 }); mark('wear', 'floor', 0.3, 1.45, 2.8, 1.4, 0.8, { turn: 0.2 }); mark('wear', 'floor', -1.45, 0.3, 2.2, 1.0, 0.7, { turn: 1.55 }); mark('wear', 'floor', 2.1, 0.6, 2.4, 1.2, 0.6, { turn: 1.4 });
    mark('edge', 'floor', cx, z0 + 0.3, W, 0.6, 0.8); mark('edge', 'floor', cx, z1 - 0.3, W, 0.6, 0.8, { turn: Math.PI });
    mark('edge', 'floor', x0 + 0.3, cz, D, 0.6, 0.8, { turn: Math.PI / 2 }); mark('edge', 'floor', x1 - 0.3, cz, D, 0.6, 0.8, { turn: -Math.PI / 2 });
    mark('corner', 'floor', x0 + 0.6, z0 + 0.6, 1.2, 1.2, 0.8); mark('corner', 'floor', x1 - 0.6, z0 + 0.6, 1.2, 1.2, 0.8, { turn: -Math.PI / 2 });
    mark('corner', 'floor', x1 - 0.6, z1 - 0.6, 1.2, 1.2, 0.8, { turn: Math.PI }); mark('corner', 'floor', x0 + 0.6, z1 - 0.6, 1.2, 1.2, 0.8, { turn: Math.PI / 2 });
    mark('scratch', 'floor', -1.85, 2.6, 0.9, 0.9, 0.5, { turn: -1.3 }); mark('scratch', 'floor', -1.3, 0.95, 0.7, 0.7, 0.35, { turn: -1.6 });
    }
    mark('ring', 'floor', 1.93, -1.12, 0.46, 0.46, 0.55); mark('ring', 'floor', -2.45, 1.95, 0.3, 0.3, 0.5);
    // the soft shadow under each new thing: [x, z, width, depth, strength]
    for (const [x, z, w, d, a] of [[LAMP[0], LAMP[1], 0.5, 0.5, 0.45], [1.72, -1.28, 0.6, 0.6, 0.4], [RACK[0], RACK[1], 0.6, 0.6, 0.35], [1.52, -1.66, 0.44, 0.44, 0.45],
      [-1.72, 0.95, 0.75, 1.15, 0.42], [-2.36, 2.98, 1.15, 1.15, 0.5], [3.05, 1.3, 0.95, 1.6, 0.5], [-1.9, 2.27, 0.42, 0.4, 0.4], [-1.55, 3.4, 0.74, 0.5, 0.25], [-0.27, 3.57, 0.34, 0.36, 0.3], [-1.75, 1.61, 0.5, 0.56, 0.4]]) {
      mark('blob', 'floor', x, z, w, d, a, { off: 0.003 });
    }
    const how = { map: marksAtlas(look, lite ? 512 : 1024), transparent: true, depthWrite: false, vertexColors: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 };
    const marks = new THREE.Mesh(mergeGeometries(geos), lite ? new THREE.MeshLambertMaterial(how) : new THREE.MeshStandardMaterial({ ...how, roughness: 1, metalness: 0 })); // the phone's look: the plainest lit material
    marks.material.map.anisotropy = anisotropy;
    marks.name = 'marks'; marks.renderOrder = 1; marks.castShadow = false; marks.receiveShadow = true; marks.userData.proxy = true; marks.raycast = () => {}; // the pointer and Nash pass through them
    g.add(marks);
  }
  return { rack: RACK };
}
