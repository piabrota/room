// The screen guard (config.guard): the room does not hand itself to a screenshot willingly.
// A browser has no way to stop one: streaming sites get a black capture because their video is
// DRM-protected, and nothing like that exists for a canvas or for text. So this is a deterrent:
//
//   PrintScreen   the key (Windows, Linux) blacks the page out for a moment and empties the
//                 clipboard, where Windows put the capture;
//   away          the page goes black while the tab is hidden or the window has lost focus, which
//                 is when most capture tools (the Snipping Tool, a recorder's picker) are in front.
//                 The Spotify player's iframe takes the focus on a click, and that does not count;
//   print         a printed page is blank (style.css, @media print);
//   select        the words of the lock, the labels and the buttons cannot be selected or copied,
//                 and the room has no context menu (style.css, `user-select`).
//
// macOS's Cmd+Shift+3/4/5 and a phone's screenshot never reach a page, so those still work.
// `?record` and a browser driven by a script (just record, just light, just mobile) turn it off.
export function guard(cfg, search = location.search) {
  if (!cfg?.screenshots || navigator.webdriver || new URLSearchParams(search).has('record')) return;
  const curtain = document.createElement('div'); curtain.id = 'curtain'; curtain.setAttribute('aria-hidden', 'true');
  document.body.append(curtain);
  let away = false, until = 0;
  const draw = () => curtain.classList.toggle('on', away || performance.now() < until);
  const flash = () => {
    until = performance.now() + 1500; draw(); setTimeout(draw, 1550);
    try { navigator.clipboard?.writeText(' ').catch(() => {}); } catch { /* no clipboard: nothing to clear */ }
  };
  const isKey = (e) => e.key === 'PrintScreen' || e.code === 'PrintScreen';
  addEventListener('keydown', (e) => { if (isKey(e)) flash(); }, true);
  addEventListener('keyup', (e) => { if (isKey(e)) flash(); }, true); // Windows sends only the keyup
  addEventListener('blur', () => { setTimeout(() => { away = !(document.activeElement instanceof HTMLIFrameElement) && !document.hasFocus(); draw(); }, 0); });
  addEventListener('focus', () => { away = false; draw(); });
  document.addEventListener('visibilitychange', () => { away = document.hidden; draw(); });
  for (const sel of ['#scene', '#lock', '#tooltip']) document.querySelector(sel)?.addEventListener('contextmenu', (e) => e.preventDefault());
  document.querySelector('#lock')?.addEventListener('copy', (e) => e.preventDefault());
  document.body.classList.add('guarded');
}
