// The files of public/, as the build saw them (vite.config.js, `__ROOM_FILES__`): each with the
// first 8 hex digits of its SHA-256. The room asks for a file by `asset(path)`, an address that
// changes when the file does (`/models/sofa.glb?v=1a2b3c4d`), so the host can let a browser keep
// it for good and a second visit downloads nothing; and it never asks for a file the build did
// not find (`missing`): a sound still to be recorded goes straight to its fallback, and the
// placeholder room is built without a question to the host (invariant 8).
// In development, and in Node (`just check`), there is no list: every path is asked for as it is.
let FILES = null;
try { FILES = __ROOM_FILES__ ?? null; } catch { /* no build: plain paths */ } // eslint-disable-line no-undef

export const asset = (path) => (FILES?.[path] ? `${path}?v=${FILES[path]}` : path);
export const missing = (path) => !!FILES && typeof path === 'string' && path.startsWith('/') && !(path in FILES);
