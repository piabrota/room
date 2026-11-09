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
import { createPlayer } from './player.js';

let paused = false, wasRunning = false; // see pause() and resume() at the end
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
// AgX rolls bright colours off gently where ACES clips them to white
// (docs/SURVEY.md, section 7). Exposure is the same by day and night: the
// day is brighter because of its light, not because of the camera.
renderer.toneMapping = THREE.AgXToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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

const room = await loadRoom(scene, config.roomModel, setProgress);
const you = buildBody(config.body); scene.add(you); // your feet, when you look down
const rig = createCameraRig(camera, config.shots, room.root.userData.cameras, { canvas });
const recording = new URLSearchParams(location.search).has('record'); // `just record`: no ambient occlusion
const post = createPost(renderer, scene, camera, { accent: config.theme.accent, ao: !recording });
const ui = createInteractions(camera, canvas, document.getElementById('tooltip'), { root: room.root, onHover: (o) => post.select(o), ignoreClick: () => rig.justDragged() });
const audio = createAudio(camera);
const tv = createTV(room.screen, { audio, signature: sig, config });
const radio = createRadio(audio, config.radio);
const redrawShadows = () => { renderer.shadowMap.needsUpdate = true; };

// ── camera shot buttons, number keys, arrows and swipes ──
const nav = document.getElementById('shots');
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
}));
addEventListener('keydown', (e) => {
  if (paused || e.metaKey || e.ctrlKey || e.altKey) return; // LOFI is showing, or a browser shortcut
  const i = e.key === '0' ? 9 : Number(e.key) - 1; if (rig.names[i]) rig.go(rig.names[i]); // 1..9, and 0 for the tenth
  if (e.key === 'Escape') { player?.close(); rig.go(config.startShot); }
  if (e.key === 'ArrowRight') rig.next(1);
  if (e.key === 'ArrowLeft') rig.next(-1);
});
rig.go(config.startShot, true);

// ── tapes: hover shows label, click flies it into the VCR ──
const S = (t) => t * t * t * (t * (t * 6 - 15) + 10);
const tweens = [];
const tween = (obj, to, dur, done) => tweens.push({ obj, from: obj.position.clone(), to, t: 0, dur, done });
for (const def of config.tapes) {
  const mesh = room.find(`tape_${def.id}`); if (!mesh) continue;
  mesh.userData.home = mesh.position.clone();
  ui.add(mesh, {
    label: def.label, hint: def.text,
    onClick: () => {
      if (tv.playing) eject();
      audio.play(config.sfx.click);
      const slot = room.vcr.position.clone().add(new THREE.Vector3(0, 0.02, 0.2));
      tween(mesh, slot, 0.7, async () => {
        mesh.visible = false; redrawShadows();
        audio.play(config.sfx.insert);
        await tv.insert(def);
        room.tvLight.color.set(def.color); room.tvLight.intensity = 3;
      });
      rig.go('desk');
    },
  });
}
function eject() {
  const def = tv.playing?.def; if (!def) return;
  tv.eject(); room.tvLight.intensity = 0;
  const mesh = room.find(`tape_${def.id}`);
  mesh.visible = true; tween(mesh, mesh.userData.home, 0.7, redrawShadows);
  audio.play(config.sfx.eject ?? config.sfx.insert);
}
ui.add(room.vcr, { label: () => (tv.playing ? 'eject' : 'VCR'), hint: () => (tv.playing ? tv.playing.def.label : 'pick a tape beside it'), onClick: eject });
ui.add(room.screen, { label: () => (tv.playing ? null : 'insert a tape'), onClick: (hit) => hit.uv && tv.input(hit.uv) });

// ── hotspots from config ──
const lampOn = room.lamp.intensity;
for (const h of config.hotspots) {
  ui.add(room.find(h.name), {
    label: h.label, hint: h.hint,
    onClick: () => {
      audio.play(config.sfx.click);
      if (h.action === 'shot') rig.go(h.value);
      if (h.action === 'link') window.open(h.value, '_blank', 'noopener');
      if (h.action === 'sfx') audio.play(config.sfx[h.value]);
      if (h.action === 'toggleLamp') { room.lamp.intensity = room.lamp.intensity ? 0 : (room.lamp.userData.full ?? lampOn); redrawShadows(); }
      if (h.action === 'toggleRadio') radioBtn.click();
      if (h.action === 'playlist') player.open();
    },
  });
}

// ── enter gate: needed so the browser lets us play sound ──
// Nothing plays on its own: the rain and the radio wait for their buttons.
const words = config.ui;
const soundBtn = document.getElementById('sound');
soundBtn.textContent = `${words.sound}: ${words.off}`;
document.querySelector('#enter button').onclick = async () => {
  document.getElementById('enter').classList.add('gone');
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
// the owner's playlist: Spotify's Embed player over the room, made on the
// click and removed on close (AGENTS.md, invariants 1 and 7)
const playlistBtn = document.getElementById('playlist');
const player = createPlayer(document.getElementById('player'), config.playlist, {
  onOpen: () => { if (radio.on) radio.toggle(); playlistBtn.classList.add('active'); playlistBtn.setAttribute('aria-pressed', 'true'); },
  onClose: () => { playlistBtn.classList.remove('active'); playlistBtn.setAttribute('aria-pressed', 'false'); },
});
if (config.playlist?.embed) {
  playlistBtn.textContent = config.playlist.button; playlistBtn.title = config.playlist.hint; playlistBtn.hidden = false;
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

// ── loop ──
const clock = new THREE.Clock();
let elapsed = 0, frames = 0;
function frame() {
  tick(Math.min(clock.getDelta(), 1 / 30), true); // a long stall never turns into a jump
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
  const moving = rig.moving;
  rig.update(dt); you.follow(camera); room.update(elapsed); tv.update(dt);
  if (tv.playing && room.tvLight.intensity) room.tvLight.intensity = 0.8 + 4.5 * tv.brightness; // the room flickers with the picture
  ui.update(moving || tweens.length > 0 || ++frames % 3 === 0); // things on the wheel and the waves move too
  if (gridView) {
    if (gridPending && !rig.moving) { gridPending = false; gridView.show(); }
    gridView.update(dt);
  }
  if (!gridView?.covering) post.render(dt, elapsed, measure); // under the open map the room rests
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
window.__room = { rig, tv, radio, room, renderer, camera, ui, post, scene, setDay, grid: gridView, step: (dt) => {
  if (!stepping) { stepping = true; renderer.setAnimationLoop(() => {}); } // frames keep coming, the room only moves on step
  tick(dt, false);
} };
let stepping = false;
