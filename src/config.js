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

// The view from the window: a photograph of Rio at night (CREDITS.md),
// set far behind the glass with drawn layers around it. Without the file
// the drawn view alone is shown (src/outside.js).
export const outside = { photo: '/textures/rio-night.jpg' };

// Named camera shots. Keys 1..n or the buttons switch between them.
// `fov` is optional (degrees, landscape). In Blender, cameras named
// "shot_desk" etc. are picked up from the GLB (see cameras.js).
export const shots = {
  overview: { position: [3.1, 2.15, 3.3], target: [-0.4, 1.05, -0.6], fov: 50 },
  desk:     { position: [0.05, 1.42, 0.75], target: [0.05, 1.08, -1.0], fov: 45 },
  fabric:   { position: [-0.7, 1.6, 0.55], target: [-3.0, 1.6, -0.2], fov: 52 },
  shelf:    { position: [-1.75, 1.35, 0.15], target: [-2.05, 1.25, -1.9], fov: 46 },
  board:    { position: [1.15, 1.6, 0.25], target: [1.15, 1.6, -2.0], fov: 44 },
  window:   { position: [2.1, 1.6, -0.05], target: [2.4, 1.68, -2.0], fov: 46 },
  sea:      { position: [1.05, 1.62, 0.05], target: [3.35, 1.3, -0.45], fov: 50 },
  records:  { position: [-1.45, 1.05, -0.35], target: [-2.25, 0.3, -1.25], fov: 48 },
  loop:     { position: [0.4, 1.6, 1.0], target: [0.9, 1.65, 3.8], fov: 54 },
};
export const startShot = 'overview';

// piabrota RADIO: lofi under a free licence only (CC0, CREDITS.md), one
// track after another from a random start. It plays through the room's
// sound, so the sound button mutes it too, and the ambience steps back
// while it plays. A missing file falls back to a synthesized lofi bed.
export const radio = {
  name: 'piabrota RADIO',
  volume: 0.6,
  duck: 0.35, // the ambience's volume while the radio plays
  tracks: [
    { src: '/audio/radio/ocean-memory.mp3', title: 'Ocean Memory', artist: 'HoliznaCC0', fallback: 'lofi' },
    { src: '/audio/radio/washed-up.mp3', title: 'Washed Up', artist: 'HoliznaCC0', fallback: 'lofi' },
    { src: '/audio/radio/ease-into-night.mp3', title: 'Ease into Night', artist: 'HoliznaCC0', fallback: 'lofi' },
    { src: '/audio/radio/moon-unit.mp3', title: 'Moon Unit', artist: 'HoliznaCC0', fallback: 'lofi' },
    { src: '/audio/radio/roof-tops.mp3', title: 'Roof Tops', artist: 'HoliznaCC0', fallback: 'lofi' },
  ],
};

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
  { id: 'hello',  label: 'HELLO (who we are)', color: '#bc2318', text: 'the name, typed out, and where to find us', module: () => import('./tapes/hello.js') },
  { id: 'bots',   label: 'THE BOTS',           color: '#9aa3b2', text: 'piabrota-ops and piabrota-hermes, and what each agent does', module: () => import('./tapes/bots.js') },
  { id: 'clock',  label: 'NIGHT CLOCK',        color: '#2e9e4f', text: 'the time in Rio, glowing in the dark', module: () => import('./tapes/clock.js') },
  { id: 'synth',  label: 'TAPE SYNTH',         color: '#d29922', text: 'a small instrument you play on the screen', module: () => import('./tapes/synth.js') },
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

// ── the records: h0ffmann's own repositories, in a crate on the floor.
// Each sleeve's cover is drawn from its name, so no two are alike.
export const records = {
  label: 'the records', hint: 'h0ffmann\'s repositories, one sleeve each', url: 'https://github.com/h0ffmann',
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

// Hoverable things. `name` matches a mesh name in your GLB (or the
// placeholder room, which builds one for each `art`). `action` is one
// of: 'shot', 'link', 'sfx', 'toggleLamp', 'toggleRadio'. `group` titles the LOFI list.
export const hotspots = [
  { name: 'window', label: 'Rio at night', hint: 'where piabrota is made', action: 'shot', value: 'window' },
  { name: 'shelf',  label: 'the shelf',    hint: 'the works with a DOI', action: 'shot', value: 'shelf' },
  { name: 'lamp',   label: 'lamp',         hint: 'on, off', action: 'toggleLamp' },
  { name: 'radio',  label: 'piabrota RADIO', hint: 'lofi, on and off', action: 'toggleRadio' },
  { name: 'sign',   label: 'piabrota',     hint: 'an open green eye on red', action: 'link', value: 'https://piabrota.art', group: 'piabrota' },
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
  { name: 'crate', label: records.label, hint: records.hint, action: 'shot', value: 'records', group: 'h0ffmann' },
  ...records.sleeves.map((r) => ({
    name: `record_${r.id}`, label: r.id, hint: r.line, action: 'link', value: r.url, group: 'h0ffmann',
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
