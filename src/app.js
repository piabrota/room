import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import * as config from './config.js';
import { loadRoom } from './room.js';
import { createCameraRig } from './cameras.js';
import { createInteractions } from './interact.js';
import { createAudio } from './audio.js';
import { createTV } from './tv.js';
import { createRadio } from './radio.js';
import { createPost } from './post.js';
import { renderSignature } from './signature.js';

let paused = false, wasRunning = false; // see pause() and resume() at the end
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
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
const rig = createCameraRig(camera, config.shots, room.root.userData.cameras, { canvas });
const post = createPost(renderer, scene, camera, { accent: config.theme.accent });
const ui = createInteractions(camera, canvas, document.getElementById('tooltip'), { root: room.root, onHover: (o) => post.select(o), ignoreClick: () => rig.justDragged() });
const audio = createAudio(camera);
const tv = createTV(room.screen, { audio, signature: sig, config });
const radio = createRadio(audio, config.radio);
const redrawShadows = () => { renderer.shadowMap.needsUpdate = true; };

// ── camera shot buttons, number keys, arrows and swipes ──
const nav = document.getElementById('shots');
rig.names.forEach((name, i) => {
  const b = document.createElement('button');
  const k = document.createElement('kbd'); k.textContent = String(i + 1);
  b.append(k, document.createTextNode(` ${name}`));
  b.onclick = () => rig.go(name); b.dataset.shot = name;
  nav.appendChild(b);
});
rig.onChange((n) => nav.querySelectorAll('button').forEach((b) => {
  b.classList.toggle('active', b.dataset.shot === n);
  b.setAttribute('aria-pressed', String(b.dataset.shot === n));
}));
addEventListener('keydown', (e) => {
  if (paused || e.metaKey || e.ctrlKey || e.altKey) return; // LOFI is showing, or a browser shortcut
  const i = Number(e.key) - 1; if (rig.names[i]) rig.go(rig.names[i]);
  if (e.key === 'Escape') rig.go(config.startShot);
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
      if (h.action === 'toggleLamp') { room.lamp.intensity = room.lamp.intensity ? 0 : lampOn; redrawShadows(); }
      if (h.action === 'toggleRadio') radio.toggle();
    },
  });
}

// ── enter gate: needed so the browser lets us play sound ──
const soundBtn = document.getElementById('sound');
const beds = [];
document.querySelector('#enter button').onclick = async () => {
  document.getElementById('enter').classList.add('gone');
  await audio.unlock(); soundBtn.textContent = 'sound: on';
  config.ambience.forEach(async (a, i) => { // hum comes from the TV
    const bed = await audio.loop(a, i === 1 ? room.screen : null); bed.userData = { volume: a.volume }; beds.push(bed);
    if (radio.on) bed.setVolume(a.volume * config.radio.duck);
  });
};
soundBtn.onclick = () => { soundBtn.textContent = `sound: ${audio.toggle() ? 'on' : 'off'}`; };

// ── piabrota RADIO: the button at the top and the radio on the sill ──
const radioBtn = document.getElementById('radio'), radioNext = document.getElementById('radio-next');
const dial = room.find('radio_dial');
radioBtn.onclick = () => radio.toggle();
radioNext.onclick = () => radio.next();
radio.onChange(({ on, track }) => {
  radioBtn.textContent = on ? `${config.radio.name} · ${track.title}` : `${config.radio.name}: off`;
  radioBtn.classList.toggle('active', on); radioBtn.setAttribute('aria-pressed', String(on));
  radioBtn.title = on ? `${track.title}, by ${track.artist} (CC0)` : 'lofi, free-licensed';
  radioNext.hidden = !on;
  if (dial) dial.material.emissiveIntensity = on ? 1.6 : 0;
  for (const b of beds) b.setVolume(b.userData.volume * (on ? config.radio.duck : 1));
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
  rig.update(dt); room.update(elapsed); tv.update(dt);
  ui.update(moving || tweens.length > 0 || ++frames % 3 === 0); // things on the wheel and the waves move too
  post.render(dt, elapsed, measure);
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
window.__room = { rig, tv, radio, room, renderer, camera, ui, step: (dt) => {
  if (!stepping) { stepping = true; renderer.setAnimationLoop(() => {}); } // frames keep coming, the room only moves on step
  tick(dt, false);
} };
let stepping = false;
