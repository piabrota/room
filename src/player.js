// The owner's playlist, in Spotify's Embed player, over the room
// (AGENTS.md, invariants 1 and 7). The iframe is made when the visitor
// opens the player and removed when they close it, so nothing of Spotify's
// loads before the click and nothing plays after the close. Every word
// comes from config.playlist; the artists are named beside the player.
//
// While it is open the player tells the page what it plays: Spotify's embed
// posts a `playback_update` message to its parent (the track's id, paused or
// not, the position). The room reads those messages, and loads nothing else
// of Spotify's for it, not its iFrame API script (invariant 1): it shows the
// title and artists of the track from config.playlist.tracks, a bar of its
// time, and moves the equalizer and the mixtape's reels while it plays. It
// cannot hear the music (the sound stays inside Spotify's frame), so the
// motion follows play and pause, not the beat.

const ORIGIN = 'https://open.spotify.com';

export function createPlayer(root, cfg, { onOpen = () => {}, onClose = () => {}, onPlayback = () => {} } = {}) {
  if (!root || !cfg?.embed) return { open() {}, close() {}, toggle() {}, get on() { return false; }, get playing() { return false; } };
  const w = cfg.words;
  const el = (tag, text, cls) => { const n = document.createElement(tag); if (text != null) n.textContent = text; if (cls) n.className = cls; return n; };

  root.setAttribute('aria-label', cfg.title);
  const head = el('div', null, 'head');
  const title = el('div', null, 'title'); title.append(el('strong', cfg.title), el('span', cfg.by));
  const close = el('button', '×', 'close'); close.setAttribute('aria-label', w.close); close.title = w.close;
  head.append(title, close);
  const frame = el('div', null, 'frame');
  // what plays now: the equalizer, the title and artists, the time
  const now = el('div', null, 'now'); now.hidden = true;
  const eq = equalizer();
  const nowText = el('div', null, 'now-text'), nowTitle = el('strong'), nowBy = el('span');
  nowText.append(el('em', w.now), nowTitle, nowBy);
  const bar = el('div', null, 'bar'), fill = el('i'); bar.append(fill);
  now.append(eq, nowText, bar);
  const note = el('p', w.note, 'note');
  const artists = el('p', `${w.artists} ${cfg.artists.join(' · ')}`, 'artists');
  // the lyrics toggle says where the lyrics are, and never shows the lyrics themselves
  const lyricsNote = el('p', w.lyricsNote, 'lyrics-note'); lyricsNote.id = 'player-lyrics'; lyricsNote.hidden = true;
  const lyrics = el('button', w.lyrics, 'lyrics');
  lyrics.setAttribute('aria-controls', lyricsNote.id); lyrics.setAttribute('aria-expanded', 'false');
  lyrics.onclick = () => {
    lyricsNote.hidden = !lyricsNote.hidden;
    lyrics.textContent = lyricsNote.hidden ? w.lyrics : w.lyricsHide;
    lyrics.setAttribute('aria-expanded', String(!lyricsNote.hidden));
  };
  const foot = el('div', null, 'foot');
  const open = el('a', w.open, 'open'); open.href = cfg.url; open.target = '_blank'; open.rel = 'noopener';
  const actions = el('div', null, 'actions'); actions.append(lyrics, open);
  foot.append(el('span', w.credit, 'credit'), actions);
  root.append(head, frame, now, note, artists, lyricsNote, foot);

  const byId = new Map((cfg.tracks ?? []).map((t) => [t.id, t]));
  let on = false, f = null, timer = 0;
  const state = { playing: false, id: '', position: 0, duration: 0, at: 0 };
  function draw() {
    const pos = state.playing ? state.position + (performance.now() - state.at) : state.position;
    fill.style.width = state.duration ? `${Math.min(100, (100 * pos) / state.duration).toFixed(2)}%` : '0%';
  }
  function onMessage(e) {
    if (e.origin !== ORIGIN || !f || e.source !== f.contentWindow) return;
    let d = e.data; if (typeof d === 'string') { try { d = JSON.parse(d); } catch { return; } }
    if (d?.type !== 'playback_update' || !d.payload) return;
    const p = d.payload, id = String(p.playingURI ?? '').split(':').pop();
    const playing = !p.isPaused && !!id; // a short buffering is still playing
    if (id !== state.id) {
      const t = byId.get(id);
      nowTitle.textContent = t?.title ?? ''; nowBy.textContent = t ? t.artists.join(', ') : '';
      now.hidden = !id;
    }
    Object.assign(state, { id, position: +p.position || 0, duration: +p.duration || 0, at: performance.now() });
    if (playing !== state.playing) { state.playing = playing; root.classList.toggle('playing', playing); onPlayback(playing); }
    draw();
  }
  function setIdle() {
    if (state.playing) { state.playing = false; root.classList.remove('playing'); onPlayback(false); }
    Object.assign(state, { id: '', position: 0, duration: 0 }); now.hidden = true;
  }
  function show() {
    if (on) return; on = true;
    f = document.createElement('iframe');
    f.src = cfg.embed; f.title = `Spotify: ${cfg.title}`;
    f.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
    f.loading = 'eager'; f.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.replaceChildren(f);
    addEventListener('message', onMessage); timer = setInterval(draw, 250);
    root.hidden = false; onOpen();
  }
  function hide() {
    if (!on) return; on = false;
    frame.replaceChildren(); f = null; // the iframe goes, and its sound with it
    removeEventListener('message', onMessage); clearInterval(timer); setIdle();
    root.hidden = true; onClose();
  }
  close.onclick = hide;
  return { open: show, close: hide, toggle() { (on ? hide : show)(); }, get on() { return on; }, get playing() { return state.playing; } };
}

// five bars that dance while the player plays (CSS, `.playing`), and stand still otherwise
export function equalizer() {
  const n = document.createElement('span'); n.className = 'eq'; n.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 5; i++) n.append(document.createElement('i'));
  return n;
}
