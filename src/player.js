// The owner's playlist, in Spotify's Embed player, over the room
// (AGENTS.md, invariants 1 and 7). The iframe is made when the visitor
// opens the player and removed when they close it, so nothing of Spotify's
// loads before the click and nothing plays after the close. Every word
// comes from config.playlist; the artists are named beside the player.

export function createPlayer(root, cfg, { onOpen = () => {}, onClose = () => {} } = {}) {
  if (!root || !cfg?.embed) return { open() {}, close() {}, toggle() {}, get on() { return false; } };
  const w = cfg.words;
  const el = (tag, text, cls) => { const n = document.createElement(tag); if (text != null) n.textContent = text; if (cls) n.className = cls; return n; };

  root.setAttribute('aria-label', cfg.title);
  const head = el('div', null, 'head');
  const title = el('div', null, 'title'); title.append(el('strong', cfg.title), el('span', cfg.by));
  const close = el('button', '×', 'close'); close.setAttribute('aria-label', w.close); close.title = w.close;
  head.append(title, close);
  const frame = el('div', null, 'frame');
  const note = el('p', w.note, 'note');
  const artists = el('p', `${w.artists} ${cfg.artists.join(' · ')}`, 'artists');
  const foot = el('div', null, 'foot');
  const open = el('a', w.open, 'open'); open.href = cfg.url; open.target = '_blank'; open.rel = 'noopener';
  foot.append(el('span', w.credit, 'credit'), open);
  root.append(head, frame, note, artists, foot);

  let on = false;
  function show() {
    if (on) return; on = true;
    const f = document.createElement('iframe');
    f.src = cfg.embed; f.title = `Spotify: ${cfg.title}`;
    f.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
    f.loading = 'eager'; f.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.replaceChildren(f);
    root.hidden = false; onOpen();
  }
  function hide() {
    if (!on) return; on = false;
    frame.replaceChildren(); // the iframe goes, and its sound with it
    root.hidden = true; onClose();
  }
  close.onclick = hide;
  return { open: show, close: hide, toggle() { (on ? hide : show)(); }, get on() { return on; } };
}
