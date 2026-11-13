// The pictures the first frame of the room shows: the photographed surfaces of the shell (floor,
// walls, wood, cloth) and the view from the window, by night or by day. They are files, so the
// room would learn of them only once its code has arrived, run and started to build; src/main.js
// asks for them (`warm`) the moment it knows the 3D room will show, while that code is still on
// its way, and the room takes the same pictures (`image`) when it gets there: one download each,
// started as early as the page allows. Nothing here needs three.js.
//
// One list, read by both: `surfaces` says which maps each surface has (src/room.js, `pbr`), and
// `firstFiles` which of them a device takes (src/quality.js, `files`).
import { asset } from './files.js';

// a photographed surface (Poly Haven, CC0; `just models`, CREDITS.md) and the maps the room uses of it
export const surfaces = {
  herringbone_parquet: ['diff', 'nor', 'rough'],     // the floor
  american_walnut_veneer: ['diff', 'nor', 'rough'],  // the desk
  beige_wall_001: ['nor', 'rough'],                  // the plaster's grain: the wall is painted one colour
  rosewood_veneer1: ['diff', 'nor', 'rough'],        // the door, the window and the skirting
  cotton_jersey: ['nor', 'rough'],                   // the weave of the curtains
};
// the files of one surface: the small device takes the colour alone, at 512 px
export const surfaceFiles = (name, small, maps = surfaces[name] ?? ['diff', 'nor', 'rough']) => Object.fromEntries(
  (small ? maps.filter((k) => k === 'diff').map((k) => [k, 'diff.lite']) : maps.map((k) => [k, k])).map(([k, file]) => [k, `/textures/pbr/${name}_${file}.jpg`]));
// the view from the window: the small file (1280 px) on a small device
export const photoFile = (photo, small) => (small ? photo.replace(/\.(jpe?g|webp)$/, '.lite.$1') : photo);

// Is it day in the room? `?day` and `?night` say so; otherwise the hour where the room is (config.place).
export function isDay(config, search = location.search) {
  const p = new URLSearchParams(search);
  if (p.has('day')) return true;
  if (p.has('night')) return false;
  const hour = Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hourCycle: 'h23', timeZone: config.place.timeZone }).format(new Date()));
  const [dawn, dusk] = config.outside?.dayHours ?? [6, 18];
  return hour >= dawn && hour < dusk;
}

// every picture of the first frame, for this device and this hour
export function firstFiles(config, quality, day = isDay(config)) {
  const small = quality.files === 'lite';
  const photo = config.outside?.[day ? 'day' : 'night']?.photo;
  return [...Object.keys(surfaces).flatMap((name) => Object.values(surfaceFiles(name, small))), ...(photo ? [photoFile(photo, small)] : [])];
}

// One <img> for each address, made the first time it is asked for. A picture that fails stays
// broken here, and whoever took it sees its `error` and does what it did before (invariant 8).
const images = new Map();
export function image(path) {
  let img = images.get(path);
  if (!img) { img = new Image(); img.src = asset(path); images.set(path, img); }
  return img;
}
export const warm = (paths) => { for (const p of paths) image(p); };
// `then(img)` once it has loaded (at once when it already has), `fail()` when it cannot
export function whenLoaded(img, then, fail = () => {}) {
  if (img.complete && img.naturalWidth > 0) { then(img); return; }
  if (img.complete && img.src) { fail(); return; } // it failed before anyone listened
  img.addEventListener('load', () => then(img), { once: true });
  img.addEventListener('error', () => fail(), { once: true });
}
