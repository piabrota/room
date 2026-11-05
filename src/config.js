// ─────────────────────────────────────────────────────────────
//  THE ONE FILE TO MAKE IT YOURS.
//  Signature, camera shots, objects, sounds and tapes live here.
// ─────────────────────────────────────────────────────────────

export const signature = {
  name: 'Your Name',
  tagline: 'builds things, breaks things, records sounds',
  links: [
    { label: 'GitHub', url: 'https://github.com/your-handle' },
    { label: 'Email', url: 'mailto:you@example.com' },
  ],
};

// Optional: drop your Blender export here. If the file is missing,
// a placeholder room made of boxes is built so you can still develop.
export const roomModel = '/models/room.glb';

// Named camera shots. Keys 1..n or the buttons switch between them.
// Tip: in Blender, add cameras named "shot_desk" etc. and they are
// picked up automatically from the GLB (see cameras.js).
export const shots = {
  overview: { position: [3.2, 2.2, 3.6], target: [0, 1, 0] },
  desk:     { position: [0.0, 1.45, 1.4], target: [0, 1.05, -0.6] },
  shelf:    { position: [-1.2, 1.6, 0.8], target: [-1.9, 1.3, -1.2] },
  window:   { position: [1.0, 1.6, 0.6], target: [1.6, 1.6, -2] },
};
export const startShot = 'overview';

// Ambient beds. Put your own files in /public/audio. If a file is
// missing, a synthesized fallback (rain-ish noise / hum) is used.
export const ambience = [
  { src: '/audio/ambience.mp3', volume: 0.5, fallback: 'rain' },
  { src: '/audio/hum.mp3',      volume: 0.15, fallback: 'hum' },
];

// One-shot effects keyed by name; used by interactions below.
export const sfx = {
  click:  { src: '/audio/click.mp3',  fallback: 'click' },
  insert: { src: '/audio/insert.mp3', fallback: 'thunk' },
};

// Tapes: each one is a module in src/tapes with mount/frame/input/stop.
// `label` shows on hover, `color` tints the shell and the room light,
// `text` is the line the LOFI (plain text) view shows for the tape.
export const tapes = [
  { id: 'hello',  label: 'HELLO (about me)', color: '#e2574c', text: 'my name, typed out, and where to find me', module: () => import('./tapes/hello.js') },
  { id: 'clock',  label: 'NIGHT CLOCK',      color: '#3d8bd9', text: 'the time, glowing in the dark',             module: () => import('./tapes/clock.js') },
  { id: 'synth',  label: 'TAPE SYNTH',       color: '#e8b33a', text: 'a small instrument you play on the screen', module: () => import('./tapes/synth.js') },
];

// Extra hoverable things. `name` matches a mesh name in your GLB
// (or the placeholder room). `action` is one of: 'shot', 'link', 'sfx'.
export const hotspots = [
  { name: 'window', label: 'look outside', action: 'shot', value: 'window' },
  { name: 'shelf',  label: 'the shelf',    action: 'shot', value: 'shelf' },
  { name: 'lamp',   label: 'lamp',         action: 'toggleLamp' },
  { name: 'poster', label: 'my GitHub',    action: 'link', value: 'https://github.com/your-handle' },
];
