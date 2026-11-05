import * as THREE from 'three';

// Hover + click on 3D objects. Register any Object3D with a label and
// an onClick; the pointer gets a tooltip and the object glows.
export function createInteractions(camera, canvas, tooltip) {
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const targets = new Map(); // mesh -> { label, onClick, onPointer }
  let hovered = null, lastEvent = null;

  function pick(e) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects([...targets.keys()], true)[0];
    if (!hit) return null;
    let o = hit.object; while (o && !targets.has(o)) o = o.parent;
    return o ? { obj: o, hit } : null;
  }

  function glow(obj, on) {
    obj.traverse((m) => {
      if (!m.isMesh) return;
      if (!m.userData.baseMat) { m.userData.baseMat = m.material; m.material = m.material.clone(); }
      const mat = m.material, base = m.userData.baseMat;
      if (mat.emissive) mat.emissive.copy(on ? new THREE.Color(0x332a1a) : base.emissive);
      else mat.color.copy(base.color).multiplyScalar(on ? 1.35 : 1);
    });
  }

  canvas.addEventListener('pointermove', (e) => { lastEvent = e; });
  canvas.addEventListener('pointerdown', (e) => { lastEvent = e; }); // a tap shows the label too
  canvas.addEventListener('pointerleave', () => { lastEvent = null; });
  canvas.addEventListener('click', (e) => {
    const p = pick(e); if (!p) return;
    const t = targets.get(p.obj);
    t.onClick?.(p.hit);
  });

  return {
    add(obj, opts) { if (obj) targets.set(obj, opts); },
    remove(obj) { targets.delete(obj); },
    // Called every frame so hover updates even while the camera moves.
    update() {
      const p = lastEvent && pick(lastEvent);
      const next = p?.obj ?? null;
      if (next !== hovered) {
        if (hovered) glow(hovered, false);
        if (next) glow(next, true);
        hovered = next;
        canvas.style.cursor = next ? 'pointer' : '';
      }
      const label = next && targets.get(next).label;
      tooltip.classList.toggle('on', !!label);
      if (label && lastEvent) {
        tooltip.textContent = typeof label === 'function' ? label() : label;
        tooltip.style.left = lastEvent.clientX + 'px'; tooltip.style.top = lastEvent.clientY + 'px';
      }
      if (p) targets.get(next).onHover?.(p.hit);
    },
  };
}
