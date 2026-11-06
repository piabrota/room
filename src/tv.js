import * as THREE from 'three';

// The TV screen is a 2D canvas used as a texture. Each tape is a
// module that draws into that canvas:
//
//   export default {
//     mount({ ctx, width, height, audio, signature, config }) {},  // tape inserted
//     frame(ctx, t, dt) {},                                 // every frame
//     input({ type, x, y }) {},                             // click on screen, x/y in px
//     stop() {},                                            // ejected
//   }
export function createTV(screenMesh, deps) {
  const W = 512, H = 384;
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  screenMesh.material = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
  let tape = null, t = 0;

  function idle(dt) {
    // no tape: a calm blue screen and the time, no static
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0d1f3c'); g.addColorStop(1, '#081428');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#cfe0ff'; ctx.font = '20px monospace'; ctx.fillText('NO SIGNAL', 20, 36);
    ctx.fillStyle = '#7f95b8'; ctx.font = '14px monospace'; ctx.fillText('insert a tape', 20, 60);
  }

  function scanlines() {
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);
  }

  return {
    get playing() { return tape; },
    async insert(def) {
      this.eject();
      const mod = (await def.module()).default;
      tape = { def, mod }; t = 0;
      mod.mount?.({ ctx, width: W, height: H, ...deps });
    },
    eject() { tape?.mod.stop?.(); tape = null; },
    input(uv, type = 'click') { tape?.mod.input?.({ type, x: uv.x * W, y: (1 - uv.y) * H }); },
    update(dt) {
      t += dt;
      if (tape) tape.mod.frame?.(ctx, t, dt); else idle(dt);
      scanlines(); tex.needsUpdate = true;
    },
  };
}
