// A small Markdown reader for the posts in posts/*.md: front matter
// (`key: value` lines between two `---`), headings, paragraphs, lists,
// quotes, code blocks, and inline **strong**, *emphasis*, `code` and
// [links](url). It builds DOM nodes with textContent, never innerHTML,
// so a post can hold no script; the feed (scripts/feed.mjs) reads the
// same front matter.

export function frontMatter(src) {
  const m = /^---\n([\s\S]*?)\n---\n?/.exec(src);
  const meta = {};
  if (m) for (const line of m[1].split('\n')) {
    const i = line.indexOf(':'); if (i < 0) continue;
    meta[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  }
  return { meta, body: m ? src.slice(m[0].length) : src };
}

const SAFE = /^(https?:|mailto:|\/|#)/i;
function inline(parent, text) {
  const re = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(`([^`]+)`)|(\[([^\]]+)\]\(([^)\s]+)\))/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) parent.append(text.slice(last, m.index));
    if (m[2]) { const n = document.createElement('strong'); n.textContent = m[2]; parent.append(n); }
    else if (m[4]) { const n = document.createElement('em'); n.textContent = m[4]; parent.append(n); }
    else if (m[6]) { const n = document.createElement('code'); n.textContent = m[6]; parent.append(n); }
    else {
      const a = document.createElement('a'); a.textContent = m[8];
      if (SAFE.test(m[9])) a.href = m[9];
      if (/^https?:/i.test(m[9])) { a.target = '_blank'; a.rel = 'noopener'; }
      parent.append(a);
    }
    last = re.lastIndex;
  }
  if (last < text.length) parent.append(text.slice(last));
  return parent;
}

export function renderMarkdown(body) {
  const out = document.createDocumentFragment(), lines = body.split('\n');
  const el = (tag) => document.createElement(tag);
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    if (line.startsWith('```')) {
      const pre = el('pre'), code = el('code'), buf = [];
      for (i++; i < lines.length && !lines[i].startsWith('```'); i++) buf.push(lines[i]);
      code.textContent = buf.join('\n'); pre.append(code); out.append(pre); i++; continue;
    }
    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    if (h) { out.append(inline(el(`h${h[1].length + 1}`), h[2])); i++; continue; }
    if (/^[-*]\s+/.test(line)) {
      const ul = el('ul');
      for (; i < lines.length && /^[-*]\s+/.test(lines[i]); i++) ul.append(inline(el('li'), lines[i].replace(/^[-*]\s+/, '')));
      out.append(ul); continue;
    }
    if (line.startsWith('>')) {
      const q = el('blockquote'), buf = [];
      for (; i < lines.length && lines[i].startsWith('>'); i++) buf.push(lines[i].replace(/^>\s?/, ''));
      q.append(inline(el('p'), buf.join(' '))); out.append(q); continue;
    }
    const buf = [];
    for (; i < lines.length && lines[i].trim() && !/^(#{1,3}\s|[-*]\s|>|```)/.test(lines[i]); i++) buf.push(lines[i].trim());
    out.append(inline(el('p'), buf.join(' ')));
  }
  return out;
}
