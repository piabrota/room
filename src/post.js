import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

// The post-processing chain: the room is rendered into a multisampled
// HDR buffer, corners and contacts get ambient occlusion (GTAO, the soft
// shadow where things meet), the hovered object gets an outline, bright things (the
// sign, the bulb, the TV, the bots' eyes) bloom, then tone mapping, and
// last a film grade: vignette, a little grain and lens fringe.
//
// It watches the frame time and steps the quality down (ambient
// occlusion first, then pixel ratio, then bloom) when the laptop can't keep up, so motion stays smooth.
export function createPost(renderer, scene, camera, { accent = '#BC2318' } = {}) {
  const size = renderer.getDrawingBufferSize(new THREE.Vector2());
  const target = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));

  const ao = new GTAOPass(scene, camera, size.x, size.y);
  ao.updateGtaoMaterial({ radius: 0.3, distanceExponent: 1, thickness: 1, scale: 1, samples: 12 });
  ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 4, rings: 2, samples: 12 });
  ao.blendIntensity = 0.85;
  composer.addPass(ao);

  const outline = new OutlinePass(new THREE.Vector2(size.x, size.y), scene, camera);
  Object.assign(outline, { edgeStrength: 4, edgeGlow: 0.6, edgeThickness: 1.5, pulsePeriod: 2.4, enabled: false });
  outline.visibleEdgeColor.set('#ffd9a0'); outline.hiddenEdgeColor.set(accent).multiplyScalar(0.25);
  composer.addPass(outline);

  const bloom = new UnrealBloomPass(new THREE.Vector2(size.x / 2, size.y / 2), 0.55, 0.5, 0.92);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  const grade = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, time: { value: 0 }, grain: { value: 0.035 }, vignette: { value: 0.32 }, fringe: { value: 0.0005 } },
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `
      uniform sampler2D tDiffuse; uniform float time, grain, vignette, fringe; varying vec2 vUv;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233)) + time) * 43758.5453); }
      void main() {
        vec2 d = vUv - 0.5; float r = dot(d, d);
        vec3 c = vec3(texture2D(tDiffuse, vUv + d * fringe * 4.0).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - d * fringe * 4.0).b);
        c *= 1.0 - vignette * smoothstep(0.08, 0.5, r);
        c += (hash(vUv * 1000.0) - 0.5) * grain;
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  composer.addPass(grade);

  // ── adaptive quality ──
  const levels = [Math.min(devicePixelRatio, 2), 1.5, 1.25, 1].filter((v, i, a) => v <= a[0] && a.indexOf(v) === i);
  let level = 0, acc = 0, frames = 0, warmup = 1.5;
  function setSize() {
    renderer.setPixelRatio(levels[level] ?? 1);
    renderer.setSize(innerWidth, innerHeight, false);
    composer.setPixelRatio(renderer.getPixelRatio());
    composer.setSize(innerWidth, innerHeight);
  }
  function watch(dt) {
    if (warmup > 0) { warmup -= dt; return; } // shaders compiling, textures uploading
    acc += dt; frames++;
    if (acc < 1.2) return;
    const avg = acc / frames; acc = 0; frames = 0;
    if (avg <= 1 / 48) return;
    if (ao.enabled) ao.enabled = false;
    else if (level < levels.length - 1) { level++; setSize(); }
    else if (bloom.enabled) bloom.enabled = false;
    else if (grade.enabled) grade.enabled = false;
    warmup = 0.5;
  }

  return {
    composer,
    setSize,
    select(obj) { outline.selectedObjects = obj ? [obj] : []; outline.enabled = !!obj; },
    render(dt, t, measure = true) {
      grade.uniforms.time.value = t % 100;
      if (measure) watch(dt);
      composer.render(dt);
    },
  };
}
