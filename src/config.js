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
// ambience.mp3 is a city at night and rain.mp3 rain on a windowsill,
// both cut from field recordings (CREDITS.md) by `just compose`.
// The second entry plays from the TV (src/app.js).
export const ambience = [
  { src: '/audio/ambience.mp3', volume: 0.45, fallback: 'rain' },
  { src: '/audio/hum.mp3',      volume: 0.15, fallback: 'hum' },
  { src: '/audio/rain.mp3',     volume: 0.3,  fallback: 'rain' },
];

// One-shot effects keyed by name; used by interactions below.
export const sfx = {
  click:  { src: '/audio/click.mp3',  fallback: 'click' },
  insert: { src: '/audio/insert.mp3', fallback: 'thunk' },
  eject:  { src: '/audio/eject.mp3',  fallback: 'thunk' },
};

// Tapes: each one is a module in src/tapes with mount/frame/input/stop.
// `label` shows on hover, `color` tints the shell and the room light,
// `text` is the line the LOFI (plain text) view shows for the tape.
export const tapes = [
  { id: 'piabrota', label: 'PIABROTA (the fabric)', color: '#1682d4', text: 'a radio piece on piabrota, its people, its agents and its works, with links', module: () => import('./tapes/piabrota.js') },
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

// ─────────────────────────────────────────────────────────────
//  The piabrota tape (src/tapes/piabrota.js): a radio piece in
//  chapters. Each chapter shows on the TV for `seconds` while the
//  track plays; its links can be clicked on the screen. `just compose`
//  times the music to these chapters, so run it again after changing
//  a `seconds`.
//
//  Sources: the org's profile, piabrota/.github profile/README.md at
//  d36bf40, and piabrota/agents README.md at c1bbebb. Quoted phrases
//  are the members' own words from their GitHub profiles, as that
//  README quotes them.
// ─────────────────────────────────────────────────────────────
export const piabrotaTape = {
  track: { src: '/audio/tape-piabrota.mp3' },
  chapters: [
    {
      title: 'pia, brota',
      seconds: 18,
      lines: ['an open software fabric,', 'made in Rio de Janeiro.', 'the source is open, and so is the method.'],
      links: [
        { label: 'piabrota.art', url: 'https://piabrota.art' },
        { label: 'github.com/piabrota', url: 'https://github.com/piabrota' },
      ],
    },
    {
      title: 'think and write',
      seconds: 22,
      lines: ['each project is its own repository,', 'with its own README, licence and tests.'],
      links: [
        { label: 'pirsig: a second brain, PARA + slip-box', url: 'https://github.com/piabrota/pirsig' },
        { label: 'gramatico: pt-BR that reads once', url: 'https://github.com/piabrota/gramatico' },
        { label: 'closed-source: the god that failed', url: 'https://github.com/h0ffmann/closed-source' },
        { label: 'mu: the dogma, standards, journal', url: 'https://github.com/piabrota/mu' },
      ],
    },
    {
      title: 'warn and host',
      seconds: 22,
      lines: ['alerts from official sources only.', 'a small VPS, judged by its closure.'],
      links: [
        { label: 'alerts: floods in the south of Brazil', url: 'https://github.com/piabrota/alerts' },
        { label: 'rax: agentic runtime, pure Rust', url: 'https://github.com/piabrota/rax' },
        { label: 'nix-os: piabrota.art/nixos', url: 'https://github.com/piabrota/nix-os' },
        { label: 'ihero: a music player and game, coming', url: 'https://github.com/piabrota/ihero' },
      ],
    },
    {
      title: 'the people',
      seconds: 22,
      lines: ['the board: the people who build piabrota.'],
      links: [
        { label: 'h0ffmann, Matheus Hoffmann: "water animal"', url: 'https://github.com/h0ffmann' },
        { label: 'aracyla: "general purpose developer"', url: 'https://github.com/aracyla' },
        { label: 'robkler, Rôb Klér: "Senior Backend Engineer"', url: 'https://github.com/robkler' },
      ],
    },
    {
      title: 'the buddies',
      seconds: 22,
      lines: ['two members are not people: GitHub Apps.', 'they sign what they write,', 'and never merge: a person does.'],
      links: [
        { label: 'piabrota-ops: watches nix-os, reviews PRs', url: 'https://github.com/piabrota/agents' },
        { label: 'piabrota-hermes: the owner\'s assistant', url: 'https://github.com/apps/piabrota-hermes' },
      ],
    },
    {
      title: 'works by Matheus Hoffmann',
      seconds: 26,
      lines: ['the works with a DOI:'],
      links: [
        { label: 'marola  10.5281/zenodo.23224155', url: 'https://doi.org/10.5281/zenodo.23224155' },
        { label: 'ww3-gpu  10.5281/zenodo.23221351', url: 'https://doi.org/10.5281/zenodo.23221351' },
        { label: 'picasso  10.5281/zenodo.23311208', url: 'https://doi.org/10.5281/zenodo.23311208' },
        { label: 'closed source  10.5281/zenodo.23333656', url: 'https://doi.org/10.5281/zenodo.23333656' },
        { label: 'marola-bench  10.5281/zenodo.23352633', url: 'https://doi.org/10.5281/zenodo.23352633' },
        { label: 'nashkell  10.5281/zenodo.23356739', url: 'https://doi.org/10.5281/zenodo.23356739' },
      ],
    },
    {
      title: 'build your own',
      seconds: 18,
      lines: ['read it, use it, and build your own.', 'every project is FOSS.'],
      links: [
        { label: 'Open Collective', url: 'https://opencollective.com/piabrota' },
        { label: 'GitHub Sponsors', url: 'https://github.com/sponsors/h0ffmann' },
      ],
    },
  ],
};
