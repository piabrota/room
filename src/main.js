// Entry point. Two views of the same content:
//   HIFI  the 3D room (needs WebGL), loaded lazily the first time it is shown;
//   LOFI  the room as plain text (src/lofi.js).
// The LOFI/HIFI switch shows the two as buttons; the one in view is lit. `?lofi` (or the older
// `?static`) opens in LOFI, and without WebGL LOFI is the only view.
import '@fontsource/fjalla-one/latin-400.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import * as config from './config.js';
import { renderLofi } from './lofi.js';

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
const asked = params.has('lofi') || params.has('static') ? 'lofi' : params.has('hifi') ? 'hifi' : store.get();
let mode = canHifi && asked !== 'lofi' ? 'hifi' : 'lofi';
let room = null; // the HIFI app, once loaded

document.title = `${config.signature.name} · room`;
renderLofi(document.getElementById('fallback'), config);

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
    room ??= await import('./app.js');
    // The visitor may have switched back while the room was loading.
    if (mode === 'hifi') room.resume(); else room.pause();
  } else {
    room?.pause();
  }
}

show(mode, false);
