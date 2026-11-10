// The credits, as text on the page: whose idea a room like this is, a short list of whose work
// is in this one, and where the full list is (AGENTS.md, invariant 2). Every word comes from
// config.credits. Built with DOM nodes and textContent, so config text stays text. No three.js
// here: the LOFI page shows the same nodes (src/lofi.js) without loading the room.

const el = (tag, text, cls) => { const n = document.createElement(tag); if (text != null) n.textContent = text; if (cls) n.className = cls; return n; };

// The body of the credits: the idea first, then the sources, then the full list's address.
// `h` is the tag of the two small headings, so each page keeps its own outline.
export function creditsNodes(cfg, h = 'h3') {
  const idea = el('div', null, 'idea');
  idea.append(el(h, cfg.idea.heading), el('p', cfg.idea.name, 'name'), el('p', `${cfg.idea.line} ${cfg.idea.where}`), el('p', cfg.idea.own, 'own'));
  const list = el('ul', null, 'sources');
  for (const s of cfg.sources) {
    const li = el('li');
    li.append(el('span', s.what, 'what'), ' ', el('strong', s.who), ' ', el('span', s.licence, 'licence'));
    list.append(li);
  }
  const full = el('p', `${cfg.full.line} `, 'full');
  const a = el('a', cfg.full.label); a.href = cfg.full.url; a.target = '_blank'; a.rel = 'noopener';
  full.append(a);
  return [idea, el(h, cfg.sourcesHeading), list, full];
}

// The credits button of the HUD and its card. The card shows while the pointer is over the
// button or the card, while the keyboard's focus is in either, and after a click or a tap (it
// then stays until a click outside, a second click, its × or Esc). `open()` is what the plate
// in the room calls.
export function createCredits(button, card, cfg, { linger = 350 } = {}) {
  if (!button || !card || !cfg) return { open() {}, close() {}, get on() { return false; } };
  const title = el('strong', cfg.title); title.id = `${card.id}-title`;
  const close = el('button', '×', 'close'); close.setAttribute('aria-label', cfg.close); close.title = cfg.close;
  const head = el('div', null, 'head'); head.append(title, close);
  card.setAttribute('aria-labelledby', title.id);
  card.replaceChildren(head, ...creditsNodes(cfg, 'h3'));
  button.textContent = cfg.button; button.hidden = false;
  button.setAttribute('aria-controls', card.id); button.setAttribute('aria-expanded', 'false');

  let on = false, pinned = false, over = false, timer = 0, quiet = false;
  const inside = (n) => !!n && (button.contains(n) || card.contains(n));
  // the card stands on the row of the shots: it may grow up to the switches, and scrolls past that
  const fit = () => { card.style.maxHeight = `${Math.max(180, card.parentElement.getBoundingClientRect().top - 72)}px`; };
  function show(pin = false) {
    clearTimeout(timer); pinned ||= pin;
    if (on) return; on = true;
    fit(); card.scrollTop = 0;
    card.classList.add('on'); button.classList.add('active'); button.setAttribute('aria-expanded', 'true');
  }
  function hide() {
    clearTimeout(timer);
    if (!on) return; on = pinned = over = false;
    if (card.contains(document.activeElement)) { quiet = true; button.focus(); quiet = false; } // the focus never stays in a hidden card
    card.classList.remove('on'); button.classList.remove('active'); button.setAttribute('aria-expanded', 'false');
  }
  // a little later, so the pointer can cross from the button to the card and its link
  const later = () => { clearTimeout(timer); timer = setTimeout(() => { if (!pinned && !over && !inside(document.activeElement)) hide(); }, linger); };

  for (const n of [button, card]) {
    n.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { over = true; show(); } });
    n.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') { over = false; later(); } });
    n.addEventListener('focusin', () => { if (!quiet) show(); });
    n.addEventListener('focusout', (e) => { if (!inside(e.relatedTarget) && !pinned && !over) hide(); });
  }
  button.addEventListener('click', () => { if (on && pinned) hide(); else show(true); });
  close.addEventListener('click', hide);
  addEventListener('pointerdown', (e) => { if (on && !inside(e.target)) hide(); }, true); // a click or a tap outside
  addEventListener('resize', () => { if (on) fit(); });

  return { open: () => show(true), close: hide, get on() { return on; } };
}
