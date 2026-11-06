// The posts' RSS feed: read posts/*.md (front matter: title, date,
// summary) and write feed.xml for the build (vite.config.js) or the
// check (scripts/check.mjs). No dependency.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;

export function readPosts() {
  const dir = join(root, 'posts');
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith('.md')).map((f) => {
    const src = readFileSync(join(dir, f), 'utf8');
    const m = /^---\n([\s\S]*?)\n---\n?/.exec(src), meta = {};
    if (m) for (const line of m[1].split('\n')) { const i = line.indexOf(':'); if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, ''); }
    return { slug: f.replace(/\.md$/, ''), file: f, ...meta };
  }).sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
}

const esc = (s = '') => String(s).replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c]));

export function feedXml({ site, title, description }) {
  const items = readPosts().map((p) => `    <item>
      <title>${esc(p.title)}</title>
      <link>${esc(`${site}/?lofi#/posts/${p.slug}`)}</link>
      <guid isPermaLink="false">${esc(p.slug)}</guid>
      <pubDate>${new Date(`${p.date}T12:00:00Z`).toUTCString()}</pubDate>
      <description>${esc(p.summary ?? '')}</description>
    </item>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${esc(title)}</title>
    <link>${esc(`${site}/?lofi`)}</link>
    <description>${esc(description)}</description>
${items}
  </channel>
</rss>
`;
}
