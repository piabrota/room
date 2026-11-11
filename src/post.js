import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { FULL, ratios } from './quality.js';

// The post-processing chain: the room is rendered into a multisampled
// HDR buffer, corners and contacts get ambient occlusion (GTAO, the soft
// shadow where things meet), the hovered object gets an outline, bright things (the
// sign, the bulb, the TV, the bots' eyes) bloom, then tone mapping, and
// last a film grade: vignette and lens fringe (no grain: the room has no noise).
//
// It watches the frame time and steps the quality down (ambient
// occlusion first, then pixel ratio, then bloom) when the device can't keep up, so motion stays smooth.
// `quality` (src/quality.js) sets where it starts: a phone starts without occlusion, at a lower
// pixel ratio, with 2× multisampling, and has a frame budget of 1/24 s (it draws 30 a second).
export function createPost(renderer, scene, camera, { accent = '#BC2318', ao: withAO = true, quality = FULL } = {}) {
  const size = renderer.getDrawingBufferSize(new THREE.Vector2());
  const target = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: quality.samples });
  const composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));

  const ao = new GTAOPass(scene, camera, size.x, size.y);
  ao.updateGtaoMaterial({ radius: 0.3, distanceExponent: 1, thickness: 1, scale: 1, samples: 12 });
  ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 4, rings: 2, samples: 12 });
  ao.blendIntensity = 0.85;
  ao.enabled = withAO && quality.ao; // `?record` turns it off: in software it is a third of the frame; a phone never has it
  composer.addPass(ao);
  // what is shaped in its own vertex shader (the splash's water, src/splash.js) is left out of the occlusion:
  // that pass draws the room with one material of its own, and would see the unshaped mesh
  const unshaded = [], occlude = ao.render.bind(ao);
  ao.render = (...a) => { const shown = unshaded.filter((o) => o.visible); for (const o of shown) o.visible = false; occlude(...a); for (const o of shown) o.visible = true; };

  const outline = new OutlinePass(new THREE.Vector2(size.x, size.y), scene, camera);
  Object.assign(outline, { edgeStrength: 4, edgeGlow: 0.6, edgeThickness: 1.5, pulsePeriod: 2.4, enabled: false });
  outline.visibleEdgeColor.set('#ffd9a0'); outline.hiddenEdgeColor.set(accent).multiplyScalar(0.25);
  composer.addPass(outline);

  // Bloom works on the linear light, before tone mapping. At night only the
  // emissive things (the bulb, the sign, the TV, the eyes) pass 0.92. By day
  // a lit white wall is far above 1, so the threshold rises with the day
  // (setDay below), or every bright surface glows and the frame goes white.
  const BLOOM = { night: { threshold: 0.95, strength: 0.38 }, day: { threshold: 3, strength: 0.35 } };
  const bloom = new UnrealBloomPass(new THREE.Vector2(size.x / 2, size.y / 2), BLOOM.night.strength, 0.5, BLOOM.night.threshold);
  // one pixel can be thousands of times white (a lamp mirrored in the metal 2 cm from it), and the bloom
  // would spread it over the frame as a flash of one frame: what the bloom takes is capped
  bloom.materialHighPassFilter.fragmentShader = bloom.materialHighPassFilter.fragmentShader.replace(
    'gl_FragColor = mix( outputColor, texel, alpha );', 'gl_FragColor = mix( outputColor, vec4( min( texel.rgb, vec3( 6.0 ) ), texel.a ), alpha );');
  // the bloom and the outline add light, never opacity: where the canvas is clear (the live
  // window, src/live.js) it stays clear, with the glow over it
  for (const mat of [bloom.blendMaterial, outline.overlayMaterial]) Object.assign(mat, {
    blending: THREE.CustomBlending, blendSrc: THREE.SrcAlphaFactor, blendDst: THREE.OneFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
  });
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  const grade = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, time: { value: 0 }, grain: { value: 0 }, vignette: { value: 0.32 }, fringe: { value: 0.0005 } },
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `
      uniform sampler2D tDiffuse; uniform float time, grain, vignette, fringe; varying vec2 vUv;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233)) + time) * 43758.5453); }
      void main() {
        vec2 d = vUv - 0.5; float r = dot(d, d);
        vec3 c = vec3(texture2D(tDiffuse, vUv + d * fringe * 4.0).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - d * fringe * 4.0).b);
        c *= 1.0 - vignette * smoothstep(0.08, 0.5, r);
        c += (hash(vUv * 1000.0) - 0.5) * grain;
        gl_FragColor = vec4(c, texture2D(tDiffuse, vUv).a); // clear where the live window shows
      }`,
  });
  composer.addPass(grade);

  // ── adaptive quality ──
  const levels = ratios(quality);
  let level = 0, acc = 0, frames = 0, warmup = 1.5;
  const first = [];
  function setSize() {
    renderer.setPixelRatio(levels[level] ?? levels.at(-1));
    renderer.setSize(innerWidth, innerHeight, false);
    composer.setPixelRatio(renderer.getPixelRatio());
    composer.setSize(innerWidth, innerHeight);
  }
  function watch(dt) {
    if (warmup > 0) { warmup -= dt; return; } // shaders compiling, textures uploading
    acc += dt; frames++;
    if (acc < 1.2) return;
    const avg = acc / frames; acc = 0; frames = 0;
    if (avg <= quality.budget) return;
    if (ao.enabled) ao.enabled = false; // (already off under `?record`)
    else if (level < levels.length - 1) { level++; setSize(); }
    else if (bloom.enabled) bloom.enabled = false;
    else if (grade.enabled) grade.enabled = false;
    warmup = 0.5;
  }

  return {
    composer,
    profile: quality.name,
    bloom,
    setSize,
    setDay(on) { Object.assign(bloom, on ? BLOOM.day : BLOOM.night); },
    select(obj) { outline.selectedObjects = obj ? [obj] : []; outline.enabled = !!obj; },
    skipAO(obj) { unshaded.push(obj); },
    before(fn) { first.push(fn); }, // called before every frame is drawn: a picture a material needs of the room (the splash's lens)
    render(dt, t, measure = true) {
      grade.uniforms.time.value = t % 100;
      if (measure) watch(dt);
      for (const fn of first) fn();
      composer.render(dt);
    },
  };
}
