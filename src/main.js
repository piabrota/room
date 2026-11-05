// Entry point. The 3D room needs WebGL; without it the visitor still
// gets the signature and the links, as a plain page.
import { signature } from './config.js';
import { renderSignature } from './signature.js';

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

if (hasWebGL() && !new URLSearchParams(location.search).has('static')) {
  await import('./app.js');
} else {
  document.body.classList.add('static');
  renderSignature(document.getElementById('fallback'), signature);
}
