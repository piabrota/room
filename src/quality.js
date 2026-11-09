// How much the room asks of the device. A phone has a screen of three device pixels to the CSS
// pixel, a small GPU that shares its power with the radio, and a battery; drawn like a laptop's,
// the room makes it hot and slow. So a phone, a tablet or a weak machine gets the `lite` look:
//
//   pixels    drawn at 1.25 device pixels to the CSS pixel at most (the laptop: 2), and stepped
//             down to 0.75 when frames run long, the browser scaling the picture up;
//   frames    at most 30 a second: the room moves slowly, and half the frames is half the heat;
//   passes    no ambient occlusion, 2× multisampling instead of 4×;
//   shadows   maps of 512 instead of 1024, with plain PCF, not soft;
//   textures  anisotropic filtering of 2, not 8; 150 motes of dust, not 400.
//
// `?lite` and `?full` choose by hand, `?record` is `full`; anything else is guessed from the device (`pick`).
export const FULL = {
  name: 'full', ratios: [2, 1.5, 1.25, 1], samples: 4, ao: true,
  shadowSize: 1024, softShadows: true, anisotropy: 8, dust: 400, fps: 0, budget: 1 / 48,
};
export const LITE = {
  name: 'lite', ratios: [1.25, 1, 0.85, 0.75], samples: 2, ao: false,
  shadowSize: 512, softShadows: false, anisotropy: 2, dust: 150, fps: 30, budget: 1 / 24,
};

// A touch screen as the only pointer, a small screen, little memory, few cores or the data saver:
// any of them is enough. `deviceMemory` is Chrome's (rounded GB); Safari leaves it undefined.
export function pick(search = location.search, nav = navigator, mq = (q) => matchMedia(q).matches, scr = screen) {
  const p = new URLSearchParams(search);
  if (p.has('full')) return FULL;
  if (p.has('lite')) return LITE;
  if (p.has('record')) return FULL; // `just record` films the laptop's look, on any machine
  const touchOnly = mq('(pointer: coarse)') && !mq('(any-pointer: fine)');
  const small = Math.min(scr.width, scr.height) <= 820;
  const weak = (nav.deviceMemory ?? 8) <= 2 || (nav.hardwareConcurrency ?? 8) <= 2 || !!nav.connection?.saveData;
  return touchOnly || small || weak ? LITE : FULL;
}

// The pixel ratios the adaptive quality steps through: the profile's, never above the device's.
export function ratios(q, dpr = devicePixelRatio) {
  const top = Math.min(dpr, q.ratios[0]);
  return [top, ...q.ratios.filter((r) => r < top)];
}
