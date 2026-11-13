// For the scripts that step the room by hand (`just peek`, `just record`, `just light`): until
// the first `window.__room.step(dt)`, no frame runs by the browser's own clock. The room's time
// then starts at zero on every run, whatever the machine's speed, so two runs of one tree give the
// same pixels and two trees can be compared pixel by pixel. (Without it the room's loop ran for
// as long as the script took to take over: one frame on a slow start, several on a quick one.)
//
// The page's requestAnimationFrame is held, not dropped: at the first step every held callback is
// handed to the browser, and from then on the page asks for frames as usual.
export const holdFrames = (page) => page.addInitScript(() => {
  const raf = window.requestAnimationFrame.bind(window), held = [];
  let hold = true, room;
  window.requestAnimationFrame = (cb) => (hold ? held.push(cb) : raf(cb));
  Object.defineProperty(window, '__room', {
    configurable: true,
    get: () => room,
    set(v) {
      const step = v?.step;
      if (typeof step === 'function') v.step = (dt) => { step(dt); if (hold) { hold = false; for (const cb of held.splice(0)) raf(cb); } };
      room = v;
    },
  });
});
