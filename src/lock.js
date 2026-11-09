// The door's lock: the room's one puzzle (config.door). A keypad over the room, plain buttons, so
// it costs nothing to draw and a finger on a phone works it as well as a mouse. Every word comes
// from config.door.lock, set with textContent (invariant 3). The four clues say what to count; the
// right digits call `onSolve`, a wrong set shakes the display and clears it.
//
// The gate (config.door.gate): the keypad shows only to a visitor who has left an email. The form
// posts it as JSON to `gate.endpoint` (scripts/listeners.mjs keeps it on the room's own host); a
// 2xx answer opens the keypad, and this browser remembers it (localStorage), so the form is asked
// once. Anything else keeps the door locked and says so. Without a `gate`, the keypad shows at once.

const PASSED = 'room:door-gate';
const passed = { get() { try { return localStorage.getItem(PASSED) === 'yes'; } catch { return false; } }, set() { try { localStorage.setItem(PASSED, 'yes'); } catch { /* private mode: asked again next visit */ } } };

export function createLock(root, cfg, { gate = null, onSolve = () => {}, onPress = () => {} } = {}) {
  if (!root || !cfg?.code) return { open() {}, close() {}, get on() { return false; } };
  const el = (tag, text, cls) => { const n = document.createElement(tag); if (text != null) n.textContent = text; if (cls) n.className = cls; return n; };
  root.setAttribute('aria-label', cfg.title);

  const head = el('div', null, 'head');
  const close = el('button', '×', 'close'); close.setAttribute('aria-label', cfg.close); close.title = cfg.close;
  head.append(el('strong', cfg.title), close);
  const prompt = el('p', cfg.prompt, 'prompt');
  const clues = el('ol', null, 'clues');
  for (const c of cfg.clues) clues.append(el('li', c));
  const display = el('output', null, 'display'); display.setAttribute('aria-live', 'polite');
  const status = el('p', '', 'status');
  const keys = el('div', null, 'keys');
  for (const k of ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'enter']) {
    const b = el('button', k === 'clear' ? cfg.clear : k === 'enter' ? cfg.enter : k);
    b.dataset.key = k; if (k === 'enter') b.className = 'enter';
    b.onclick = () => press(k);
    keys.append(b);
  }
  const game = el('div', null, 'game'); game.append(prompt, clues, display, status, keys);

  // the gate: an email before the game
  const form = el('form', null, 'gate');
  if (gate) {
    const line = el('p', gate.line, 'prompt');
    const input = el('input'); Object.assign(input, { type: 'email', required: true, autocomplete: 'email', placeholder: gate.placeholder, name: 'email' });
    input.setAttribute('aria-label', gate.placeholder);
    const send = el('button', gate.button, 'enter'); send.type = 'submit';
    const note = el('p', gate.privacy, 'note'), said = el('p', '', 'status');
    form.append(line, input, send, note, said);
    form.onsubmit = async (e) => {
      e.preventDefault();
      const email = input.value.trim();
      if (!input.checkValidity() || !email) { said.textContent = gate.invalid; return; }
      send.disabled = true; said.textContent = gate.sending;
      try {
        const r = await fetch(gate.endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email }) });
        if (!r.ok) throw new Error(String(r.status));
        passed.set(); said.textContent = ''; showGame();
      } catch { said.textContent = gate.failed; }
      finally { send.disabled = false; }
    };
  }
  root.append(head, form, game);
  const showGame = () => { form.hidden = true; game.hidden = false; };
  const showGate = () => { form.hidden = false; game.hidden = true; form.querySelector('input')?.focus(); };

  let typed = '', on = false;
  const n = cfg.code.length;
  function draw() { display.textContent = Array.from({ length: n }, (_, i) => typed[i] ?? '·').join(' '); }
  function press(k) {
    onPress(k);
    status.textContent = '';
    if (k === 'clear') typed = '';
    else if (k === 'enter') check();
    else if (typed.length < n) { typed += k; if (typed.length === n) check(); }
    draw();
  }
  function check() {
    if (typed.length < n) return;
    if (typed === cfg.code) { status.textContent = cfg.right; setTimeout(() => { hide(); onSolve(); }, 450); return; }
    status.textContent = cfg.wrong; typed = '';
    root.classList.remove('shake'); void root.offsetWidth; root.classList.add('shake');
  }
  function onKey(e) {
    if (!on || game.hidden) return; // the email form takes the keys while it shows
    if (/^\d$/.test(e.key)) { press(e.key); e.stopPropagation(); }
    else if (e.key === 'Backspace') { typed = typed.slice(0, -1); draw(); e.stopPropagation(); }
    else if (e.key === 'Enter') { press('enter'); e.stopPropagation(); }
  }
  // capture, so the digits type into the lock and do not move the camera (src/app.js, keys 1 to 0)
  addEventListener('keydown', onKey, true);
  function show() {
    if (on) return; on = true; typed = ''; status.textContent = ''; draw(); root.hidden = false;
    if (gate && !passed.get()) showGate(); else showGame();
  }
  function hide() { if (!on) return; on = false; root.hidden = true; }
  close.onclick = hide;
  draw();
  return { open: show, close: hide, get on() { return on; } };
}
