import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import * as config from './config.js';
import { loadRoom, buildBody } from './room.js';
import { createCameraRig } from './cameras.js';
import { createInteractions } from './interact.js';
import { createAudio } from './audio.js';
import { createTV } from './tv.js';
import { createRadio } from './radio.js';
import { createPost } from './post.js';
import { renderSignature } from './signature.js';
import { createGrid } from './grid.js';
import { createPlayer, equalizer } from './player.js';
import { createLive } from './live.js';
import { pick } from './quality.js';
import { createLock } from './lock.js';
import { createCat } from './cat.js';
import { buildNav } from './catnav.js';
import { createCredits } from './creditscard.js';

let paused = false, wasRunning = false; // see pause() and resume() at the end
let elapsed = 0; // the room's clock, in seconds: the loop at the end moves it
const canvas = document.getElementById('scene');
// A phone or a weak machine gets the lite look: fewer pixels, frames and passes (src/quality.js).
const quality = pick();
document.body.dataset.quality = quality.name;
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, // alpha: the live window shows through (src/live.js)
  powerPreference: quality.fps ? 'default' : 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, quality.ratios[0]));
renderer.outputColorSpace = THREE.SRGBColorSpace;
// AgX rolls bright colours off gently where ACES clips them to white
// (docs/SURVEY.md, section 7). Exposure is the same by day and night: the
// day is brighter because of its light, not because of the camera.
renderer.toneMapping = THREE.AgXToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = quality.softShadows ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
renderer.shadowMap.autoUpdate = false; // the room is still: shadows are drawn again only when something moves

const scene = new THREE.Scene();
scene.background = new THREE.Color(config.theme.bg);
scene.fog = new THREE.Fog(config.theme.bg, 7, 15);
// soft reflections for the metal and the plastic, from a generated studio
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.18;
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.05, 50);
scene.add(camera);

// ── signature overlay and loading ──
const sig = config.signature;
renderSignature(document.getElementById('signature'), sig);
const loading = document.getElementById('loading');
const setProgress = (p) => loading?.style.setProperty('--p', String(p));

const room = await loadRoom(scene, config.roomModel, setProgress, quality);
const you = buildBody(config.body); scene.add(you); // your feet, when you look down
const rig = createCameraRig(camera, config.shots, room.root.userData.cameras, { canvas });
const recording = new URLSearchParams(location.search).has('record'); // `just record`: no ambient occlusion
const post = createPost(renderer, scene, camera, { accent: config.theme.accent, ao: !recording, quality });
const ui = createInteractions(camera, canvas, document.getElementById('tooltip'), { root: room.root, onHover: (o) => post.select(o), ignoreClick: () => rig.justDragged() });
const audio = createAudio(camera);
const tv = createTV(room.screen, { audio, signature: sig, config });
const radio = createRadio(audio, config.radio);
const redrawShadows = () => { renderer.shadowMap.needsUpdate = true; };

// ── camera shot buttons, number keys, arrows and swipes ──
const nav = document.getElementById('shots');
// the credits: the button at the end of the shots' row and its card; the plate on the wall opens it too
const credits = createCredits(document.getElementById('credits'), document.getElementById('credits-card'), config.credits);
if (config.credits) nav.dataset.reserve = config.credits.button; // the row keeps the button's place free (src/style.css)
rig.names.forEach((name, i) => {
  const b = document.createElement('button');
  const k = document.createElement('kbd'); k.textContent = String((i + 1) % 10); // the tenth is 0
  b.append(k, document.createTextNode(` ${config.shots[name]?.label ?? name}`));
  b.onclick = () => rig.go(name); b.dataset.shot = name;
  nav.appendChild(b);
});
// ── ▲ grid: when the camera lands on the chart (key 0), the map opens; any other shot closes it ──
const gridView = config.grid ? createGrid(config.grid, { still: matchMedia('(prefers-reduced-motion: reduce)').matches }) : null;
let gridPending = false;
gridView?.onBack(() => rig.go(config.startShot));
rig.onChange((n) => { gridPending = n === 'grid'; if (n !== 'grid') gridView?.hide(); });
rig.onChange((n) => nav.querySelectorAll('button').forEach((b) => {
  b.classList.toggle('active', b.dataset.shot === n);
  b.setAttribute('aria-pressed', String(b.dataset.shot === n));
  // on a phone the shots are one row that scrolls: the one in view comes to the middle of it
  if (b.dataset.shot === n && nav.scrollWidth > nav.clientWidth) nav.scrollTo({ left: b.offsetLeft - (nav.clientWidth - b.offsetWidth) / 2, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}));
addEventListener('keydown', (e) => {
  if (paused || e.metaKey || e.ctrlKey || e.altKey) return; // LOFI is showing, or a browser shortcut
  if (e.target instanceof HTMLInputElement) return; // typing in a form (the door's email) never moves the camera
  const i = e.key === '0' ? 9 : Number(e.key) - 1; if (rig.names[i]) rig.go(rig.names[i]); // 1..9, and 0 for the tenth
  if (e.key === 'Escape') { player?.close(); lock?.close(); credits.close(); rig.go(config.startShot); }
  if (e.key === 'ArrowRight') rig.next(1);
  if (e.key === 'ArrowLeft') rig.next(-1);
});
// on the grid's own name the first shot is the map; the room waits behind it (src/main.js)
const gridHome = !!gridView && document.body.classList.contains('grid-home');
rig.go(gridHome ? 'grid' : config.startShot, true);

// ── tapes: a hover slides one out of its pile and says what it is, a click flies it into the VCR ──
const S = (t) => t * t * t * (t * (t * 6 - 15) + 10);
const tweens = [];
const tween = (obj, to, dur, done) => tweens.push({ obj, from: obj.position.clone(), to, t: 0, dur, done });
// The placeholder room's tapes know the way themselves (src/vhs.js: the cassette leaves its sleeve,
// which stays in the pile, and goes in by the VCR's slot); a tape of a room.glb is a plain mesh, and flies.
// The deck (config.deck): its six keys work, by a click on them or by their letter on the keyboard, and
// its display shows what it does, the tape's name and a counter. A tape in the deck is `loading` (on its
// way in), `playing`, or `stopped` (in the deck, the screen blue; PLAY starts it again).
const deckWords = config.deck?.words ?? {}, deckKeys = config.deck?.keys ?? [], modes = deckWords.modes ?? {};
const accounts = config.catalogue?.accounts ?? {};
const tapeMeshes = new Map();
let inDeck = null;   // { def, mesh, state }: the tape in the VCR, or on its way there
let lastTape = null; // the last one that went in: PLAY on an empty deck takes the one after it
let flash = null;    // { mode, until }: what the display says for a moment (REW, FF, NO REC, EJECT)
const nameOf = (def) => def.label;
const mmss = (s) => `${String(Math.floor(s / 60) % 100).padStart(2, '0')}:${String(Math.floor(s) % 60).padStart(2, '0')}`;
let deckShown = null;
function showDeck() { // the display, from what the deck is doing now; drawn again only when it changes
  const show = room.vcr?.userData.show; if (!show) return;
  if (flash && elapsed >= flash.until) flash = null;
  const state = inDeck?.state, s = Math.floor(state === 'playing' ? tv.time : inDeck?.at ?? 0);
  const mode = flash?.mode ?? (inDeck ? modes[state === 'playing' ? 'play' : state === 'stopped' ? 'stop' : 'load'] : null);
  const name = inDeck ? nameOf(inDeck.def) : flash?.name ?? '', now = mode ? `${mode}|${name}|${s}` : '';
  if (now === deckShown) return; deckShown = now;
  show(mode ? { mode, name, digits: inDeck ? mmss(s) : config.deck.clock } : null);
}
const say = (mode, name) => { flash = { mode: modes[mode], name, until: elapsed + 0.9 }; };
async function start(def) { // the tape is in: it plays
  await tv.insert(def);
  if (inDeck?.def !== def || inDeck.state === 'stopped') { if (tv.playing?.def === def) tv.eject(); return; }
  inDeck.state = 'playing'; tv.standby = null;
  room.tvLight.color.set(def.color); room.tvLight.intensity = 3;
}
function load(def) {
  const mesh = tapeMeshes.get(def); if (!mesh) return;
  eject();
  audio.play(config.sfx.click);
  inDeck = { def, mesh, state: 'loading' }; lastTape = def; flash = null;
  const arrived = () => {
    if (inDeck?.def !== def) return; // called back before it got there
    mesh.visible = !!mesh.userData.load; redrawShadows();
    audio.play(config.sfx.insert);
    start(def);
  };
  if (mesh.userData.load) mesh.userData.load(room.vcr, arrived);
  else tween(mesh, room.vcr.position.clone().add(new THREE.Vector3(0, 0.02, 0.2)), 0.7, arrived);
  rig.go('desk');
}
function eject() {
  const cur = inDeck; if (!cur) return; inDeck = null;
  tv.eject(); tv.standby = null; room.tvLight.intensity = 0;
  if (cur.mesh.userData.unload) cur.mesh.userData.unload(redrawShadows);
  else { cur.mesh.visible = true; tween(cur.mesh, cur.mesh.userData.home, 0.7, redrawShadows); }
  redrawShadows();
  say('eject', nameOf(cur.def));
  audio.play(config.sfx.eject ?? config.sfx.insert);
}
// One key of the deck, by its id. Each does one thing, and the display says it.
function pressKey(id) {
  const i = deckKeys.findIndex((k) => k.id === id); if (i < 0) return;
  room.vcr?.userData.press?.(i);
  if (id === 'eject') { if (inDeck) eject(); else audio.play(config.sfx.click); return; }
  audio.play(config.sfx.click);
  if (id === 'play') {
    if (!inDeck) { const all = config.tapes.filter((t) => tapeMeshes.has(t)); if (all.length) load(all[(all.indexOf(lastTape) + 1) % all.length]); }
    else if (inDeck.state === 'stopped') { inDeck.state = 'loading'; start(inDeck.def); }
  } else if (id === 'stop') {
    if (inDeck?.state === 'playing') { inDeck.at = tv.time; inDeck.state = 'stopped'; tv.eject(); tv.standby = [...(deckWords.stopped ?? []), inDeck.def.label]; room.tvLight.intensity = 0; }
  } else if (id === 'rew' || id === 'ff') {
    if (inDeck?.state === 'playing') tv.key(id); // a step back or on, for the tape to take as it knows (src/tv.js)
    say(id);
  } else say(id); // `rec`: this deck only plays
}
for (const def of config.tapes) {
  const mesh = room.find(`tape_${def.id}`); if (!mesh) continue;
  mesh.userData.home = mesh.position.clone(); tapeMeshes.set(def, mesh);
  const account = accounts[def.account]?.name;
  ui.add(mesh, {
    label: def.label,
    hint: () => (inDeck?.def === def ? (inDeck.state === 'loading' ? deckWords.loading : deckWords.inDeck) : account && deckWords.tape ? deckWords.tape(account, def.text) : def.text),
    onHover: (on) => mesh.userData.hover?.(on),
    onClick: () => {
      if (inDeck?.def === def) { if (inDeck.state !== 'loading') eject(); return; } // its empty sleeve: the tape comes back
      load(def);
    },
  });
}
const pile = room.find('tapes'); if (pile) pile.userData.onSettle = redrawShadows;
// the VCR: a key under the pointer says what it does and does it; anywhere else on it, a click ejects
const keyUnder = (hit) => (hit?.point ? deckKeys[room.vcr.userData.keyAt?.(hit.point) ?? -1] : null);
ui.add(room.vcr, {
  label: (hit) => keyUnder(hit)?.label ?? (inDeck ? deckWords.slot : deckWords.vcr),
  hint: (hit) => { const k = keyUnder(hit); return k ? [k.hint, k.key && deckWords.key?.(k.key)].filter(Boolean).join(' · ') : inDeck ? inDeck.def.label : deckWords.empty; },
  onClick: (hit) => { const k = keyUnder(hit); if (k) pressKey(k.id); else eject(); },
});
ui.add(room.screen, {
  label: () => (tv.playing ? tv.playing.def.label : inDeck ? null : deckWords.screen),
  hint: () => (tv.playing ? tv.playing.def.hint ?? deckWords.screenHint : null),
  onClick: (hit) => hit?.uv && tv.input(hit.uv),
});
addEventListener('keydown', (e) => { // the deck's keys, on the keyboard
  if (paused || e.metaKey || e.ctrlKey || e.altKey || e.repeat || e.target instanceof HTMLInputElement || gridView?.covering) return;
  const k = deckKeys.find((d) => d.key && d.key === e.key.toLowerCase()); if (k) pressKey(k.id);
});

// ── Nash, the black cat: he lives in the room's tree, so the pointer finds him (src/cat.js) ──
// On the full look he reads the room first, to walk around things and leap clear of them (src/catnav.js);
// on the lite look (phones) he keeps the cheap life, with nothing to compute.
// The furniture that is files (src/furniture.js). The room opens at once with the stand-ins, on
// every look, and each piece takes its place as it arrives: nothing the visitor waits for is a
// photographed chair. A piece that comes late, or never, leaves its stand-in (invariant 8).
// `just record` (`?record`) still waits for all of it, so it films the same furnished room.
room.onChange = () => redrawShadows();
if (recording) { room.furnish(); await room.ready; }
room.root.updateMatrixWorld(true);
const catStill = matchMedia('(prefers-reduced-motion: reduce)').matches;
const smartCat = quality.name === 'full' && !catStill;
const makeCat = (nav) => createCat(config.cat, { still: catStill, nav });
let nash = config.cat ? makeCat(recording && smartCat ? buildNav(room.root, { radius: 0.2 }) : null) : null;
if (nash) room.root.add(nash.group);
// On the full look Nash first lives the cheap life; once the real furniture is in, he reads the
// room (src/catnav.js) while the browser is idle, and starts walking around it from his home perch.
if (nash && smartCat && !recording) {
  room.ready.then(() => new Promise((done) => (self.requestIdleCallback ?? setTimeout)(done, { timeout: 4000 }))).then(() => {
    room.root.updateMatrixWorld(true);
    const next = makeCat(buildNav(room.root, { radius: 0.2 }));
    room.root.remove(nash.group); room.root.add(next.group); ui.move(nash.group, next.group);
    nash = next; window.__room.nash = next;
  });
}

// ── the door's lock: the keypad over the room; the right code swings the door open ──
const doorState = { k: 0, to: 0 };
const DOOR_KEY = 'room:door';
const lock = createLock(document.getElementById('lock'), config.door?.lock, {
  gate: config.door?.gate,
  onPress: () => audio.play(config.sfx.click),
  onSolve: () => { openDoor(true); try { localStorage.setItem(DOOR_KEY, 'open'); } catch { /* private mode: open for this visit */ } },
});
function openDoor(on) { doorState.to = on ? 1 : 0; audio.play(config.sfx.insert); }
try { if (new URLSearchParams(location.search).has('locked')) localStorage.removeItem(DOOR_KEY); else if (localStorage.getItem(DOOR_KEY) === 'open') { doorState.k = doorState.to = 1; room.setDoor?.(1); } } catch { /* no storage: the door starts shut */ }
const doorOpen = () => doorState.to === 1;

// ── the water balloon over the aquarium (src/splash.js): its snap, its splash, and Nash looks ──
const splash = room.root.userData.splash;
if (splash) {
  splash.onPop = () => audio.play(config.sfx.pop, 0.7);
  splash.onImpact = (at) => { audio.play(config.sfx.splash, 0.8); nash?.call(at); };
  post.before(() => splash.grab(renderer, scene, camera)); // the room without the splash, for the water to bend
  for (const o of splash.shaped) post.skipAO(o);
}

// ── hotspots from config ──
const lampOn = room.lamp.intensity;
for (const h of config.hotspots) {
  const isDoor = h.action === 'door';
  ui.add(room.find(h.name), {
    label: isDoor ? () => (doorOpen() ? config.door.openLabel : h.label) : h.label,
    hint: isDoor ? () => (doorOpen() ? config.door.openHint : h.hint) : h.hint,
    onClick: (hit) => {
      audio.play(config.sfx.click);
      if (h.action === 'shot') rig.go(h.value);
      if (h.action === 'link') window.open(h.value, '_blank', 'noopener');
      if (h.action === 'sfx') audio.play(config.sfx[h.value]);
      if (h.action === 'toggleLamp') { room.lamp.intensity = room.lamp.intensity ? 0 : (room.lamp.userData.full ?? lampOn); redrawShadows(); }
      if (h.action === 'toggleRadio') radioBtn.click();
      if (h.action === 'playlist') player.open();
      if (h.action === 'credits') credits.open();
      if (h.action === 'cat') { audio.play(config.sfx.meow); nash?.call(camera.position); }
      if (h.action === 'splash') splash?.burst(hit?.point);
      if (h.action === 'door') { if (doorOpen()) { openDoor(false); try { localStorage.removeItem(DOOR_KEY); } catch { /* fine */ } } else lock.open(); }
    },
  });
}

// ── the universe simulator (src/simulator.js): a click tunes its next world, and its card names the one in the port ──
const simulator = room.root.userData.simulator;
if (simulator) for (const h of config.hotspots.filter((x) => x.action === 'simulate')) {
  ui.add(room.find(h.name), {
    label: simulator.label, hint: simulator.hint,
    onClick: () => { audio.play(config.sfx.click); audio.play(config.sfx[config.simulator.sfx], 0.5); simulator.next(); },
  });
}

// ── enter gate: needed so the browser lets us play sound ──
// Nothing plays on its own: the rain and the radio wait for their buttons.
const words = config.ui;
const soundBtn = document.getElementById('sound');
soundBtn.textContent = `${words.sound}: ${words.off}`;
const gate = document.getElementById('enter');
// the hint under the gate's button: keys for a keyboard, gestures for a finger
const hintEl = gate.querySelector('p');
if (hintEl && words.enterHint) hintEl.textContent = matchMedia('(pointer: coarse)').matches && words.enterHintTouch ? words.enterHintTouch : words.enterHint;
// The map needs no sound, so on the grid's own name the gate waits until the visitor first steps
// into the room; nothing plays before its click either way (invariant 7).
if (gridHome) {
  gate.classList.add('gone');
  rig.onChange((n) => { if (n !== 'grid' && !audio.enabled) gate.classList.remove('gone'); });
}
document.querySelector('#enter button').onclick = async () => {
  gate.classList.add('gone');
  await audio.unlock(); soundBtn.textContent = `${words.sound}: ${words.on}`;
};
soundBtn.onclick = () => { const on = audio.toggle(); soundBtn.textContent = `${words.sound}: ${on ? words.on : words.off}`; if (!on) player.close(); };

// ── the rain on the window: on and off ──
const rainDef = config.ambience.find((a) => a.id === 'rain');
const rainBtn = document.getElementById('rain');
let rain = null, rainOn = false;
const rainVolume = () => rainDef.volume * (radio.on ? config.radio.duck : 1);
rainBtn.hidden = !rainDef; if (rainDef) rainBtn.textContent = `${rainDef.label}: ${words.off}`;
rainBtn.onclick = async () => {
  rainOn = !rainOn;
  rainBtn.textContent = `${rainDef.label}: ${rainOn ? words.on : words.off}`;
  rainBtn.classList.toggle('active', rainOn); rainBtn.setAttribute('aria-pressed', String(rainOn));
  if (rainOn && audio.ctx.state !== 'running') { await audio.unlock(); soundBtn.textContent = `${words.sound}: ${words.on}`; }
  room.setRain(rainOn);
  if (rainOn) { rain ??= await audio.loop(rainDef, room.root.getObjectByName('window')); if (!rain.isPlaying) rain.play(); rain.setVolume(rainVolume()); }
  else rain?.stop();
};

// ── Copacabana live behind the window (src/live.js; config.outside.live) ──
const liveDef = config.outside?.live, liveBtn = document.getElementById('window-live'), liveCredit = document.getElementById('live-credit');
const glass = room.root.getObjectByName('window');
const live = createLive(document.getElementById('live'), glass && liveDef, {
  scene, camera, center: glass?.getWorldPosition(new THREE.Vector3()),
  onChange: (on) => {
    liveBtn.textContent = on ? liveDef.button.on : liveDef.button.off;
    liveBtn.classList.toggle('active', on); liveBtn.setAttribute('aria-pressed', String(on));
    liveCredit.hidden = !on;
  },
});
if (glass && liveDef?.embed) {
  liveBtn.textContent = liveDef.button.off; liveBtn.title = liveDef.hint; liveBtn.hidden = false;
  liveCredit.textContent = liveDef.credit; liveCredit.href = liveDef.url;
  liveBtn.onclick = () => live.toggle();
}

// ── day and night ──
const dayBtn = document.getElementById('daylight');
function setDay(on) {
  room.setDay(on); post.setDay(on); redrawShadows();
  dayBtn.textContent = on ? words.day : words.night;
  dayBtn.setAttribute('aria-pressed', String(on));
  dayBtn.title = on ? words.toNight : words.toDay;
}
dayBtn.onclick = () => setDay(!room.day);
const hour = Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hourCycle: 'h23', timeZone: config.place.timeZone }).format(new Date()));
const [dawn, dusk] = config.outside?.dayHours ?? [6, 18];
setDay(new URLSearchParams(location.search).has('day') || (!new URLSearchParams(location.search).has('night') && hour >= dawn && hour < dusk));

// ── piabrota RADIO: the button at the top and the radio on the sill ──
const radioBtn = document.getElementById('radio'), radioNext = document.getElementById('radio-next');
const radioMore = document.getElementById('radio-more'), listenersEl = document.getElementById('listeners');
const stationsEl = document.getElementById('stations');
const dial = room.find('radio_dial');
radioBtn.onclick = async () => { if (audio.ctx.state !== 'running') { await audio.unlock(); soundBtn.textContent = `${words.sound}: ${words.on}`; } radio.toggle(); };
radioNext.onclick = () => radio.next();
for (const st of radio.stations) {
  const b = document.createElement('button'); b.textContent = st.label; b.dataset.station = st.id;
  b.onclick = () => radio.tune(st.id); stationsEl.append(b);
}
if (radio.stations.length < 2) stationsEl.style.display = 'none'; // one station: nothing to choose
// the owner's playlist: Spotify's Embed player over the room, made on the
// click and removed on close (AGENTS.md, invariants 1 and 7)
const playlistBtn = document.getElementById('playlist');
const player = createPlayer(document.getElementById('player'), config.playlist, {
  onOpen: () => { if (radio.on) radio.toggle(); playlistBtn.classList.add('active'); playlistBtn.setAttribute('aria-pressed', 'true'); },
  onClose: () => { playlistBtn.classList.remove('active'); playlistBtn.setAttribute('aria-pressed', 'false'); },
  // while Spotify plays, the ♫ button's bars dance and the mixtape's reels turn
  onPlayback: (on) => { playlistBtn.classList.toggle('playing', on); const m = room.root.getObjectByName('mixtape'); if (m) m.userData.playing = on; },
});
if (config.playlist?.embed) {
  playlistBtn.textContent = config.playlist.button; playlistBtn.append(equalizer()); playlistBtn.title = config.playlist.hint; playlistBtn.hidden = false;
  playlistBtn.setAttribute('aria-pressed', 'false');
  playlistBtn.onclick = () => player.toggle();
}
radio.onChange(({ on, station, track, listeners }) => {
  radioBtn.textContent = on ? `${config.radio.name} · ${track.title}` : `${config.radio.name}: ${words.off}`;
  radioBtn.classList.toggle('active', on); radioBtn.setAttribute('aria-pressed', String(on));
  radioBtn.title = on ? words.by(track.title, track.artist) : words.radioHint;
  radioNext.hidden = !on; radioMore.hidden = !on;
  stationsEl.querySelectorAll('button').forEach((b) => { b.classList.toggle('active', b.dataset.station === station.id); b.setAttribute('aria-pressed', String(b.dataset.station === station.id)); });
  listenersEl.hidden = listeners == null;
  if (listeners != null) listenersEl.textContent = words.listening(listeners);
  if (dial) dial.material.emissiveIntensity = on ? 1.6 : 0;
  rain?.setVolume(rainVolume());
});

// ── size ──
function resize() {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  rig.setPortrait(innerWidth < innerHeight);
  post.setSize();
}
addEventListener('resize', resize); resize();

// Compile every shader and upload every texture before the first frame,
// so the first move to a new shot never stalls.
scene.traverse((o) => {
  for (const m of [o.material].flat()) for (const k of ['map', 'emissiveMap']) if (m?.[k]) renderer.initTexture(m[k]);
});
rig.update(0);
await renderer.compileAsync(scene, camera).catch(() => renderer.compile(scene, camera));
redrawShadows();
loading?.classList.add('done');
room.furnish(); // the furniture's files, now that the room is on screen (src/furniture.js)
performance.mark('room:shown'); // `just mobile` counts the bytes before it
dispatchEvent(new Event('room:shown')); // the chart's mesh waits for it (src/grid.js)

// ── loop ──
const clock = new THREE.Clock();
let frames = 0, since = 0;
const minDt = quality.fps ? 1 / quality.fps - 0.004 : 0; // a little early, so a 60 Hz screen gives every other frame
function frame() {
  since += clock.getDelta();
  if (since < minDt) return; // lite: at most `quality.fps` frames a second
  tick(Math.min(since, 1 / 20), true); since = 0; // a long stall never turns into a jump
}
// One step of the room. `measure` lets the adaptive quality watch the
// frame time; `just record` steps with a fixed dt and turns it off.
function tick(dt, measure) {
  elapsed += dt;
  for (let i = tweens.length - 1; i >= 0; i--) {
    const tw = tweens[i]; tw.t = Math.min(1, tw.t + dt / tw.dur);
    const k = S(tw.t);
    tw.obj.position.lerpVectors(tw.from, tw.to, k); tw.obj.position.y += Math.sin(k * Math.PI) * 0.1;
    tw.obj.rotation.x = Math.sin(k * Math.PI) * -0.4;
    if (tw.t === 1) { tweens.splice(i, 1); tw.done?.(); }
  }
  if (doorState.k !== doorState.to) { // the door swings in a second, eased
    doorState.k = doorState.to > doorState.k ? Math.min(1, doorState.k + dt) : Math.max(0, doorState.k - dt);
    room.setDoor?.(S(doorState.k)); if (doorState.k === doorState.to) redrawShadows();
  }
  const moving = rig.moving;
  rig.update(dt); you.follow(camera); showDeck(); room.update(elapsed); tv.update(dt); nash?.update(dt);
  if (tv.playing && room.tvLight.intensity) room.tvLight.intensity = 0.8 + 4.5 * tv.brightness; // the room flickers with the picture
  ui.update(moving || tweens.length > 0 || ++frames % 3 === 0); // things on the wheel and the waves move too
  if (gridView) {
    if (gridPending && !rig.moving) { gridPending = false; gridView.show(); }
    gridView.update(dt);
  }
  if (!gridView?.covering) { live.update(); post.render(dt, elapsed, measure); } // under the open map the room rests
}
renderer.setAnimationLoop(frame);

// ── LOFI/HIFI: main.js pauses the room while the text view shows ──
// Pausing stops the render loop and suspends the audio context, which
// holds the ambience and the tape bus too, so LOFI is silent.
export function pause() {
  if (paused) return;
  paused = true; renderer.setAnimationLoop(null);
  wasRunning = audio.ctx.state === 'running';
  if (wasRunning) audio.ctx.suspend();
  radio.pause();
}
export function resume() {
  if (!paused) return;
  paused = false; clock.getDelta(); resize(); renderer.setAnimationLoop(frame);
  if (wasRunning) audio.ctx.resume();
  radio.resume();
}
// handy for debugging in the console; `step` drives the room by hand for `just record`
window.__room = { config, rig, tv, radio, room, renderer, camera, ui, post, scene, setDay, lock, quality, nash, grid: gridView, deck: { press: pressKey, get tape() { return inDeck; } }, step: (dt) => {
  if (!stepping) { stepping = true; renderer.setAnimationLoop(() => {}); } // frames keep coming, the room only moves on step
  tick(dt, false);
} };
let stepping = false;
