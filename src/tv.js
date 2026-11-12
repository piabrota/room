import * as THREE from 'three';

// The TV screen is a 2D canvas used as a texture. Each tape is a
// module that draws into that canvas:
//
//   export default {
//     mount({ ctx, width, height, audio, signature, config, tape }) {},  // tape inserted; `tape` is its entry in config.tapes
//     frame(ctx, t, dt) {},                                 // every frame
//     input({ type, x, y }) {},                             // `click` on the screen, x/y in px; or a key of the deck,
//                                                           // `rew` or `ff`, with no x/y: a step back or on (a page, a chapter)
//     stop() {},                                            // ejected, or stopped
//   }
// A tape acts only on the types it knows: a `rew` is never a click.
// The glass of a CRT, added to three's own material (onBeforeCompile), so
// the tapes still draw on a plain 2D canvas: the picture bulges a little,
// the corners darken and round off, and a fine RGB mask shows up close.
function crt(material) {
  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
      #ifdef USE_MAP
        vec2 crtUv = vMapUv * 2.0 - 1.0;
        crtUv *= 1.0 + 0.06 * dot(crtUv, crtUv);           // the bulge of the glass
        vec2 crtAt = crtUv * 0.5 + 0.5;
        vec4 sampledDiffuseColor = texture2D(map, crtAt);
        vec2 crtEdge = smoothstep(vec2(1.0), vec2(0.92), abs(crtUv)); // rounded, dark corners
        float crtMask = 0.92 + 0.08 * sin(crtAt.x * 1536.0);           // the phosphor stripes
        sampledDiffuseColor.rgb *= crtEdge.x * crtEdge.y * crtMask * (1.0 - 0.25 * dot(crtUv, crtUv) * 0.5);
        diffuseColor *= sampledDiffuseColor;
      #endif`);
  };
}

export function createTV(screenMesh, deps) {
  const W = 512, H = 384;
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  screenMesh.material = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
  crt(screenMesh.material);
  let tape = null, t = 0, frames = 0, brightness = 0.5;
  // how bright the picture is, from a 4×3 copy of it, so the TV's light in the room follows the tape
  const probe = document.createElement('canvas'); probe.width = 4; probe.height = 3;
  const pctx = probe.getContext('2d', { willReadFrequently: true });
  function measure() {
    pctx.drawImage(canvas, 0, 0, 4, 3);
    const d = pctx.getImageData(0, 0, 4, 3).data; let sum = 0;
    for (let i = 0; i < d.length; i += 4) sum += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
    brightness += (sum / 12 / 255 - brightness) * 0.5;
  }

  // no tape: a calm blue screen, no static. Its two lines are the deck's words (config.deck.words):
  // `idle` with nothing in the deck, or what `standby` was set to (a tape that waits, stopped).
  const words = deps.config?.deck?.words ?? {};
  let standby = null;
  function idle() {
    const [title, sub, third] = standby ?? words.idle ?? [];
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0d1f3c'); g.addColorStop(1, '#081428');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.globalAlpha = 1;
    ctx.fillStyle = '#cfe0ff'; ctx.font = '20px monospace'; ctx.fillText(title ?? '', 20, 36);
    ctx.fillStyle = '#7f95b8'; ctx.font = '14px monospace'; ctx.fillText(sub ?? '', 20, 60);
    if (third) ctx.fillText(third, 20, 80);
  }

  function scanlines() {
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);
  }

  return {
    get playing() { return tape; },
    get brightness() { return brightness; },
    get time() { return t; },                 // seconds since the tape started: the deck's counter
    set standby(lines) { standby = lines; },  // what the blue screen says while no tape plays
    async insert(def) {
      this.eject();
      const mod = (await def.module()).default;
      tape = { def, mod }; t = 0;
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.globalAlpha = 1; // each tape starts from a clean canvas state
      mod.mount?.({ ctx, width: W, height: H, ...deps, tape: def });
    },
    eject() { tape?.mod.stop?.(); tape = null; },
    input(uv, type = 'click') { tape?.mod.input?.({ type, x: uv.x * W, y: (1 - uv.y) * H }); },
    key(type) { tape?.mod.input?.({ type }); }, // a key of the deck: `rew`, `ff`
    update(dt) {
      t += dt;
      if (tape) tape.mod.frame?.(ctx, t, dt); else idle();
      scanlines(); tex.needsUpdate = true;
      if (tape && ++frames % 4 === 0) measure();
    },
  };
}
