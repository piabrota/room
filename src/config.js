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

// The apartment: an old flat in Rio. The paint, the wood, the cloth and the rug of its shell
// (src/shell.js): repaint it here. `ink` and `inkSoft` are the words painted on the walls.
export const shell = {
  wall: '#e7dcc6', ceiling: '#f3eee3', trim: '#f1ebdf', reveal: '#ded3bf',
  floor: '#b9a48e', wood: '#9c8676', brass: '#b08a4a', curtain: '#d9cdb6',
  ink: '#33261d', inkSoft: '#77634f',
  rug: { at: [0.1, -0.2], size: [2.6, 1.8], colors: ['#7c1d17', '#1d2b45', '#e6d7b8', '#c59a45', '#2a120f'] },
};

// The furniture and the props that are files (src/furniture.js): photographed models from
// Poly Haven, CC0, packed by `just models` into `public/models/` (CREDITS.md). Each is
// `<file>.glb` for the laptop's look and `<file>.lite.glb` for the phone's; `phone: false`
// leaves a prop out of the phone's look. Swap a file for your own here; the room keeps the
// thing's place and size, and a missing file leaves a plain stand-in.
export const models = {
  base: '/models/',
  files: {
    tv: 'television_02',
    lamp: 'desk_lamp_arm_01',
    radio: 'boombox',
    chair: 'GreenChair_01',
    bookcase: 'wooden_bookshelf_worn',
    cabinet: 'modern_wooden_cabinet',
    sofa: 'Sofa_01',
    clock: 'vintage_grandfather_clock_01',
    chandelier: 'Chandelier_02',
    sideTable: 'side_table_tall_01',
    plant: 'potted_plant_02',
    pillows: { file: 'throw_pillows_01', phone: false },
    fern: { file: 'fern_02', phone: false },
    pot: { file: 'planter_pot_clay', phone: false },
    aloe: { file: 'potted_plant_04', phone: false },
    books: { file: 'book_encyclopedia_set_01', phone: false },
    pencilCup: { file: 'pencil_cup', phone: false },
    pens: { file: 'pens', phone: false },
    painting: { file: 'fancy_picture_frame_01', phone: false },
    suitcase: { file: 'vintage_suitcase', phone: false },
    ukulele: { file: 'Ukulele_01', phone: false },
    box: { file: 'cardboard_box_01', phone: false },
    alarm: { file: 'alarm_clock_01', phone: false },
    vase: { file: 'ceramic_vase_01', phone: false },
    fish: 'fish', // the aquarium's fish (src/aquarium.js): Microsoft's Barramundi, CC0 (`just fish`)
  },
};

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
  // Copacabana, live, behind the glass instead of the photographs: the webcam of Homes in Rio at
  // Posto 6, on YouTube, given by the owner on 10 November 2026 (AGENTS.md, invariants 1 and 7).
  // Its iframe is made on the click of the window's button, muted, and removed when it goes back
  // to Rio; the credit shows beside the button while it plays. A live stream's id can change when
  // its channel starts it again: then put the new one here.
  live: {
    button: { off: 'window: Rio', on: 'window: Copacabana live' }, hint: 'see Copacabana, Posto 6, live',
    title: 'Panorama Webcam Rio de Janeiro - Copacabana beach - Posto 6',
    embed: 'https://www.youtube-nocookie.com/embed/Bz9Hkrk1NcY?autoplay=1&mute=1&controls=0&playsinline=1&rel=0&disablekb=1&iv_load_policy=3',
    url: 'https://www.youtube.com/watch?v=Bz9Hkrk1NcY',
    credit: 'live: Copacabana, Posto 6 · Homes in Rio on YouTube',
  },
};

// Named camera shots. Keys 1..n or the buttons switch between them.
// `fov` is optional (degrees, landscape). In Blender, cameras named
// "shot_desk" etc. are picked up from the GLB (see cameras.js).
export const shots = {
  overview: { position: [3.1, 2.15, 3.3], target: [-0.4, 1.05, -0.6], fov: 50 },
  desk:     { position: [0.32, 1.36, 0.02], target: [0.2, 1.1, -1.5], fov: 46 },
  fabric:   { position: [-0.75, 1.55, 1.25], target: [-3.0, 1.5, 0.45], fov: 52 },
  shelf:    { position: [-1.75, 1.55, 0.4], target: [-2.1, 1.8, -1.9], fov: 52 }, // the works with a DOI, and tyler-durden-bot's board above them
  board:    { position: [2.55, 1.8, 0.25], target: [2.55, 1.82, -2.0], fov: 50 },
  window:   { position: [0.2, 1.62, 0.7], target: [0.2, 2.12, -2.0], fov: 56 },
  sea:      { position: [1.05, 1.62, 0.05], target: [3.35, 1.3, -0.45], fov: 50 },
  slipbox:  { position: [-1.55, 0.88, -0.3], target: [-2.2, 0.18, -0.98], fov: 46 },
  loop:     { position: [0.0, 1.6, 0.6], target: [-0.4, 1.5, 3.8], fov: 58 }, // the loop, and the door with its lock
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
  enterHint: '1–9, 0 or ← → to look around · Esc to step back',
  enterHintTouch: 'tap a button below to move · drag to look around · tap things to see what they are',
};

// The owner's playlist on Spotify: a mixtape on the sill, beside the
// radio, and a button beside the radio's at the top. Either opens
// Spotify's Embed player over the room (AGENTS.md, invariants 1 and 7):
// an iframe made on the click and removed on close, the one thing in the
// room that loads from another host. Its artists are credited beside it
// and in CREDITS.md (the playlist as Spotify listed it on 10 November 2026; who it is
// by, as the owner said that day).
export const playlist = {
  label: 'the mixtape', hint: 'GREAT RESET, a playlist on Spotify', button: '♫ playlist',
  title: 'GREAT RESET', by: 'a playlist by Leonardo AL aracyla',
  url: 'https://open.spotify.com/playlist/2hsuqvhCouatM8DtmKKl7U',
  embed: 'https://open.spotify.com/embed/playlist/2hsuqvhCouatM8DtmKKl7U?theme=0',
  tape: { title: 'GREAT RESET', side: 'A · on Spotify' },
  // the tracks, as Spotify's Embed player listed them on 10 November 2026 (CREDITS.md): the
  // player names the one that plays by its id, and the room shows its title and artists
  tracks: [
    { id: '3wZXoE4fHQ2jwK6rScF9gM', title: 'Brasileiro', artists: ['Puro Suco', 'BEATDOMK'] },
    { id: '39glDGcpBhLVMSsQhvtqHR', title: 'I Only Smoke When I Drink', artists: ['nimino'] },
    { id: '1aCr3cnbGeJgOtOqS1ahKG', title: 'NASCI PELADO, TÔ VESTIDO', artists: ['Brone', 'Jamé'] },
    { id: '750rGcrtBGUlPWh16o0r9D', title: 'Deus Do Furdunço', artists: ['Leo Gandelman', 'Machine Series', 'BK'] },
    { id: '3BYG6GNJypc1bIOxSkorDh', title: 'Julius', artists: ['BK', 'El Lif Beatz'] },
    { id: '2HkiLuom1eTh8ZEaGqQjLY', title: 'O Jeito', artists: ['Flora Matos'] },
    { id: '00XfUDUYQJ2hgG0vKpdwa6', title: 'Bora Dançar', artists: ['Flora Matos'] },
    { id: '7cP99Dd9VNjDpr4yYIRGK9', title: 'Sonhos Gangsta', artists: ['Flora Matos'] },
    { id: '7bWZVRVczxNi7MMzFLvJkw', title: 'Reunião', artists: ['Sain', 'Luccas Carlos', 'Akira Presidente', 'Bril', 'CHS', 'JXNV$', 'BK', 'Pirâmide Perdida'] },
    { id: '6uFYfyehWLRozy4VeOIjYX', title: 'Avanço', artists: ['Nectar Gang'] },
    { id: '4f8Mh5wuWHOsfXtzjrJB3t', title: 'I THINK', artists: ['Tyler, The Creator'] },
    { id: '0fv2KH6hac06J86hBUTcSf', title: 'NEW MAGIC WAND', artists: ['Tyler, The Creator'] },
    { id: '5hVghJ4KaYES3BFUATCYn0', title: 'EARFQUAKE', artists: ['Tyler, The Creator'] },
    { id: '0j2T0R9dR9qdJYsB7ciXhf', title: 'Stronger', artists: ['Kanye West'] },
    { id: '1y5redkkyifDxFKju5VcBD', title: 'California Uber Alles', artists: ['Dead Kennedys'] },
    { id: '73CgP34HUZQMvZf6TWkXQF', title: 'Me Toca', artists: ['Marina Sena'] },
    { id: '0eLBf8kyaS182M4gyTfoH1', title: 'Pelejei', artists: ['Marina Sena'] },
    { id: '00AAP0UYSQsvVboXEJ3n6h', title: 'Voltei Pra Mim', artists: ['Marina Sena'] },
    { id: '1Bl7yB00tqTkXE7fAXQ83r', title: 'Amiúde', artists: ['Marina Sena'] },
    { id: '70iK9fZYPTpxbpQ4ox8usx', title: 'Seu Olhar', artists: ['Marina Sena'] },
    { id: '0MAc9pefRKSDEjq8Q85Mky', title: 'Coisas Naturais', artists: ['Marina Sena'] },
    { id: '6C8H63gGFeDqAYJ75uLPA6', title: 'Sem Lei', artists: ['Marina Sena'] },
    { id: '64uJ4QVY4bsS9uSquePNGV', title: 'SENSEI', artists: ['Marina Sena'] },
    { id: '3CaW1cyS7f9PC8Bf0XCpZ6', title: 'CARNAVAL', artists: ['Marina Sena'] },
    { id: '7D9BJEcWwRqvQVqPbj1dbF', title: 'Sinais de fogo', artists: ['Preta Gil'] },
    { id: '4PCyzOTAB7zfJaxaS1uLSY', title: 'O Vento', artists: ['Los Hermanos'] },
    { id: '6aboy6b50nYKU7gW7RPXU1', title: 'ROMPEU O COURO.', artists: ['Marcelo D2', 'Juçara Marçal', 'BK', 'Baco Exu do Blues', 'Anelis Assumpção'] },
    { id: '2OKo7g3KfmCt3kyLvUAL0g', title: 'The Search', artists: ['NF'] },
    { id: '5C90YMJ6OMaPHD7MpRGubZ', title: 'Desenho', artists: ['Filipe Ret', 'Mãolee'] },
    { id: '6Stz1dIY7OD61gU7SdVR22', title: 'SPINE', artists: ['WesGhost'] },
    { id: '3excIMe9HKY56gkXWNkQDj', title: 'Ta Faltando Um', artists: ['Wealstarcks'] },
    { id: '1VkG1IcHVZfMS9CjuF3Iaq', title: 'LOVE IN RIO', artists: ['Wealstarcks'] },
    { id: '55niXiXepPmABGxm28vYmA', title: 'Copacabana 89', artists: ['Wealstarcks'] },
    { id: '0eAN72pD742qdEQxGQ7bYq', title: 'Quente !', artists: ['Akira Presidente', 'BK', 'Paulo DK', 'Abud'] },
    { id: '7EP8iM3OAfom5hLiVvKmJM', title: 'Asa', artists: ['Djavan'] },
    { id: '1mGOpXrIsTJFTeG5ITgjBF', title: 'Melhoria Gang', artists: ['Akira Presidente', 'El Lif Beatz'] },
    { id: '096gZM7wp5GKHBwtWY3d0z', title: 'a última dança', artists: ['Link do Zap', 'pluglip'] },
    { id: '2oSpQ7QtIKTNFfA08Cy0ku', title: 'It\'s The End Of The World As We Know It (And I Feel Fine)', artists: ['R.E.M.'] },
    { id: '04zVcQYcV9iPQVsQVVDkKD', title: 'Human', artists: ['Apashe', 'Wasiu'] },
    { id: '23zqFHNiDYWoayPU5k0IIR', title: 'Libertários Não Morrem', artists: ['Filipe Ret', 'IbraBeats', 'Funkero'] },
    { id: '7dcogxYnGecgTSnXOKgibA', title: 'Música', artists: ['Alternativo Ponto de Vista', 'Luiz Barata', 'Hariel Malay'] },
    { id: '3yfqSUWxFvZELEM4PmlwIR', title: 'The Real Slim Shady', artists: ['Eminem'] },
    { id: '0VyCznZeMBOKcYAbg5tBn0', title: 'Asas', artists: ['Luedji Luna'] },
    { id: '5uSnNITp4UvRePHXo9vGV7', title: 'Um Corpo no Mundo', artists: ['Luedji Luna'] },
    { id: '5TTWOyGAjATPEuDiTIRd62', title: 'Acalanto', artists: ['Luedji Luna'] },
    { id: '1RJJN0Q4lAwh13t2keNEFK', title: 'Banho de Folhas', artists: ['Luedji Luna'] },
    { id: '4TaY35s44Bf6OQnRK4R8Y5', title: 'West Coast', artists: ['The Neighbourhood'] },
    { id: '4I5mAYL7q5kqCTUtcvGlTm', title: 'TOKYO HEAT', artists: ['C.H.A.Y.'] },
    { id: '3x4378ztiLvFmm2nuzEI0C', title: 'The Cruel Angel\'s Thesis (Director\'s Edit Version)', artists: ['高橋 洋子'] },
    { id: '6tr15ncrJk0TSHQ7V8wzSC', title: 'O Samba Morreu', artists: ['Link do Zap'] },
    { id: '1YK3f7UWuW7uVTBJlsNrPC', title: 'Pseudosocial', artists: ['Froid'] },
    { id: '4kDzgYkIVT1JHFpKZOPxGW', title: 'Babylon By Gus', artists: ['Black Alien'] },
    { id: '6SNGzhVrisdq63Ndz58ovT', title: 'Luv (sic)', artists: ['Nujabes'] },
    { id: '1mXmnRFhiJNX50L1KhIRnw', title: 'Rio', artists: ['Ugovhb', 'EF'] },
    { id: '3GTIrQEHUadwd6RZgvBnaE', title: 'Mar', artists: ['pumapjl', 'Babidi'] },
    { id: '6bo8PYoNd8EHwv03a5z87D', title: 'Gypsy Woman', artists: ['Levi.Sct'] },
    { id: '1gWnuGAiTk3Q4yrIbwymUK', title: 'Zoom Zoom', artists: ['Polo & Pan'] },
    { id: '16iyre1V8HTENspdKCaG3u', title: 'São Paulo Sunset', artists: ['Saib'] },
    { id: '1qpP75RkuITWHlDo6RmMMs', title: 'FESTA DE ADEUS', artists: ['Julio Secchin'] },
    { id: '5AKrqJ7RiOCfCaaCuxxGk0', title: 'Preciso Me Encontrar', artists: ['Cartola'] },
  ],
  words: {
    open: 'open in Spotify', close: 'close', artists: 'with',
    note: 'Full tracks play when you are logged in to Spotify in this browser; otherwise Spotify plays 30-second previews. "open in Spotify" plays them all, in any browser.',
    credit: 'Music played by Spotify; each track names its artists. No audio is copied into this room.',
    // the lyrics toggle: the room shows no lyrics (they are their writers', and Spotify is the one
    // licensed to show them), so it says where they are
    lyrics: 'lyrics', lyricsHide: 'hide lyrics',
    now: 'now playing',
    lyricsNote: 'Spotify shows the lyrics of each song, line by line with the music, in its own app: "open in Spotify", play a track and open its lyrics under the player. The room shows none of them; they belong to the people who wrote them.',
  },
};
// every artist of the playlist, once, in the order they first play: named beside the player
playlist.artists = [...new Set(playlist.tracks.flatMap((t) => t.artists))];
// piabrota RADIO: ten lofi pieces written for the room, a piano first,
// with an upright bass, a flute and a boom-bap kit, and on some a nylon
// guitar or a vibraphone. They are written in
// Csound, the scores in music/ (`just lofi` renders them, CREDITS.md). A
// station plays its tracks one after another from a random start; with
// one station, its row of buttons stays hidden. The radio plays through
// the room's sound, so the sound button mutes it too, and the rain steps
// back while it plays. A missing file falls back to a synthesized lofi bed.
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
      { src: '/audio/radio/varanda.mp3', title: 'Varanda, duas da manhã', artist: 'piabrota', fallback: 'lofi' },
      { src: '/audio/radio/carta.mp3', title: 'Carta para o mar', artist: 'piabrota', fallback: 'lofi' },
      { src: '/audio/radio/corredor.mp3', title: 'Flauta no corredor', artist: 'piabrota', fallback: 'lofi' },
      { src: '/audio/radio/fita.mp3', title: 'Última fita', artist: 'piabrota', fallback: 'lofi' },
      { src: '/audio/radio/metro.mp3', title: 'Depois do metrô', artist: 'piabrota', fallback: 'lofi' },
      { src: '/audio/radio/chuva.mp3', title: 'Chuva fina no Catete', artist: 'piabrota', fallback: 'lofi' },
      { src: '/audio/radio/cafe.mp3', title: 'Café coado', artist: 'piabrota', fallback: 'lofi' },
      { src: '/audio/radio/janela.mp3', title: 'Janela acesa', artist: 'piabrota', fallback: 'lofi' },
      { src: '/audio/radio/bilhete.mp3', title: 'Bilhete na geladeira', artist: 'piabrota', fallback: 'lofi' },
      { src: '/audio/radio/domingo.mp3', title: 'Domingo sem pressa', artist: 'piabrota', fallback: 'lofi' },
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
  // Nash's meow: a real cat, public domain (CREDITS.md); the synthesized one is its fallback (src/audio.js)
  meow:   { src: '/audio/meow.mp3',   fallback: 'meow' },
  // the water balloon (src/splash.js): the rubber's snap, and its water meeting the tank's; both synthesized until recorded
  pop:    { src: '/audio/pop.mp3',    fallback: 'pop' },
  splash: { src: '/audio/splash.mp3', fallback: 'splash' },
};

// Tapes: each one is a module in src/tapes with mount/frame/input/stop.
// `label` shows on hover, `color` tints the room light while it plays,
// `text` is the line the LOFI (plain text) view shows for the tape.
// `spine` is what is written on the cassette's own labels, and in which
// face: one of the retro faces in src/art.js (`marker`, `neon`, `pixel`,
// `terminal`, `typewriter`), with the colour of the label and its ink, and
// `code`, the length printed small on it.
// `sleeve` is the card box the cassette lives in (src/vhs.js): a `style`
// (`waves`, `rings`, `bigtype`, `grid`, `sunburst`, `smalltype`: six
// layouts, not one in six colours), its `colors` (the card first, then the
// print), a `sub` line, a `face` when the sleeve is not set in the label's
// (`title` and `mono` are the room's two), and `finish: 'gloss'` for a
// laminated card. A tape with no `sleeve` lies bare, its sticker written
// by hand or typed. Where each one lies is in `stack`, below.
export const tapes = [
  { id: 'marola',    label: 'marola.dev',     color: '#0f3d66', text: 'the sea of marola-dev: its repositories, floating on live waves', spine: { text: 'marola.dev', face: 'neon', paper: '#08243f', ink: '#5cc8ff', code: 'T-120' }, sleeve: { style: 'waves', colors: ['#0a2c4d', '#5cc8ff', '#eaf6ff', '#f2c14e'], sub: 'live waves', finish: 'gloss' }, module: () => import('./tapes/marola.js') },
  { id: 'ouroboric', label: 'ouroboric-dev',  color: '#3a1d0e', text: 'Ouroboric\'s factory: the snake that eats its tail, and the repositories on its loop', spine: { text: 'ouroboric-dev', face: 'pixel', paper: '#f2e6c9', ink: '#c2410c', code: 'E-180' }, sleeve: { style: 'rings', colors: ['#efe2c2', '#c2410c', '#3a1d0e', '#e2a03f'], sub: 'the factory loop' }, module: () => import('./tapes/ouroboric.js') },
  { id: 'piabrota', label: 'PIABROTA (the fabric)', color: '#1682d4', spine: { text: 'piabrota', face: 'marker', paper: '#f4efe4', ink: '#1682d4', code: 'T-160' }, sleeve: { style: 'bigtype', face: 'title', colors: [theme.accent, theme.eye.white, theme.eye.iris, theme.eye.white], sub: 'the fabric', finish: 'gloss' }, text: 'a radio piece on piabrota, its people, its agents and its works, with links', module: () => import('./tapes/piabrota.js') },
  { id: 'hello',  label: 'HELLO (who we are)', color: '#bc2318', spine: { text: 'hello', face: 'marker', paper: '#f4efe4', ink: '#bc2318', code: 'T-30' }, text: 'the name, typed out, and where to find us', module: () => import('./tapes/hello.js') },
  { id: 'bots',   label: 'THE BOTS',           color: '#9aa3b2', spine: { text: 'the bots', face: 'typewriter', paper: '#e9e4d8', ink: '#22252d', code: 'T-60' }, text: 'piabrota-ops and piabrota-hermes, and what each agent does', module: () => import('./tapes/bots.js') },
  { id: 'clock',  label: 'NIGHT CLOCK',        color: '#2e9e4f', spine: { text: 'night clock', face: 'terminal', paper: '#0b0d12', ink: '#3FB950', code: 'E-240' }, sleeve: { style: 'grid', colors: ['#0b0d12', '#2e9e4f', '#3FB950', '#d8ffe0'], sub: place.city }, text: 'the time in Rio, glowing in the dark', module: () => import('./tapes/clock.js') },
  { id: 'synth',  label: 'TAPE SYNTH',         color: '#d29922', spine: { text: 'tape synth', face: 'neon', paper: '#1a1208', ink: '#ffb347', code: 'T-90' }, sleeve: { style: 'sunburst', colors: ['#1a1208', '#d29922', '#ffe9b8', '#c2410c'], sub: 'play the screen' }, text: 'a small instrument you play on the screen', module: () => import('./tapes/synth.js') },
  { id: 'csound', label: 'LOFI IN CSOUND', color: '#1d2333', spine: { text: 'lofi in csound', face: 'terminal', paper: '#0b0d12', ink: '#ffb347', code: 'E-60' }, sleeve: { style: 'grid', colors: ['#0b0d12', '#ffb347', '#7dd3a6', '#f3ead8'], sub: 'the code of the music' }, text: 'the radio\'s lofi pieces, each playing while its Csound score runs up the screen; a click for the next', lang: 'csound', hint: 'click: next piece', pieces: radio.stations.flatMap((s) => s.tracks), module: () => import('./tapes/csound.js') },
  { id: 'cv',        label: 'CV (h0ffmann)',  color: '#1b1d22', text: 'Matheus Hoffmann\'s track record, year by year, and his six works with a DOI', spine: { text: 'cv / h0ffmann', face: 'terminal', paper: '#0f1a12', ink: '#7dff9b', code: 'E-120' }, sleeve: { style: 'smalltype', face: 'typewriter', colors: ['#e4dfd2', '#22252d', ...Object.values(theme.lanes)], sub: 'track record' }, module: () => import('./tapes/cv.js') },
];
// The stack beside the VCR: piles side by side, each from the bottom up, by
// tape id; nothing is squared up. A tape named in no pile goes on the
// shortest. A bare cassette belongs on top of its pile (the pile closes up
// when it leaves). `gap` is the space between two piles, in metres.
export const stack = { piles: [['marola', 'ouroboric', 'clock', 'synth', 'hello'], ['piabrota', 'cv', 'bots', 'csound']], gap: 0.03 };
// The VCR's face (src/vhs.js): a brand that does not exist, the words printed
// on it, and the clock that nobody ever set. `lit` are the words behind the
// display's glass (the first one is on), `keys` the six under it.
export const deck = {
  brand: 'BROTA', model: 'PB-180', badge: '4 HEAD', line: 'VIDEO CASSETTE RECORDER',
  clock: '12:00', lit: ['SP', 'HI-FI', 'TIMER'], keys: ['EJECT', 'REW', 'PLAY', 'FF', 'STOP', 'REC'], led: 'POWER',
};

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

// ── tyler-durden-bot: a third GitHub App, still being built, on its own board ──
// It sums up a large pull request on h0ffmann/proof in one comment. Its code is
// in piabrota/agents#6 (the agent) and piabrota/nix-os#173 (the host). Its board is
// the square one above the bookshelf of the works with a DOI: the owner's pixel portrait
// as it is (`logo`, CREDITS.md), and a ring of
// red bulbs that blink at random, by night only (`lights`: how many, and their colour).
export const wip = {
  id: 'tyler-durden-bot', name: 'tyler-durden-bot', initials: 'TD', color: '#D29922',
  logo: '/textures/tyler-durden-bot.png', lights: { count: 26, color: '#ff1a0a' },
  line: 'one comment for a large pull request',
  hint: 'work in progress: a GitHub App that sums up a large pull request',
  tag: 'WORK IN PROGRESS',
  url: 'https://github.com/piabrota/agents/pull/6',
};

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

// ── the papers on aiXiv, by Matheus Hoffmann, beside the works with a DOI: two bound preprints,
// white covers, each a link to its aiXiv page (the owner, 11 November 2026). Titles, authors and
// numbers as their aiXiv pages give them (read 11 November 2026).
export const papers = {
  group: 'papers on aiXiv', on: 'aiXiv',
  list: [
    { id: 'ww3-gpu-paper', aixiv: '2611.01104', title: 'Wave models on GPUs: C++/Kokkos and Rust ports of WAVEWATCH III that must give the Fortran\'s bits', spine: 'Wave models on GPUs', by: 'Matheus Hoffmann, Pedro Veras Guimarães, Pedro Cruz', color: '#f1ede4', ink: '#2b6fb3' },
    { id: 'proof',         aixiv: '2611.01105', title: 'A decision layer for contextual bandits, proved in Agda', spine: 'Bandits, proved in Agda', by: 'Matheus Hoffmann', color: '#f1ede4', ink: '#2f8f45' },
  ],
};

// ── how I read: ten technical ebooks from the owner's library, most on functional programming
// and the architecture of real systems, on the bookcase under the works with a DOI. Each is a
// spine in its cover's colours (`color` the cover, `ink` its title), named by its language
// (`lang`, the one the cover names), and a link to its page on Leanpub (the owner, 10 November
// 2026). No cover is copied into the room: only the colours, the title and the authors.
export const reads = {
  group: 'how I read', on: 'on Leanpub',
  books: [
    { id: 'certainty-by-construction', title: 'Certainty by Construction', by: 'Sandy Maguire', lang: 'agda', color: '#f6d200', ink: '#1b1b1b', url: 'https://leanpub.com/certainty-by-construction' },
    { id: 'devops-toolkit-catalog', title: 'The DevOps Toolkit: Catalog, Patterns, and Blueprints', spine: 'The DevOps Toolkit', by: 'Viktor Farcic, Darin Pope', lang: 'devops', color: '#f3f2ee', ink: '#2b2b2b', url: 'https://leanpub.com/the-devops-toolkit-catalog' },
    { id: 'rust-from-the-ground-up', title: 'Rust From the Ground Up', by: 'Matthew Provost', lang: 'rust', color: '#2a1b14', ink: '#ff6a1f', url: 'https://leanpub.com/rust-from-the-ground-up' },
    { id: 'python-master', title: 'The Python Master', by: 'Robert Smallshire, Austin Bingham', lang: 'python', color: '#f6f6f4', ink: '#2c4a6e', url: 'https://leanpub.com/python-master' },
    { id: 'clean-architectures-in-python', title: 'Clean Architectures in Python', by: 'Leonardo Giordani', lang: 'python', color: '#d9821c', ink: '#fff6e4', url: 'https://leanpub.com/clean-architectures-in-python' },
    { id: 'feda', title: 'Functional Event-Driven Architecture', by: 'Gabriel Volpe', lang: 'scala', color: '#8f8ef0', ink: '#141414', url: 'https://leanpub.com/feda' },
    { id: 'simple-haskell-book', title: 'The Simple Haskell Handbook', by: 'Marco Sampellegrini', lang: 'haskell', color: '#f27d0c', ink: '#fff8ee', url: 'https://leanpub.com/simple-haskell-book' },
    { id: 'production-haskell', title: 'Production Haskell', by: 'Matt Parsons', lang: 'haskell', color: '#f5f1e6', ink: '#262626', url: 'https://leanpub.com/production-haskell' },
    { id: 'functional-design-and-architecture', title: 'Functional Design and Architecture', by: 'Alexander Granin', lang: 'haskell', color: '#222222', ink: '#ececec', url: 'https://leanpub.com/functional-design-and-architecture' },
    { id: 'pfp-scala', title: 'Practical FP in Scala', by: 'Gabriel Volpe', lang: 'scala', color: '#a88ae8', ink: '#161616', url: 'https://leanpub.com/pfp-scala' },
  ],
};

// ── the sea: marola-dev's repositories as buoys on an aquarium, the wall painted with the sea ──
// The waves are computed live, a nod to ww3-gpu (WAVEWATCH III). `aquarium` is how many fish swim
// in it (the big ones and the little school, fewer on the phone's look) and the colours of the
// fish; `wall` the blues of the stripes painted across the whole right wall, from the deep at the
// floor to the shallows under the cornice. `balloon` is the water balloon that hangs over the tank
// (src/splash.js): a click bursts it and its water falls in. Its words, the colours the balloons
// come in (the next one after each burst), its radius and how high over the water its bottom hangs
// (metres), the seconds until a new one is filled, how many drops fly (fewer on the phone's look),
// the shutter that smears a fast drop into a streak (seconds), and `speed`: 1 is the real speed
// of falling water, 0.5 is slow motion.
export const sea = {
  label: 'marola', hint: 'the water super app, and the sea it floats on', url: 'https://marola.dev',
  aquarium: {
    fish: 5, liteFish: 3, school: 16, liteSchool: 9,
    tints: ['#ffffff', '#ffd9a0', '#d8e6ff', '#ffe9c9', '#f2f2f2'], // over the photographed skin: silver, gold, a cold one
    schoolColors: { back: '#5fd0ff', belly: '#d9dde2', tail: '#e0473a' }, // the little ones: a blue stripe, a red tail
  },
  wall: { colors: ['#06243f', '#0b3a63', '#1265a8', '#1682D4', '#4aa3e3', '#8cc8f0'], paint: '#dfe6ea' },
  balloon: {
    label: 'water balloon', hint: 'burst it: 1.4 litres of water fall into the tank',
    colors: ['#BC2318', '#D29922', '#3FB950', '#1682D4'],
    radius: 0.07, height: 0.5, across: 0.36, refill: 6, drops: 2000, liteDrops: 500, shutter: 0.0035, speed: 1,
  },
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

// ── the door: locked; an email opens the way to its lock of four digits, the room's one puzzle ──
// Each digit counts something in the room (its last digit, past nine), so the code stays true when
// a list changes: the tapes beside the VCR, the works on the shelf, the faces on the board, the
// bots on the desk. The keypad (src/lock.js) gives the four clues; the right code swings the door
// open on a warm light and the lines of `beyond`. A visitor's solved door stays open
// in their browser (localStorage), and `?locked` locks it again.
export const door = {
  label: 'door', hint: 'locked: four digits open it',
  openLabel: 'the open door', openHint: 'close it',
  lock: {
    title: 'the lock', prompt: 'four digits. count them in the room:',
    clues: ['the tapes beside the VCR', 'the works with a DOI on the shelf', 'the faces pinned on the board', 'the bots on the desk'],
    code: [tapes.length, works.length, people.length, bots.length].map((n) => n % 10).join(''),
    clear: 'clear', enter: 'open', close: 'close', wrong: 'not that one', right: 'the lock turns',
  },
  // the gate: the keypad opens only for a visitor who leaves an email. It is posted to `endpoint`
  // on the room's own host (scripts/listeners.mjs, run by piabrota/nix-os), kept there, and never
  // shown on the page or sent anywhere else.
  gate: {
    endpoint: '/live/door',
    line: 'the door is locked. leave your email to try the lock:',
    placeholder: 'you@example.com', button: 'let me try',
    privacy: 'kept on piabrota’s own server, only to write to you about the room. nothing else.',
    sending: 'sending…', invalid: 'that does not look like an email', failed: 'the door did not answer. try again later',
  },
  beyond: ['you found', 'the way out.', '', 'it was a flat circle', 'all along.'],
};

// ── Nash, the black cat: he wanders the room on his own, from the top of the shelf to the
// monitor, the sill, the chair, the crate and the rug; a click calls him: he stops, looks at
// you and meows (src/cat.js). `perches` are where he sits: a name, the point he sits on
// [x, y, z] in metres, the way he faces (radians, 0 is toward the window), and `via`, a perch
// he leaps from when it is too high to jump to from the floor (the shelf from the desk).
export const cat = {
  name: 'Nash', hint: 'a black cat. he goes where he wants', color: '#0c0c0f', eyes: '#d9e84a',
  perches: [
    { id: 'rug', at: [0.2, 0.013, 0.3], face: 2.6 },
    { id: 'rug2', at: [1.0, 0.013, 0.2], face: -2.2 },
    { id: 'floor', at: [-1.2, 0, 1.4], face: 0.8 },
    { id: 'sofa', at: [-2.5, 0.42, 0.15], face: 1.6 },
    { id: 'desk', at: [1.12, 0.805, -1.22], face: 2.8 },
    { id: 'deskLeft', at: [-0.82, 0.805, -1.17], face: 2.4 },
    { id: 'monitor', at: [0.0, 1.55, -1.56], face: 3.14, via: 'desk' },
    { id: 'sill', at: [0.72, 1.015, -2.03], face: 2.9, via: 'desk' },
    { id: 'crate', at: [-2.2, 0.28, -1.15], face: 2.2 },
    { id: 'shelf', at: [-2.4, 1.9, -1.8], face: 3.14, via: 'deskLeft' },
  ],

};

// ── the screen guard (src/guard.js): the page goes black on PrintScreen and while the window is
// away, and the room's words cannot be selected. `false` turns it off for a fork that wants none.
export const guard = { screenshots: true };

// ── you: a pair of feet under the camera, seen when you look down ──
export const body = { shoes: '#e9e6df', soles: '#f7f5f0', jeans: '#2b3a55', laces: '#c9c3b6' };

// ── the credits: whose idea a room like this is, and whose work is in this one ──
// One export, shown in three places: the credits button of the HUD and its card
// (src/creditscard.js), the brass plate on the back wall (src/credits.js, the hotspot `credits`),
// and the credits of the LOFI page (src/lofi.js).
// The idea is credited by name, in text only: nothing here links to a page of his, and the one
// address is this repository's own (AGENTS.md, invariant 2; the check asks).
// `idea.where`: his own site's description read "I work on Claude at Anthropic." on
// 10 November 2026. Say nothing else about him.
// `sources` is the short list; CREDITS.md is the full one, and every name and licence here is
// copied from it. A row added there gets its row here: what it is in the room, who made it,
// and its licence.
const ideaBy = 'Felix Rieseberg';
export const credits = {
  button: 'credits', title: 'credits', close: 'close',
  idea: {
    heading: 'the idea', name: ideaBy,
    line: `A personal site that is a 3D room, with camera shots, things to hover and VHS tapes that play on a TV: the idea comes from ${ideaBy}, who built one for his own site.`,
    where: 'He works on Claude at Anthropic.',
    own: 'This room is a separate work. It uses no code, model, texture, sound or text of his.',
  },
  sourcesHeading: 'in this room, from others',
  sources: [
    { what: 'the rain on the window', who: 'cori', licence: 'public domain' },
    { what: 'Nash\'s meow', who: 'Heismark', licence: 'public domain' },
    // made by `just compose` from samples that are not in the repository: a build without them plays synthesized sounds
    { what: 'the field recordings in the city\'s hum, the VCR\'s sounds and the piabrota tape', who: 'klankbeeld, YleArkisto, magedu', licence: 'CC BY 4.0' },
    // one row for all that comes from Poly Haven: the furniture, the props and the photographed surfaces.
    // CREDITS.md names each one's author (`just models` writes those rows).
    { what: 'furniture, props and surfaces', who: 'Poly Haven and its authors', licence: 'CC0 1.0' },
    { what: 'the big fish in the aquarium (the Barramundi)', who: 'Microsoft, from the Khronos glTF sample assets', licence: 'CC0 1.0' },
    { what: 'Rio by day, behind the window', who: 'Arian Zwegers', licence: 'CC BY 2.0' },
    { what: 'Rio at night, behind the window', who: 'Wilfredor', licence: 'CC0 1.0' },
    { what: 'the instruments of the lofi on the radio', who: 'FluidR3 GM, by Frank Wen', licence: 'MIT' },
    { what: 'the music of the playlist', who: 'its artists and their labels, streamed by Spotify', licence: 'Spotify\'s terms' },
    { what: 'Copacabana live behind the window', who: 'the webcam of Homes in Rio, streamed by YouTube', licence: 'YouTube\'s terms' },
    { what: 'the typefaces', who: 'Sorkin Type, JetBrains, Font Diner, Vernon Adams, CodeMan38, Peter Hull, Astigmatic', licence: 'OFL-1.1, Apache-2.0' },
    { what: 'the land on the ▲ grid map', who: 'Natural Earth', licence: 'public domain' },
    { what: 'the wind on that map', who: 'NOAA (GFS), through Open-Meteo', licence: 'public domain, CC BY 4.0' },
    { what: 'the sea\'s temperature on that map', who: 'Met Office (OSTIA), E.U. Copernicus Marine Service', licence: 'the Copernicus Marine Service licence' },
    { what: 'the libraries', who: 'three.js, Vite, MapLibre GL JS', licence: 'MIT, MIT, BSD-3-Clause' },
  ],
  full: { line: 'Every file, source and licence is in', label: 'CREDITS.md', url: 'https://github.com/piabrota/room/blob/main/CREDITS.md' },
  // the plate on the wall: what its hover says, and what is engraved on it
  plate: {
    label: `the idea: ${ideaBy}`, hint: 'he works on Claude at Anthropic · click for the credits',
    top: 'the idea', name: ideaBy, bottom: 'works on Claude at Anthropic',
  },
};

// ── LOFI: the room as a page to read. The sections are in this order,
// each with its word. Posts are Markdown files in posts/ (front matter:
// title, date, summary); the newest is first, and the feed lists them.
export const reading = {
  site: 'https://room.piabrota.art',
  feed: '/feed.xml',
  sections: { home: 'home', about: 'about', work: 'work', posts: 'posts', online: 'online', subscribe: 'subscribe', credits: 'credits' },
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
// of: 'shot', 'link', 'sfx', 'toggleLamp', 'toggleRadio', 'playlist', 'door', 'cat', 'credits', 'splash'.
// `group` titles the LOFI list.
// ── ▲ grid: the Brazilian coast on a triangle mesh, its waves played back
// on a map (src/grid.js, docs/SURVEY.md, section 6). The chart hangs on
// the right wall; its shot (key 0) opens the map. `just grid` makes the
// files in public/grid/: the land (Natural Earth), the mesh, and 24 h of
// GFS winds over it with the sea they raise. The sea is an estimate from
// the wind (Pierson-Moskowitz, a fully developed sea), not yet a WAVEWATCH
// III run: that is the next step (the ww3-grid skill).
const gridBbox = [-56, -35.5, -27, 6.5];
export const grid = {
  // its own name: on this host (or with `?grid`) the room opens straight on the map, and Esc or
  // "back to the room" steps into the room behind it (src/main.js)
  host: 'grid.piabrota.art',
  label: '▲ grid', hint: 'the Brazilian coast on triangles: 24 h of sea, and its temperature',
  title: '▲ grid · the Brazilian coast',
  credit: 'Triangle grids for WAVEWATCH III: Dr. Aron Roland (with Fabrice Ardhuin); at NOAA, Dr. Ali Abdolali.',
  note: 'The sea here is estimated from the wind (Pierson–Moskowitz, fully developed), not a WAVEWATCH III run.',
  sources: 'Land: Natural Earth · Wind: NOAA GFS 0.25°, through Open-Meteo (CC BY 4.0) · Temperature: OSTIA, generated using E.U. Copernicus Marine Service information (doi:10.48670/moi-00165); these data were provided by GHRSST and Met Office',
  // the domain of `just grid`: west, south, east, north; how far out the mesh goes, in km;
  // the spacing of its nodes near the coast and far out, in km
  bbox: gridBbox, reach: 550, spacing: [9, 70],
  // the views of the map's buttons: [west, south], [east, north] in degrees; the first is the whole
  // domain. public/grid/land.json has the coast and no state borders. So each end of a coast below
  // is the vertex of that polygon (Natural Earth, South America) nearest the place, and the box adds
  // sea to the south and east. The nodes of mesh.bin inside each box were counted.
  //  rio: Paraty (-44.68, -23.21), Cabo Frio (-41.99, -22.85) and the north of the state
  //    (-40.96, -21.24) lie inside; the box adds 0.3° of land and about 2° of sea south and east
  //    (1023 nodes).
  //  bahia: the south of the state (-39.65, -18.25) and the Real river, the border with Sergipe
  //    (-37.41, -11.50), lie inside; the east-most vertex of the coast is -38.88. The box adds sea to
  //    -35.4 and a little coast north of the state (1555 nodes).
  //  salvador: the Baía de Todos os Santos spans lon -38.85 to -38.40 and lat -13.03 to -12.62 in the
  //    coast. The box frames it with the open sea in front of the city (-38.5, -12.97). It holds 105
  //    nodes: the mesh is 9 km at the coast, so few triangles show.
  presets: [
    { id: 'brasil', label: 'Brasil', hint: 'the whole coast of the mesh', bounds: [[gridBbox[0], gridBbox[1]], [gridBbox[2], gridBbox[3]]] },
    { id: 'rio', label: 'Rio de Janeiro', hint: 'the coast of the state of Rio de Janeiro, from Paraty to the north of the state', bounds: [[-45.4, -25.4], [-39.8, -20.8]] },
    { id: 'bahia', label: 'Bahia', hint: 'the whole coast of the state of Bahia, from the south to the border with Sergipe', bounds: [[-40.6, -19.2], [-35.4, -10.6]] },
    { id: 'salvador', label: 'Salvador', hint: 'the city and the Baía de Todos os Santos, close up', bounds: [[-39.0, -13.4], [-37.8, -12.4]] },
  ],
  files: { run: '/grid/run.json', mesh: '/grid/mesh.bin', frames: '/grid/frames.bin', sst: '/grid/sst.bin', land: '/grid/land.json' },
  // the flow over the sea: how many particles, the points of each trail, how long one lives (s),
  // and how fast it goes, in degrees a second for each m/s of the waves' group speed
  flow: { particles: 1600, trail: 24, life: [2, 5], speed: 0.6 },
  // places to name on the map: [label, longitude, latitude]
  places: [['Rio de Janeiro', -43.2, -22.9], ['Salvador', -38.5, -12.97], ['Recife', -34.88, -8.05], ['Fortaleza', -38.53, -3.73], ['Florianópolis', -48.55, -27.6], ['Belém', -48.5, -1.45]],
  words: {
    play: 'play', pause: 'pause', back: 'back to the room', hs: 'sea (Hs)', sst: 'temperature', wind: 'wind', node: 'node', m: 'm', ms: 'm/s', c: '°C', from: 'from', toward: 'waves toward', presets: 'views',
    hsLong: 'the height of the sea (Hs)', sstLong: 'the temperature of the sea’s surface', sstDay: 'OSTIA, day', noSst: 'no temperature in this run: just grid',
    flow: 'The lines flow where the waves travel, at their group speed (about 0.57 × the wind, for a sea it fully raised).',
    loading: 'loading the grid…', missing: 'no run yet: just grid',
    fold: 'fewer: fold the panel', unfold: 'more: the hours, the notes and the sources', full: 'the whole screen',
  },
};

export const hotspots = [
  { name: 'chart', label: grid.label, hint: grid.hint, action: 'shot', value: 'grid' },
  { name: 'window', label: 'Rio at night', hint: 'where piabrota is made', action: 'shot', value: 'window' },
  { name: 'shelf',  label: 'the shelf',    hint: 'the works with a DOI, and the papers on aiXiv', action: 'shot', value: 'shelf' },
  { name: 'lamp',   label: 'lamp',         hint: 'on, off', action: 'toggleLamp' },
  { name: 'radio',  label: 'piabrota RADIO', hint: 'lofi, on and off', action: 'toggleRadio' },
  { name: 'mixtape', label: playlist.label, hint: playlist.hint, action: 'playlist', art: { kind: 'mixtape' } },
  { name: 'quote',  label: '"Time is a flat circle."', hint: 'Rust Cohle', action: 'link', value: 'https://en.wikipedia.org/wiki/Rust_Cohle', group: 'inspiration', art: { kind: 'quote', text: 'Time is a flat circle', by: 'Rust Cohle' } },
  { name: 'sign',   label: 'piabrota',     hint: 'an open green eye on red', action: 'link', value: 'https://piabrota.art', group: 'piabrota' },
  { name: 'door',   label: door.label, hint: door.hint, action: 'door' },
  { name: 'cat',    label: cat.name, hint: cat.hint, action: 'cat' },
  { name: 'fax',    label: contact.label, hint: emailText, action: 'link', value: mailto, group: 'contact', art: { kind: 'fax' } },
  { name: 'fax_linkedin', label: contact.linkedin.label, hint: contact.name, action: 'link', value: contact.linkedin.url, group: 'contact' },
  { name: 'folder_closed-source', label: closedSource.label, hint: closedSource.hint, action: 'link', value: closedSource.url, group: 'closed source', art: { kind: 'folder' } },
  { name: 'letter_closed-source', label: closedSource.letter.label, hint: closedSource.letter.hint, action: 'link', value: closedSource.letter.url, group: 'closed source' },
  { name: 'note',   label: 'inspiration: Robert M. Pirsig', hint: 'Zen and the Art of Motorcycle Maintenance', action: 'link', value: 'https://en.wikipedia.org/wiki/Robert_M._Pirsig', group: 'inspiration', art: { kind: 'note', glyph: '無' } },
  { name: 'credits', label: credits.plate.label, hint: credits.plate.hint, action: 'credits', art: { kind: 'credits', top: credits.plate.top, name: credits.plate.name, bottom: credits.plate.bottom } },
  ...projects.map((p) => ({
    name: `frame_${p.id}`, label: p.id, hint: p.line, action: 'link', value: p.url, group: 'projects',
    art: { kind: 'frame', glyph: p.glyph, color: theme.lanes[p.lane] },
  })),
  ...bots.map((b) => ({
    name: `bot_${b.id}`, label: b.name, hint: b.role, action: 'link', value: b.url, group: 'bots',
    art: { kind: 'bot', color: b.color },
  })),
  {
    name: `board_${wip.id}`, label: `${wip.name} (wip)`, hint: wip.hint, action: 'link', value: wip.url, group: 'bots',
    art: { kind: 'wip', initials: wip.initials, title: wip.name, line: wip.line, tag: wip.tag, color: wip.color, logo: wip.logo, lights: wip.lights },
  },
  ...people.map((p) => ({
    name: `photo_${p.id}`, label: `@${p.name}`, hint: p.line, action: 'link', value: p.url, group: 'people',
    art: { kind: 'photo' },
  })),
  ...works.map((w) => ({
    name: `book_${w.id}`, label: w.title, hint: `doi ${w.doi}`, action: 'link', value: `https://doi.org/${w.doi}`, group: 'works with a DOI',
    art: { kind: 'book', color: w.color },
  })),
  ...papers.list.map((p) => ({
    name: `paper_${p.id}`, label: p.title, hint: `aiXiv:${p.aixiv} · ${p.by}`, action: 'link', value: `https://aixiv.online/abs/${p.aixiv}`, group: papers.group,
    art: { kind: 'paper', color: p.color, ink: p.ink, spine: p.spine, by: p.by },
  })),
  ...reads.books.map((b) => ({
    name: `read_${b.id}`, label: b.title, hint: `${b.by} · ${b.lang} · ${reads.on}`, action: 'link', value: b.url, group: reads.group,
    art: { kind: 'read', color: b.color, ink: b.ink, spine: b.spine ?? b.title, by: b.by },
  })),
  { name: 'tank', label: sea.label, hint: sea.hint, action: 'link', value: sea.url, group: 'marola-dev', art: { kind: 'tank' } },
  ...sea.buoys.map((b, i) => ({
    name: `buoy_${b.id}`, label: b.id, hint: b.line, action: 'link', value: b.url, group: 'marola-dev',
    art: { kind: 'buoy', color: Object.values(theme.lanes)[i % 4] },
  })),
  { name: 'balloon', label: sea.balloon.label, hint: sea.balloon.hint, action: 'splash' },
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
