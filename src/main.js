// Entry point. Two views of the same content:
//   HIFI  the 3D room (needs WebGL), loaded lazily the first time it is shown;
//   LOFI  the room as plain text (src/lofi.js).
// The LOFI/HIFI switch shows the two as buttons; the one in view is lit. `?lofi` (or the older
// `?static`) opens in LOFI, and without WebGL LOFI is the only view.
// On `config.grid.host` (grid.piabrota.art), or with `?grid`, HIFI opens straight on the ▲ grid map
// (src/app.js), whatever view the visitor last picked; `?lofi` still wins.
import '@fontsource/fjalla-one/latin-400.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import '@fontsource/permanent-marker/latin-400.css';
import '@fontsource/monoton/latin-400.css';
import '@fontsource/press-start-2p/latin-400.css';
import '@fontsource/vt323/latin-400.css';
import '@fontsource/special-elite/latin-400.css';
import * as config from './config.js';
import { renderLofi } from './lofi.js';
import { guard } from './guard.js';
import { pick } from './quality.js';
import { firstFiles, quickFiles, warm } from './first.js';

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

const KEY = 'room:view';
const store = {
  get() { try { return localStorage.getItem(KEY); } catch { return null; } },
  set(v) { try { localStorage.setItem(KEY, v); } catch { /* private mode: the URL still says it */ } },
};

const canHifi = hasWebGL();
const params = new URLSearchParams(location.search);
const gridHome = !!config.grid && (location.hostname === config.grid.host || params.has('grid'));
const asked = params.has('lofi') || params.has('static') ? 'lofi' : params.has('hifi') || gridHome ? 'hifi' : store.get();
let mode = canHifi && asked !== 'lofi' ? 'hifi' : 'lofi';
let room = null; // the HIFI app, once loaded

document.title = gridHome ? `${config.grid.title} · ${config.signature.name}` : `${config.signature.name} · room`;
document.body.classList.toggle('grid-home', gridHome);
renderLofi(document.getElementById('fallback'), config);
guard(config.guard); // a black page for a screenshot, where a page can tell (src/guard.js)

const toggle = document.getElementById('view');
toggle.hidden = !canHifi;
toggle.querySelectorAll('[data-view]').forEach((b) => { b.onclick = () => { if (b.dataset.view !== mode) show(b.dataset.view, true); }; });

async function show(next, remember) {
  mode = next;
  document.body.classList.toggle('lofi', mode === 'lofi');
  toggle.querySelectorAll('[data-view]').forEach((b) => { b.classList.toggle('on', b.dataset.view === mode); b.setAttribute('aria-pressed', String(b.dataset.view === mode)); });
  if (remember) {
    store.set(mode);
    const url = new URL(location.href);
    ['lofi', 'static', 'hifi'].forEach((k) => url.searchParams.delete(k));
    if (mode === 'lofi') url.searchParams.set('lofi', '');
    history.replaceState(null, '', url.toString().replace('lofi=', 'lofi'));
  }
  if (mode === 'hifi') {
    // the pictures of the first frame are asked for now, while the room's code is still on its way (src/first.js)
    if (!room) { try { warm(quickFiles(), 'high'); warm(firstFiles(config, pick()), 'low'); } catch { /* the room asks for them itself */ } }
    room ??= await import('./app.js');
    // The visitor may have switched back while the room was loading.
    if (mode === 'hifi') room.resume(); else room.pause();
  } else {
    room?.pause();
  }
}

show(mode, false);
