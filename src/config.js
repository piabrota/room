// ─────────────────────────────────────────────────────────────
//  THE ONE FILE TO MAKE IT YOURS.
//  Signature, camera shots, objects, sounds and tapes live here.
//  This room is piabrota's: its projects hang on the wall, its two
//  bots sit on the desk, its people are pinned to the board, and the
//  works with a DOI stand on the shelf.
// ─────────────────────────────────────────────────────────────

export const signature = {
  name: 'pia, brota',
  tagline: 'open software fabric, made in Rio de Janeiro',
  links: [
    { label: 'GitHub', url: 'https://github.com/piabrota' },
    { label: 'piabrota.art', url: 'https://piabrota.art' },
  ],
};

// Where the room is: the clock tape shows its time.
export const place = { city: 'Rio de Janeiro', timeZone: 'America/Sao_Paulo' };

// The look: the piabrota palette (mu, docs/7-branding/identity).
export const theme = {
  bg: '#0B0D12',
  surface: '#14171F',
  text: '#EDEFF3',
  muted: '#9AA3B2',
  accent: '#BC2318',
  eye: { white: '#F7F3EA', iris: '#2E9E4F', pupil: '#0B0D12' },
  // One colour per lane of the fabric.
  lanes: { company: '#BC2318', write: '#3FB950', host: '#1682D4', play: '#D29922' },
};

// Optional: drop your Blender export here. If the file is missing,
// a placeholder room is built from config so you can still develop.
export const roomModel = '/models/room.glb';

// The view from the window: Botafogo bay and the Sugarloaf, a photograph
// for the night and one for the day (CREDITS.md), set far behind the
// glass with drawn layers around it. `anchor` is where the Sugarloaf is
// in the picture (from the top left), so it sits where the window looks.
// Without the night file the drawn view is shown (src/outside.js).
// The room opens in day or night by the hour in Rio (`place.timeZone`):
// day from `dayHours[0]` to `dayHours[1]`. The day/night button switches.
export const outside = {
  night: { photo: '/textures/rio-night.jpg', anchor: [0.63, 0.25] },
  day:   { photo: '/textures/rio-day.jpg',   anchor: [0.72, 0.4] },
  dayHours: [6, 18],
  aim: [0.4, 6.0], // where the landmark sits, in metres from the middle of the window, 25 m out
};

// Named camera shots. Keys 1..n or the buttons switch between them.
// `fov` is optional (degrees, landscape). In Blender, cameras named
// "shot_desk" etc. are picked up from the GLB (see cameras.js).
export const shots = {
  overview: { position: [3.1, 2.15, 3.3], target: [-0.4, 1.05, -0.6], fov: 50 },
  desk:     { position: [0.05, 1.42, 0.75], target: [0.05, 1.08, -1.0], fov: 45 },
  fabric:   { position: [-0.7, 1.6, 0.55], target: [-3.0, 1.6, -0.2], fov: 52 },
  shelf:    { position: [-1.75, 1.35, 0.15], target: [-2.05, 1.25, -1.9], fov: 46 },
  board:    { position: [2.45, 1.8, 0.25], target: [2.45, 1.82, -2.0], fov: 50 },
  window:   { position: [0.2, 1.62, 0.7], target: [0.2, 2.12, -2.0], fov: 56 },
  sea:      { position: [1.05, 1.62, 0.05], target: [3.35, 1.3, -0.45], fov: 50 },
  slipbox:  { position: [-1.62, 0.88, -0.22], target: [-2.2, 0.18, -0.98], fov: 46 },
  loop:     { position: [0.4, 1.6, 1.0], target: [0.9, 1.65, 3.8], fov: 54 },
  // the tenth, on key 0: the chart on the right wall, which opens the map (`grid` below)
  grid:     { position: [1.75, 1.62, 1.55], target: [3.4, 1.62, 1.55], fov: 44, label: '▲ grid' },
};
export const startShot = 'overview';

// The words of the buttons, in one place, so a fork can speak its own
// language or slang without touching the code.
export const ui = {
  sound: 'sound', on: 'on', off: 'off',
  day: 'day', night: 'night', toDay: 'switch to day', toNight: 'switch to night',
  listening: (n) => `${n} listening`, by: (title, artist) => `${title}, by ${artist}`, radioHint: 'lofi, free-licensed',
};

// The owner's playlist on Spotify: a mixtape on the sill, beside the
// radio, and a button beside the radio's at the top. Both open it in a
// new tab; nothing of Spotify's is loaded or played in the room.
export const playlist = {
  label: 'the mixtape', hint: 'the playlist, on Spotify', button: '♫ playlist',
  url: 'https://open.spotify.com/playlist/2hsuqvhCouatM8DtmKKl7U',
  tape: { title: 'mixtape', side: 'A · on Spotify' },
};

// piabrota RADIO: lofi under a free licence only (CC0 or CC BY,
// CREDITS.md), in two stations. A station plays its tracks one after
// another from a random start. The radio plays through the room's sound,
// so the sound button mutes it too, and the rain steps back while it
// plays. A missing file falls back to a synthesized lofi bed.
// `listeners` is where the live count of listeners comes from (a small
// service beside the site, scripts/listeners.mjs); without it the count
// stays hidden.
export const radio = {
  name: 'piabrota RADIO',
  volume: 0.6,
  duck: 0.35, // the rain's volume while the radio plays
  listeners: '/live/radio',
  stations: [
    { id: 'lofi', label: 'lofi', tracks: [
      { src: '/audio/radio/ocean-memory.mp3', title: 'Ocean Memory', artist: 'HoliznaCC0', fallback: 'lofi' },
      { src: '/audio/radio/washed-up.mp3', title: 'Washed Up', artist: 'HoliznaCC0', fallback: 'lofi' },
      { src: '/audio/radio/ease-into-night.mp3', title: 'Ease into Night', artist: 'HoliznaCC0', fallback: 'lofi' },
      { src: '/audio/radio/moon-unit.mp3', title: 'Moon Unit', artist: 'HoliznaCC0', fallback: 'lofi' },
      { src: '/audio/radio/roof-tops.mp3', title: 'Roof Tops', artist: 'HoliznaCC0', fallback: 'lofi' },
      { src: '/audio/radio/tranquil-mindscape.mp3', title: 'Tranquil Mindscape', artist: 'HoliznaCC0', fallback: 'lofi' },
      { src: '/audio/radio/fractured.mp3', title: 'Fractured', artist: 'HoliznaCC0', fallback: 'lofi' },
      { src: '/audio/radio/bubbles.mp3', title: 'Bubbles', artist: 'HoliznaCC0', fallback: 'lofi' },
      { src: '/audio/radio/still-life.mp3', title: 'Still Life', artist: 'HoliznaCC0', fallback: 'lofi' },
      { src: '/audio/radio/when-time-called-me-darling.mp3', title: 'When Time Called Me Darling', artist: 'HoliznaCC0', fallback: 'lofi' },
      { src: '/audio/radio/calm-currents.mp3', title: 'Calm Currents', artist: 'HoliznaCC0', fallback: 'lofi' },
      { src: '/audio/radio/one-night-in-france.mp3', title: 'One Night In France', artist: 'HoliznaCC0', fallback: 'lofi' },
      { src: '/audio/radio/canon-event.mp3', title: 'Canon Event', artist: 'HoliznaCC0', fallback: 'lofi' },
      { src: '/audio/radio/birds.mp3', title: 'Birds', artist: 'HoliznaCC0', fallback: 'lofi' },
      { src: '/audio/radio/waiting-around.mp3', title: 'Waiting Around', artist: 'HoliznaCC0', fallback: 'lofi' },
      { src: '/audio/radio/doodles.mp3', title: 'Doodles', artist: 'HoliznaCC0', fallback: 'lofi' },
      { src: '/audio/radio/lucid.mp3', title: 'Lucid', artist: 'HoliznaCC0', fallback: 'lofi' },
      { src: '/audio/radio/ghost-town.mp3', title: 'Ghost Town', artist: 'HoliznaCC0', fallback: 'lofi' },
      { src: '/audio/radio/theta-frequency.mp3', title: 'Theta Frequency', artist: 'HoliznaCC0', fallback: 'lofi' },
      { src: '/audio/radio/tokyo-sunset.mp3', title: 'Tokyo Sunset', artist: 'HoliznaCC0', fallback: 'lofi' },
      { src: '/audio/radio/peaceful-drift.mp3', title: 'Peaceful Drift', artist: 'HoliznaCC0', fallback: 'lofi' },
      { src: '/audio/radio/reminders.mp3', title: 'Reminders', artist: 'HoliznaCC0', fallback: 'lofi' },
      { src: '/audio/radio/going-home.mp3', title: 'Going Home', artist: 'HoliznaCC0', fallback: 'lofi' },
      { src: '/audio/radio/shimmer.mp3', title: 'Shimmer', artist: 'HoliznaCC0', fallback: 'lofi' },
      { src: '/audio/radio/down-time.mp3', title: 'Down Time', artist: 'HoliznaCC0', fallback: 'lofi' },
      { src: '/audio/radio/warm-fuzz.mp3', title: 'Warm Fuzz', artist: 'HoliznaCC0', fallback: 'lofi' },
      { src: '/audio/radio/nine-to-death.mp3', title: 'Nine To Death', artist: 'HoliznaCC0', fallback: 'lofi' },
      { src: '/audio/radio/walking-away.mp3', title: 'Walking Away', artist: 'HoliznaCC0', fallback: 'lofi' },
      { src: '/audio/radio/forgotten-keep-sakes.mp3', title: 'Forgotten Keep Sakes', artist: 'HoliznaCC0', fallback: 'lofi' },
      { src: '/audio/radio/when-i-was-human.mp3', title: 'When I Was Human', artist: 'HoliznaCC0', fallback: 'lofi' },
      { src: '/audio/radio/one-good-day.mp3', title: 'One Good Day', artist: 'HoliznaCC0', fallback: 'lofi' },
      { src: '/audio/radio/color-of-a-soul.mp3', title: 'Color Of A Soul', artist: 'HoliznaCC0', fallback: 'lofi' },
      { src: '/audio/radio/before-everything.mp3', title: 'Before Everything', artist: 'HoliznaCC0', fallback: 'lofi' },
      { src: '/audio/radio/yet-again.mp3', title: 'Yet Again', artist: 'HoliznaCC0', fallback: 'lofi' },
      { src: '/audio/radio/ode-to-forgetting.mp3', title: 'Ode To Forgetting', artist: 'HoliznaCC0', fallback: 'lofi' },
    ] },
    // lofi brasil: four bossa-lofi pieces written in code for the room
    // (`just brasil`, scripts/brasil.mjs) and one by Popoi (CC BY 3.0)
    { id: 'brasil', label: 'lofi brasil', tracks: [
      { src: '/audio/radio/brasil-urca.mp3', title: 'Urca, depois da chuva', artist: 'piabrota', fallback: 'lofi' },
      { src: '/audio/radio/brasil-botafogo.mp3', title: 'Botafogo às duas', artist: 'piabrota', fallback: 'lofi' },
      { src: '/audio/radio/brasil-leme.mp3', title: 'Leme, maré baixa', artist: 'piabrota', fallback: 'lofi' },
      { src: '/audio/radio/brasil-santa-teresa.mp3', title: 'Bonde em Santa Teresa', artist: 'piabrota', fallback: 'lofi' },
      { src: '/audio/radio/brasil-cafezinho-com-leite.mp3', title: 'Cafezinho com Leite', artist: 'Popoi', fallback: 'lofi' },
    ] },
  ],
};

// The rain on the window: the room's one ambient sound, and it is off
// until the visitor turns it on with the rain button. Nothing hums or
// hisses on its own. rain.mp3 is a public-domain recording (CREDITS.md);
// without it, synthesized drops stand in.
export const ambience = [
  { id: 'rain', label: 'rain', src: '/audio/rain.mp3', volume: 0.5, fallback: 'rain' },
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
// `spine` is what is written on the tape's label, and in which face:
// one of the retro faces in src/art.js (`marker`, `neon`, `pixel`,
// `terminal`, `typewriter`), with the colour of the label and its ink.
// The stack on the desk is built in this order, the last on top.
export const tapes = [
  { id: 'marola',    label: 'marola.dev',     color: '#0f3d66', text: 'the sea of marola-dev: its repositories, floating on live waves', spine: { text: 'marola.dev', face: 'neon', paper: '#08243f', ink: '#5cc8ff' }, module: () => import('./tapes/marola.js') },
  { id: 'ouroboric', label: 'ouroboric-dev',  color: '#3a1d0e', text: 'Ouroboric\'s factory: the snake that eats its tail, and the repositories on its loop', spine: { text: 'ouroboric-dev', face: 'pixel', paper: '#f2e6c9', ink: '#c2410c' }, module: () => import('./tapes/ouroboric.js') },
  { id: 'piabrota', label: 'PIABROTA (the fabric)', color: '#1682d4', spine: { text: 'piabrota', face: 'marker', paper: '#f4efe4', ink: '#1682d4' }, text: 'a radio piece on piabrota, its people, its agents and its works, with links', module: () => import('./tapes/piabrota.js') },
  { id: 'hello',  label: 'HELLO (who we are)', color: '#bc2318', spine: { text: 'hello', face: 'marker', paper: '#f4efe4', ink: '#bc2318' }, text: 'the name, typed out, and where to find us', module: () => import('./tapes/hello.js') },
  { id: 'bots',   label: 'THE BOTS',           color: '#9aa3b2', spine: { text: 'the bots', face: 'typewriter', paper: '#e9e4d8', ink: '#22252d' }, text: 'piabrota-ops and piabrota-hermes, and what each agent does', module: () => import('./tapes/bots.js') },
  { id: 'clock',  label: 'NIGHT CLOCK',        color: '#2e9e4f', spine: { text: 'night clock', face: 'terminal', paper: '#0b0d12', ink: '#3FB950' }, text: 'the time in Rio, glowing in the dark', module: () => import('./tapes/clock.js') },
  { id: 'synth',  label: 'TAPE SYNTH',         color: '#d29922', spine: { text: 'tape synth', face: 'neon', paper: '#1a1208', ink: '#ffb347' }, text: 'a small instrument you play on the screen', module: () => import('./tapes/synth.js') },
  { id: 'cv',        label: 'CV (h0ffmann)',  color: '#1b1d22', text: 'Matheus Hoffmann\'s track record, year by year, and his six works with a DOI', spine: { text: 'cv / h0ffmann', face: 'terminal', paper: '#0f1a12', ink: '#7dff9b' }, module: () => import('./tapes/cv.js') },
];

// ── the fabric: piabrota's projects, framed on the left wall ──
// `glyph` is the project's mark, typed (its drawing lives in its own
// repository); `lane` picks the colour.
export const projects = [
  { id: 'mu',        glyph: 'む',   lane: 'company', line: 'the company chart',             url: 'https://github.com/piabrota/mu' },
  { id: 'dojo',      glyph: '道場', lane: 'company', line: 'the umbrella of the projects',   url: 'https://github.com/piabrota/dojo' },
  { id: 'pirsig',    glyph: '無',   lane: 'write',   line: 'a second brain',                url: 'https://github.com/piabrota/pirsig' },
  { id: 'gramatico', glyph: 'G',    lane: 'write',   line: 'Portuguese that reads once',    url: 'https://github.com/piabrota/gramatico' },
  { id: 'alerts',    glyph: '≋',    lane: 'host',    line: 'alerts from official sources',  url: 'https://github.com/piabrota/alerts' },
  { id: 'rax',       glyph: '代理', lane: 'host',    line: 'an agentic runtime in Rust',    url: 'https://github.com/piabrota/rax' },
  { id: 'nix-os',    glyph: '无',   lane: 'host',    line: 'the box that serves the site',  url: 'https://github.com/piabrota/nix-os' },
  { id: 'ihero',     glyph: '♫',    lane: 'play',    line: 'a music player and game, soon', url: 'https://github.com/piabrota/ihero' },
];

// ── the bots: the org's two GitHub Apps, on the desk ──
// `agents` are the scripts piabrota-ops runs (piabrota/agents).
export const bots = [
  {
    id: 'ops', name: 'piabrota-ops', color: '#BC2318', url: 'https://github.com/piabrota/agents',
    role: 'watches nix-os and its box, reviews, diagnoses, never merges',
    agents: [
      ['deploy-doctor', 'reads a failed deploy, opens an issue and a fix'],
      ['pr-reviewer', 'one review per pull request, edited on each push'],
      ['mentions', 'answers whoever calls @piabrota-ops'],
      ['mirror-keeper', 'keeps the pt-BR and English docs in step'],
      ['flake-annotator', 'says what a flake update risks'],
      ['feedback', 'turns a thumbs-down into a lesson'],
      ['issue-worker', 'takes an agent-ready issue to a pull request'],
      ['gramatico-loop', 'one gramatico pull request at a time'],
      ['health-digest', 'a daily note on the health of the box'],
    ],
  },
  {
    id: 'hermes', name: 'piabrota-hermes', color: '#1682D4', url: 'https://github.com/piabrota/nix-os',
    role: 'the owner\'s assistant: Telegram, Discord, scheduled jobs',
    agents: [],
  },
];

// ── the people, pinned to the board ──
export const people = [
  { id: 'h0ffmann', name: 'h0ffmann', line: 'pirsig, alerts, nix-os, closed-source', url: 'https://github.com/h0ffmann' },
  { id: 'aracyla',  name: 'aracyla',  line: 'frontend, small C projects',          url: 'https://github.com/aracyla' },
  { id: 'robkler',  name: 'robkler',  line: 'backend; gramatico\'s extension',      url: 'https://github.com/robkler' },
];

// ── the works with a DOI, by Matheus Hoffmann, on the shelf ──
// All six are cited together, every time.
export const works = [
  { id: 'marola',        title: 'marola',                 doi: '10.5281/zenodo.23224155', color: '#1682D4' },
  { id: 'ww3-gpu',       title: 'ww3-gpu',                doi: '10.5281/zenodo.23221351', color: '#2b6fb3' },
  { id: 'picasso',       title: 'picasso',                doi: '10.5281/zenodo.23311208', color: '#3FB950' },
  { id: 'closed-source', title: 'closed source',          doi: '10.5281/zenodo.23333656', color: '#BC2318' },
  { id: 'marola-bench',  title: 'marola-bench',           doi: '10.5281/zenodo.23352633', color: '#4a8fd4' },
  { id: 'nashkell',      title: 'nashkell, the open book', doi: '10.5281/zenodo.23356739', color: '#D29922' },
];

// ── the sea: marola-dev's repositories as buoys on a wave tank ──
// The waves are computed live, a nod to ww3-gpu (WAVEWATCH III).
export const sea = {
  label: 'marola', hint: 'the water super app, and the sea it floats on', url: 'https://marola.dev',
  buoys: [
    { id: 'marola',          line: 'the water super app',                     url: 'https://github.com/marola-dev/marola' },
    { id: 'marola-app',      line: 'the backend, in Scala',                   url: 'https://github.com/marola-dev/marola-app' },
    { id: 'marola-site',     line: 'the front end of marola.dev',             url: 'https://github.com/marola-dev/marola-site' },
    { id: 'marola-ml',       line: 'marolaGPT, its fine-tune and its benchmark gate', url: 'https://github.com/marola-dev/marola-ml' },
    { id: 'marola-research', line: 'the science',                             url: 'https://github.com/marola-dev/marola-research' },
    { id: 'marola-oods',     line: 'an open ocean data store, as files',      url: 'https://github.com/marola-dev/marola-oods' },
    { id: 'marola-corpus',   line: 'sourced notes on the ocean and safety at sea', url: 'https://github.com/marola-dev/marola-corpus' },
    { id: 'marola-skills',   line: 'the marola way of coding',                url: 'https://github.com/marola-dev/marola-skills' },
    { id: 'marola-devkit',   line: 'the dev-flow harness of the marola repos', url: 'https://github.com/marola-dev/marola-devkit' },
  ],
};

// ── the loop: ouroboric-dev's repositories as crates on a belt that
// never ends. Ouroboric is a partner of piabrota; its names are its own.
export const loop = {
  label: 'Ouroboric', hint: 'open factories that improve themselves (a partner)', url: 'https://github.com/ouroboric-dev',
  crates: [
    { id: 'ouroboric',   line: 'the charter, the standards, the journal',  url: 'https://github.com/ouroboric-dev/ouroboric' },
    { id: 'yggdrasil',   line: 'an open software factory: agents build, humans steer', url: 'https://github.com/ouroboric-dev/yggdrasil' },
    { id: 'asgard',      line: 'the company factory',                      url: 'https://github.com/ouroboric-dev/asgard' },
    { id: 'odin',        line: 'the orchestrator and its graph engine',    url: 'https://github.com/ouroboric-dev/odin' },
    { id: 'gleipnir',    line: 'the harness and its sandbox',              url: 'https://github.com/ouroboric-dev/gleipnir' },
    { id: 'jormungandr', line: 'the loop: build, check, fix',              url: 'https://github.com/ouroboric-dev/jormungandr' },
    { id: 'gungnir',     line: 'the contract: types and schemas',          url: 'https://github.com/ouroboric-dev/gungnir' },
    { id: 'havamal',     line: 'the skill library',                        url: 'https://github.com/ouroboric-dev/havamal' },
    { id: 'mimir',       line: 'the public benchmark kit',                 url: 'https://github.com/ouroboric-dev/mimir' },
    { id: 'voluspa',     line: 'the graphs and their stage prompts',       url: 'https://github.com/ouroboric-dev/voluspa' },
  ],
};

// ── the slipbox: a crate of records on the floor. In front, side by
// side, where it starts: Robert M. Pirsig and piabrota's pirsig, the
// slip-box. Behind them, h0ffmann's own repositories, one sleeve each.
// Each sleeve's cover is drawn from its name, so no two are alike.
export const slipbox = {
  label: 'slipbox', hint: 'Pirsig first, then h0ffmann\'s repositories', url: 'https://github.com/h0ffmann',
  front: [
    // `card` is how the sleeve is drawn: `book`, a paperback of his book
    // drawn in code (no cover is copied); `repo`, a card with a pill.
    { id: 'pirsig-wikipedia', title: 'Robert M. Pirsig', line: 'Zen and the Art of Motorcycle Maintenance, on Wikipedia', url: 'https://en.wikipedia.org/wiki/Robert_M._Pirsig',
      card: { kind: 'book', title: 'Zen and the Art of Motorcycle Maintenance', sub: 'An Inquiry into Values', author: 'Robert M. Pirsig', year: '1974' } },
    { id: 'pirsig',           title: 'pirsig',           line: 'the technical implementation of pirsig brain', url: 'https://github.com/piabrota/pirsig',
      card: { kind: 'repo', pill: ['GitHub', 'piabrota/pirsig'], title: 'pirsig brain', line: 'the technical implementation: PARA and a slip-box, as files' } },
  ],
  sleeves: [
    { id: 'ww3-gpu',        line: 'WAVEWATCH III on the GPU, bit for bit',     url: 'https://github.com/h0ffmann/ww3-gpu' },
    { id: 'picasso',        line: 'deterministic toolchains: just, nix, rust', url: 'https://github.com/h0ffmann/picasso' },
    { id: 'closed-source',  line: 'research on licences, and a book',          url: 'https://github.com/h0ffmann/closed-source' },
    { id: 'proof',          line: 'Lean kernels and graphs',                   url: 'https://github.com/h0ffmann/proof' },
    { id: 'nagori',         line: '名残',                                      url: 'https://github.com/h0ffmann/nagori' },
    { id: 'south-disaster', line: 'disaster alerts for the south of Brazil',   url: 'https://github.com/h0ffmann/astrbot_dw_ext_br_south_disaster' },
    { id: 'south-waterq',   line: 'bathing-water alerts for the south of Brazil', url: 'https://github.com/h0ffmann/astrbot_dw_ext_br_south_waterq' },
    { id: 'swim-sync',      line: 'a swim training app',                       url: 'https://github.com/h0ffmann/swim-sync' },
    { id: 'okekara',        line: 'synced lyrics and karaoke for YouTube Music', url: 'https://github.com/h0ffmann/okekara' },
    { id: 'sharingan',      line: 'Aider meets an instruction DSL',            url: 'https://github.com/h0ffmann/sharingan' },
    { id: 'forecast-energy-demand', line: 'forecasting hourly electricity demand', url: 'https://github.com/h0ffmann/forecast-energy-demand' },
    { id: 'bigiot',         line: 'remote monitoring on asynchronous messages', url: 'https://github.com/h0ffmann/bigiot' },
  ],
};

// ── the CV tape (src/tapes/cv.js): Matheus Hoffmann's track record.
// Every row comes from h0ffmann/h0ffmann, site/data/timeline.tsv at
// cc597dc (each row has its own source there), told here in a few words
// of this room. The six works with a DOI follow, from `works` above.
export const cv = {
  title: 'cv / h0ffmann', name: 'Matheus Hoffmann', url: 'https://github.com/h0ffmann/h0ffmann',
  rows: [
    { when: 'as a kid',  what: 'swimmer',                    where: 'Associação Atlética Portuguesa' },
    { when: '2010–2012', what: 'electronics technician',     where: 'CEFET/RJ' },
    { when: '2013–2020', what: 'Escola Politécnica',         where: 'UFRJ' },
    { when: '2016–2017', what: 'research: an underwater ROV', where: 'LIOC, UFRJ' },
    { when: '2017–2018', what: 'software engineer, payments', where: 'Stone' },
    { when: '2019–2020', what: 'a PIX engine, before PIX',   where: 'iUPay and Guiabolso' },
    { when: '2020',      what: 'senior software engineer',   where: 'Broad (YC W21)' },
    { when: '2021–2022', what: 'lead MLOps',                 where: 'Elemeno AI' },
    { when: '2023–2024', what: 'senior software and ML engineer, fraud', where: 'Signifyd' },
    { when: '2024',      what: 'twenty days',                where: 'Japan' },
    { when: '2025–2026', what: 'consulting',                 where: 'ITV' },
    { when: 'Sep 2025',  what: '3rd place, 10 km open water', where: 'Oceanman Rio' },
    { when: '2026',      what: 'the open ocean layer of the coast', where: 'marola' },
    { when: '2026',      what: 'open factories, with Bruno Valério', where: 'Ouroboric' },
    { when: 'Oct 2026',  what: 'six works with a DOI',       where: 'Zenodo' },
  ],
};

// ── the contact: a fax on the desk. The address is kept in parts and
// written with [at], so it is not lying in the page for a scraper.
export const contact = {
  label: 'fax', name: 'Matheus Hoffmann',
  email: { user: 'mhoffmann', host: 'gmail.com' },
  linkedin: { label: 'LinkedIn', url: 'https://www.linkedin.com/in/mhoffmannbr/' },
};
export const emailText = `${contact.email.user} [at] ${contact.email.host}`;
const mailto = ['mailto:', contact.email.user, '@', contact.email.host].join('');

// ── a file under the desk: closed source, a confidential letter ──
export const closedSource = {
  label: 'closed source', hint: 'a file marked confidential', url: 'https://h0ffmann.github.io/closed-source/',
  letter: {
    label: 'a confidential letter', hint: 'the paper, on Zenodo', url: 'https://doi.org/10.5281/zenodo.23333656',
    lines: ['CONFIDENTIAL', '', 'Re: closed source', '', 'A book on reverse engineering', 'and the ethics of citation.', '', 'site: h0ffmann.github.io/closed-source', 'paper: doi 10.5281/zenodo.23333656', '', '— M. H.'],
  },
};

// ── the door: locked, for now ──
export const door = { label: 'door', hint: 'locked, for now' };

// ── you: a pair of feet under the camera, seen when you look down ──
export const body = { shoes: '#e9e6df', soles: '#f7f5f0', jeans: '#2b3a55', laces: '#c9c3b6' };

// ── LOFI: the room as a page to read. The sections are in this order,
// each with its word. Posts are Markdown files in posts/ (front matter:
// title, date, summary); the newest is first, and the feed lists them.
export const reading = {
  site: 'https://room.piabrota.art',
  feed: '/feed.xml',
  sections: { home: 'home', about: 'about', work: 'work', posts: 'posts', online: 'online', subscribe: 'subscribe' },
  about: [
    'pia, brota is an open software fabric made in Rio de Janeiro: a company chart, a second brain, a runtime for agents and the box that serves this site, built in the open.',
    'Its people are pinned to the board of the room, its two bots sit on the desk, and its friends, marola and Ouroboric, have a wall each. This page is the same room, as text.',
  ],
  latest: 3, // posts on the home page
  online: [
    { label: 'GitHub', handle: 'piabrota', url: 'https://github.com/piabrota' },
    { label: 'GitHub', handle: 'h0ffmann', url: 'https://github.com/h0ffmann' },
    { label: 'LinkedIn', handle: 'mhoffmannbr', url: 'https://www.linkedin.com/in/mhoffmannbr/' },
    { label: 'piabrota.art', handle: 'piabrota.art', url: 'https://piabrota.art' },
    { label: 'Spotify', handle: 'the playlist', url: playlist.url },
  ],
  subscribe: { line: 'New posts come out in an RSS feed. Add it to your reader:', feedLabel: 'feed.xml', mailLine: 'or write to' },
  back: 'all posts', empty: 'no posts yet',
};

// Hoverable things. `name` matches a mesh name in your GLB (or the
// placeholder room, which builds one for each `art`). `action` is one
// of: 'shot', 'link', 'sfx', 'toggleLamp', 'toggleRadio'. `group` titles the LOFI list.
// ── ▲ grid: the Brazilian coast on a triangle mesh, its waves played back
// on a map (src/grid.js, docs/SURVEY.md, section 6). The chart hangs on
// the right wall; its shot (key 0) opens the map. `just grid` makes the
// files in public/grid/: the land (Natural Earth), the mesh, and 24 h of
// GFS winds over it with the sea they raise. The sea is an estimate from
// the wind (Pierson-Moskowitz, a fully developed sea), not yet a WAVEWATCH
// III run: that is the next step (the ww3-grid skill).
export const grid = {
  label: '▲ grid', hint: 'the Brazilian coast on triangles: 24 h of sea, and its temperature',
  title: '▲ grid · the Brazilian coast',
  credit: 'Triangle grids for WAVEWATCH III: Dr. Aron Roland (with Fabrice Ardhuin); at NOAA, Dr. Ali Abdolali.',
  note: 'The sea here is estimated from the wind (Pierson–Moskowitz, fully developed), not a WAVEWATCH III run.',
  sources: 'Land: Natural Earth · Wind: NOAA GFS 0.25°, through Open-Meteo (CC BY 4.0) · Temperature: OSTIA, generated using E.U. Copernicus Marine Service information (doi:10.48670/moi-00165); these data were provided by GHRSST and Met Office',
  // the domain of `just grid`: west, south, east, north; how far out the mesh goes, in km;
  // the spacing of its nodes near the coast and far out, in km
  bbox: [-56, -35.5, -27, 6.5], reach: 550, spacing: [9, 70],
  files: { run: '/grid/run.json', mesh: '/grid/mesh.bin', frames: '/grid/frames.bin', sst: '/grid/sst.bin', land: '/grid/land.json' },
  // the flow over the sea: how many particles, the points of each trail, how long one lives (s),
  // and how fast it goes, in degrees a second for each m/s of the waves' group speed
  flow: { particles: 1600, trail: 24, life: [2, 5], speed: 0.6 },
  // places to name on the map: [label, longitude, latitude]
  places: [['Rio de Janeiro', -43.2, -22.9], ['Salvador', -38.5, -12.97], ['Recife', -34.88, -8.05], ['Fortaleza', -38.53, -3.73], ['Florianópolis', -48.55, -27.6], ['Belém', -48.5, -1.45]],
  words: {
    play: 'play', pause: 'pause', back: 'back to the room', hs: 'sea (Hs)', sst: 'temperature', wind: 'wind', node: 'node', m: 'm', ms: 'm/s', c: '°C', from: 'from', toward: 'waves toward',
    hsLong: 'the height of the sea (Hs)', sstLong: 'the temperature of the sea’s surface', sstDay: 'OSTIA, day', noSst: 'no temperature in this run: just grid',
    flow: 'The lines flow where the waves travel, at their group speed (about 0.57 × the wind, for a sea it fully raised).',
    loading: 'loading the grid…', missing: 'no run yet: just grid',
    fold: 'fewer: fold the panel', unfold: 'more: the hours, the notes and the sources', full: 'the whole screen',
  },
};

export const hotspots = [
  { name: 'chart', label: grid.label, hint: grid.hint, action: 'shot', value: 'grid' },
  { name: 'window', label: 'Rio at night', hint: 'where piabrota is made', action: 'shot', value: 'window' },
  { name: 'shelf',  label: 'the shelf',    hint: 'the works with a DOI', action: 'shot', value: 'shelf' },
  { name: 'lamp',   label: 'lamp',         hint: 'on, off', action: 'toggleLamp' },
  { name: 'radio',  label: 'piabrota RADIO', hint: 'lofi, on and off', action: 'toggleRadio' },
  { name: 'mixtape', label: playlist.label, hint: playlist.hint, action: 'link', value: playlist.url, group: 'music', art: { kind: 'mixtape' } },
  { name: 'quote',  label: '"Time is a flat circle."', hint: 'Rust Cohle', action: 'link', value: 'https://en.wikipedia.org/wiki/Rust_Cohle', group: 'inspiration', art: { kind: 'quote', text: 'Time is a flat circle', by: 'Rust Cohle' } },
  { name: 'sign',   label: 'piabrota',     hint: 'an open green eye on red', action: 'link', value: 'https://piabrota.art', group: 'piabrota' },
  { name: 'door',   label: door.label, hint: door.hint, action: 'sfx', value: 'click' },
  { name: 'fax',    label: contact.label, hint: emailText, action: 'link', value: mailto, group: 'contact', art: { kind: 'fax' } },
  { name: 'fax_linkedin', label: contact.linkedin.label, hint: contact.name, action: 'link', value: contact.linkedin.url, group: 'contact' },
  { name: 'folder_closed-source', label: closedSource.label, hint: closedSource.hint, action: 'link', value: closedSource.url, group: 'closed source', art: { kind: 'folder' } },
  { name: 'letter_closed-source', label: closedSource.letter.label, hint: closedSource.letter.hint, action: 'link', value: closedSource.letter.url, group: 'closed source' },
  { name: 'note',   label: 'inspiration: Robert M. Pirsig', hint: 'Zen and the Art of Motorcycle Maintenance', action: 'link', value: 'https://en.wikipedia.org/wiki/Robert_M._Pirsig', group: 'inspiration', art: { kind: 'note', glyph: '無' } },
  ...projects.map((p) => ({
    name: `frame_${p.id}`, label: p.id, hint: p.line, action: 'link', value: p.url, group: 'projects',
    art: { kind: 'frame', glyph: p.glyph, color: theme.lanes[p.lane] },
  })),
  ...bots.map((b) => ({
    name: `bot_${b.id}`, label: b.name, hint: b.role, action: 'link', value: b.url, group: 'bots',
    art: { kind: 'bot', color: b.color },
  })),
  ...people.map((p) => ({
    name: `photo_${p.id}`, label: `@${p.name}`, hint: p.line, action: 'link', value: p.url, group: 'people',
    art: { kind: 'photo' },
  })),
  ...works.map((w) => ({
    name: `book_${w.id}`, label: w.title, hint: `doi ${w.doi}`, action: 'link', value: `https://doi.org/${w.doi}`, group: 'works with a DOI',
    art: { kind: 'book', color: w.color },
  })),
  { name: 'tank', label: sea.label, hint: sea.hint, action: 'link', value: sea.url, group: 'marola-dev', art: { kind: 'tank' } },
  ...sea.buoys.map((b, i) => ({
    name: `buoy_${b.id}`, label: b.id, hint: b.line, action: 'link', value: b.url, group: 'marola-dev',
    art: { kind: 'buoy', color: Object.values(theme.lanes)[i % 4] },
  })),
  { name: 'belt', label: loop.label, hint: loop.hint, action: 'link', value: loop.url, group: 'ouroboric-dev', art: { kind: 'belt' } },
  ...loop.crates.map((c) => ({
    name: `crate_${c.id}`, label: c.id, hint: c.line, action: 'link', value: c.url, group: 'ouroboric-dev',
    art: { kind: 'crate' },
  })),
  { name: 'crate', label: slipbox.label, hint: slipbox.hint, action: 'shot', value: 'slipbox', group: 'slipbox' },
  ...slipbox.front.map((r, i) => ({
    name: `record_${r.id}`, label: r.title, hint: r.line, action: 'link', value: r.url, group: 'slipbox',
    art: { kind: 'record', front: i, card: r.card },
  })),
  ...slipbox.sleeves.map((r) => ({
    name: `record_${r.id}`, label: r.id, hint: r.line, action: 'link', value: r.url, group: 'slipbox',
    art: { kind: 'record' },
  })),
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
