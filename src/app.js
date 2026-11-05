import * as THREE from 'three';
import * as config from './config.js';
import { loadRoom } from './room.js';
import { createCameraRig } from './cameras.js';
import { createInteractions } from './interact.js';
import { createAudio } from './audio.js';
import { createTV } from './tv.js';
import { renderSignature } from './signature.js';

const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0d12);
scene.fog = new THREE.Fog(0x0b0d12, 6, 14);
const camera = new THREE.PerspectiveCamera(45, 1, 0.05, 50);
scene.add(camera);

// ── signature overlay ──
const sig = config.signature;
renderSignature(document.getElementById('signature'), sig);

const room = await loadRoom(scene, config.roomModel);
const rig = createCameraRig(camera, config.shots, room.root.userData.cameras);
const ui = createInteractions(camera, canvas, document.getElementById('tooltip'));
const audio = createAudio(camera);
const tv = createTV(room.screen, { audio, signature: sig });

// ── camera shot buttons + number keys ──
const nav = document.getElementById('shots');
rig.names.forEach((name, i) => {
  const b = document.createElement('button');
  b.textContent = `${i + 1} ${name}`; b.onclick = () => rig.go(name); b.dataset.shot = name;
  nav.appendChild(b);
});
rig.onChange((n) => nav.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b.dataset.shot === n)));
addEventListener('keydown', (e) => {
  const i = Number(e.key) - 1; if (rig.names[i]) rig.go(rig.names[i]);
  if (e.key === 'Escape') rig.go(config.startShot);
});
rig.go(config.startShot, true);

// ── tapes: hover shows label, click flies it into the VCR ──
const tweens = [];
const tween = (obj, to, dur, done) => tweens.push({ obj, from: obj.position.clone(), to, t: 0, dur, done });
for (const def of config.tapes) {
  const mesh = room.find(`tape_${def.id}`); if (!mesh) continue;
  mesh.userData.home = mesh.position.clone();
  ui.add(mesh, {
    label: def.label,
    onClick: () => {
      if (tv.playing) eject();
      audio.play(config.sfx.click);
      const slot = room.vcr.position.clone().add(new THREE.Vector3(0, 0.02, 0.22));
      tween(mesh, slot, 0.6, async () => {
        mesh.visible = false;
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
  mesh.visible = true; tween(mesh, mesh.userData.home, 0.6);
  audio.play(config.sfx.insert);
}
ui.add(room.vcr, { label: () => (tv.playing ? 'eject' : 'VCR'), onClick: eject });
ui.add(room.screen, { label: () => (tv.playing ? null : 'insert a tape'), onClick: (hit) => hit.uv && tv.input(hit.uv) });

// ── hotspots from config ──
for (const h of config.hotspots) {
  ui.add(room.find(h.name), {
    label: h.label,
    onClick: () => {
      audio.play(config.sfx.click);
      if (h.action === 'shot') rig.go(h.value);
      if (h.action === 'link') window.open(h.value, '_blank', 'noopener');
      if (h.action === 'sfx') audio.play(config.sfx[h.value]);
      if (h.action === 'toggleLamp') room.lamp.intensity = room.lamp.intensity ? 0 : 6;
    },
  });
}

// ── enter gate: needed so the browser lets us play sound ──
const soundBtn = document.getElementById('sound');
document.querySelector('#enter button').onclick = async () => {
  document.getElementById('enter').classList.add('gone');
  await audio.unlock(); soundBtn.textContent = 'sound: on';
  config.ambience.forEach((a, i) => audio.loop(a, i === 1 ? room.screen : null)); // hum comes from the TV
};
soundBtn.onclick = () => { soundBtn.textContent = `sound: ${audio.toggle() ? 'on' : 'off'}`; };

// ── loop ──
function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false); camera.aspect = w / h;
  camera.fov = w < h ? 65 : 45; camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.1);
  for (let i = tweens.length - 1; i >= 0; i--) {
    const tw = tweens[i]; tw.t = Math.min(1, tw.t + dt / tw.dur);
    const k = 1 - Math.pow(1 - tw.t, 3);
    tw.obj.position.lerpVectors(tw.from, tw.to, k); tw.obj.position.y += Math.sin(k * Math.PI) * 0.08;
    if (tw.t === 1) { tweens.splice(i, 1); tw.done?.(); }
  }
  rig.update(dt); ui.update(); tv.update(dt);
  renderer.render(scene, camera);
});
window.__room = { rig, tv, room }; // handy for debugging in the console
