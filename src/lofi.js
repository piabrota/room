// The LOFI view: the room's content as plain text. Same config as the
// 3D room (signature, tapes, link hotspots), built with DOM nodes and
// textContent, never innerHTML, so config text stays text.
import { renderSignature } from './signature.js';

const el = (tag, text) => { const n = document.createElement(tag); if (text) n.textContent = text; return n; };
const link = ({ label, url }) => {
  const a = el('a', label); a.href = url; a.target = '_blank'; a.rel = 'noopener'; return a;
};

export function renderLofi(root, { signature, tapes = [], hotspots = [] }) {
  const head = el('header');
  renderSignature(head, signature);
  root.replaceChildren(head);

  if (tapes.length) {
    const sec = el('section'); sec.append(el('h2', 'tapes'));
    const ul = el('ul');
    for (const t of tapes) {
      const li = el('li');
      const swatch = el('span', '■ '); swatch.style.color = t.color; swatch.setAttribute('aria-hidden', 'true');
      li.append(swatch, el('strong', t.label));
      if (t.text) li.append(el('span', ` · ${t.text}`));
      ul.append(li);
    }
    sec.append(ul); root.append(sec);
  }

  // Link hotspots that the signature does not already list, one
  // section per `group` (projects, bots, people, works with a DOI...).
  const known = new Set(signature.links.map((l) => l.url));
  const groups = new Map();
  for (const h of hotspots) {
    if (h.action !== 'link' || known.has(h.value)) continue;
    const g = h.group ?? 'in the room';
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g).push(h);
  }
  for (const [title, list] of groups) {
    const sec = el('section'); sec.append(el('h2', title));
    const ul = el('ul');
    for (const h of list) {
      const li = el('li'); li.append(link({ label: h.label, url: h.value }));
      if (h.hint) li.append(el('span', ` · ${h.hint}`));
      ul.append(li);
    }
    sec.append(ul); root.append(sec);
  }
}
