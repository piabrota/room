// The LOFI view: the room as a page to read. Home, About, Work, Posts,
// Online, Subscribe and Credits, from the same config as the 3D room, and
// the posts from posts/*.md. The credits (config.credits: whose idea a room
// like this is, and whose work is in this one) close the home page and have
// their own page, so a visitor without WebGL reads them too. One column, plain text, hash routes
// (#/about, #/posts/<slug>...). Built with DOM nodes and textContent,
// never innerHTML, so config text and posts stay text.
import { renderSignature } from './signature.js';
import { frontMatter, renderMarkdown } from './markdown.js';
import { creditsNodes } from './creditscard.js';

const files = import.meta.glob('../posts/*.md', { query: '?raw', import: 'default', eager: true });
const posts = Object.entries(files).map(([path, src]) => {
  const { meta, body } = frontMatter(src);
  return { slug: path.split('/').pop().replace(/\.md$/, ''), body, ...meta };
}).sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));

const el = (tag, text, cls) => { const n = document.createElement(tag); if (text) n.textContent = text; if (cls) n.className = cls; return n; };
const out = (label, url) => { const a = el('a', label); a.href = url; if (/^https?:/.test(url)) { a.target = '_blank'; a.rel = 'noopener'; } return a; };
const route = (label, to) => { const a = el('a', label); a.href = `#/${to}`; return a; };
const day = (d) => (d ? new Date(`${d}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '');

export function renderLofi(root, config) {
  const { signature, reading: r } = config, S = r.sections;

  function nav() {
    const n = el('nav'); n.setAttribute('aria-label', 'sections');
    for (const k of ['about', 'work', 'posts', 'online']) n.append(route(S[k], k));
    return n;
  }
  function postList(list) {
    const ul = el('ul', null, 'posts');
    if (!list.length) ul.append(el('li', r.empty));
    for (const p of list) { const li = el('li'); li.append(route(p.title, `posts/${p.slug}`), el('time', day(p.date))); ul.append(li); }
    return ul;
  }
  const section = (key, ...kids) => { const s = el('section'); s.id = `lofi-${key}`; s.append(el('h2', S[key]), ...kids); return s; };
  const links = (items) => { const ul = el('ul'); for (const [label, url, hint] of items) { const li = el('li'); li.append(url ? out(label, url) : el('strong', label)); if (hint) li.append(el('span', ` · ${hint}`)); ul.append(li); } return ul; };

  const about = () => section('about', ...r.about.map((t) => el('p', t)));
  const work = () => {
    const linkSpots = (g) => config.hotspots.filter((h) => h.group === g && h.action === 'link').map((h) => [h.label, h.value, h.hint]);
    const s = section('work');
    s.append(el('h3', 'piabrota'), links(config.projects.map((p) => [p.id, p.url, p.line])));
    s.append(el('h3', 'works with a DOI'), links(config.works.map((w) => [w.title, `https://doi.org/${w.doi}`, `doi ${w.doi}`])));
    s.append(el('h3', config.papers.group), links(config.papers.list.map((p) => [p.title, `https://aixiv.online/abs/${p.aixiv}`, `aiXiv:${p.aixiv} · ${p.by}`])));
    s.append(el('h3', 'friends'), links([[config.sea.label, config.sea.url, config.sea.hint], [config.loop.label, config.loop.url, config.loop.hint]]));
    s.append(el('h3', 'tapes'), links(config.tapes.map((t) => [t.label, t.index ? config.catalogue?.accounts[t.account]?.url ?? null : null, t.text])));
    s.append(el('h3', 'inspiration'), links(linkSpots('inspiration')));
    return s;
  };
  const posts_ = (all) => section('posts', postList(all ? posts : posts.slice(0, r.latest)), ...(all || posts.length <= r.latest ? [] : [route(`${r.back} →`, 'posts')]));
  const online = () => section('online', links(r.online.map((o) => [`${o.label} · ${o.handle}`, o.url])));
  const subscribe = () => {
    const p = el('p', `${r.subscribe.line} `); p.append(out(r.subscribe.feedLabel, r.feed));
    const mail = config.hotspots.find((h) => h.name === 'fax');
    const p2 = el('p', `${r.subscribe.mailLine} `); if (mail) p2.append(out(mail.label, mail.value));
    const nl = r.subscribe.letter, p3 = el('p', `${r.subscribe.letterLine ?? ''} `); if (nl) p3.append(out(nl.handle, nl.subscribe));
    return section('subscribe', p, ...(nl ? [p3] : []), ...(mail ? [p2] : []));
  };
  const credits = () => { const s = section('credits', ...(config.credits ? creditsNodes(config.credits, 'h3') : [])); s.classList.add('credits'); return s; };
  function footer() {
    const f = el('footer'), n = el('nav'); n.setAttribute('aria-label', 'footer');
    n.append(route(S.home, ''), ...['about', 'work', 'posts', 'online', 'subscribe', 'credits'].filter((k) => S[k]).map((k) => route(S[k], k)));
    f.append(n); return f;
  }

  function show() {
    const path = location.hash.replace(/^#\/?/, '');
    const head = el('header'); renderSignature(head, signature); head.append(nav());
    const main = el('div', null, 'page');
    const [kind, slug] = path.split('/');
    if (kind === 'posts' && slug) {
      const p = posts.find((x) => x.slug === slug);
      const art = el('article');
      if (p) { art.append(el('h2', p.title, 'title'), el('time', day(p.date)), renderMarkdown(p.body)); }
      else art.append(el('p', r.empty));
      const back = el('p'); back.append(route(`← ${r.back}`, 'posts')); art.append(back);
      main.append(art);
    } else if (kind && S[kind] && kind !== 'home') {
      main.append({ about, work, posts: () => posts_(true), online, subscribe, credits }[kind]());
    } else {
      main.append(about(), posts_(false), online(), ...(S.credits ? [credits()] : []));
    }
    root.replaceChildren(head, main, footer());
    if (document.body.classList.contains('lofi') && path) scrollTo(0, 0);
  }
  addEventListener('hashchange', show);
  show();
}
