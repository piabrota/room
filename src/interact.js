import * as THREE from 'three';

// Hover + click on 3D objects. Register any Object3D with a label (and
// an optional hint) and an onClick; the pointer gets a label card and
// the object glows (an emissive lift, plus an outline when the post-
// processing runs).
//
// The ray tests the whole room, so a wall or a desk hides what is
// behind it. A mesh marked `userData.proxy` (an invisible hit box) only
// counts when nothing real is under the pointer.
export function createInteractions(camera, canvas, tooltip, { root, onHover = () => {}, ignoreClick = () => false } = {}) {
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const targets = new Map(); // object -> { label, hint, onClick }
  let hovered = null, lastEvent = null, dirty = false, touchUntil = 0;
  const title = document.createElement('strong'), hint = document.createElement('span');
  tooltip.replaceChildren(title, hint);

  const owner = (o) => { while (o && !targets.has(o)) o = o.parent; return o; };
  function pick(e) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(root ? [root] : [...targets.keys()], true);
    let fallback = null;
    for (const hit of hits) {
      if (!hit.object.visible) continue;
      if (hit.object.userData.proxy) { fallback ??= { obj: owner(hit.object), hit }; continue; }
      const o = owner(hit.object);
      return o ? { obj: o, hit } : fallback;
    }
    return fallback;
  }

  const lift = new THREE.Color(0x2a2418);
  function glow(obj, on) {
    obj.traverse((m) => {
      if (!m.isMesh || Array.isArray(m.material) || m.userData.proxy) return;
      if (!m.userData.baseMat) { m.userData.baseMat = m.material; m.material = m.material.clone(); }
      const mat = m.material, base = m.userData.baseMat;
      if (mat.emissive && !mat.emissiveMap) mat.emissive.copy(base.emissive).add(on ? lift : new THREE.Color(0));
      else if (!mat.emissive && !mat.map && mat.color && base.color) mat.color.copy(base.color).multiplyScalar(on ? 1.3 : 1);
    });
  }

  const moved = (e) => { lastEvent = e; dirty = true; };
  canvas.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') moved(e); });
  canvas.addEventListener('pointerdown', (e) => { moved(e); if (e.pointerType !== 'mouse') touchUntil = performance.now() + 2500; }); // a tap shows the label too
  canvas.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') { lastEvent = null; dirty = true; } });
  canvas.addEventListener('click', (e) => {
    if (ignoreClick()) return; // the end of a drag to look around
    const p = pick(e); if (!p) return;
    targets.get(p.obj).onClick?.(p.hit);
  });

  const read = (v) => (typeof v === 'function' ? v() : v);
  return {
    add(obj, opts) { if (obj) targets.set(obj, opts); },
    remove(obj) { targets.delete(obj); },
    get hovered() { return hovered; },
    // Called every frame; the ray runs again only when the pointer or the camera moved.
    update(cameraMoved) {
      if (lastEvent && lastEvent.pointerType !== 'mouse' && performance.now() > touchUntil) { lastEvent = null; dirty = true; }
      if (!dirty && !cameraMoved) return;
      dirty = false;
      const p = lastEvent && pick(lastEvent);
      const next = p?.obj ?? null;
      if (next !== hovered) {
        if (hovered) glow(hovered, false);
        if (next) glow(next, true);
        hovered = next;
        canvas.style.cursor = next ? 'pointer' : '';
        onHover(next);
      }
      const t = next && targets.get(next);
      const label = t && read(t.label);
      tooltip.classList.toggle('on', !!label);
      if (label) {
        title.textContent = label;
        hint.textContent = read(t.hint) ?? '';
        hint.hidden = !hint.textContent;
        const x = Math.min(lastEvent.clientX, innerWidth - 220);
        tooltip.style.transform = `translate(${x + 14}px, ${lastEvent.clientY + 14}px)`;
      }
    },
  };
}
