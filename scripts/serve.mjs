// A small static server for the measurements (`just mobile`): it serves a build the way the
// host does (nix-os: nginx), so the bytes counted here are the bytes a visitor downloads.
//
//   host 'today'     nginx as nix-os has it now: text is gzipped as it goes, a `.gz` file beside a
//                    file is sent in its place (`gzip_static`), `/assets/` is `immutable`, the page
//                    is `no-cache`, and every other file has only its ETag, so a browser asks
//                    about it again on every visit;
//   host 'proposed'  and with what the room asks nix-os for: a `.br` file is sent first
//                    (`brotli_static`), and an address with `?v=` (src/files.js) is `immutable`.
//
// HTTP/1.1, where the host speaks HTTP/2: six requests at a time, not all at once. No dependency.
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, extname, normalize } from 'node:path';
import { gzipSync } from 'node:zlib';

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.xml': 'text/xml', '.glb': 'model/gltf-binary', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.woff2': 'font/woff2', '.woff': 'font/woff', '.wasm': 'application/wasm', '.bin': 'application/octet-stream', '.md': 'text/markdown' };
const GZIP = new Set(['.html', '.js', '.css', '.json', '.svg', '.xml', '.md']); // what nginx's recommended gzip settings compress as they go

export async function serve(dir, { host = 'proposed', port = 0 } = {}) {
  const zipped = new Map(), proposed = host === 'proposed';
  const server = createServer((req, res) => {
    const u = new URL(req.url, 'http://x');
    let path = normalize(decodeURIComponent(u.pathname)); if (path.endsWith('/')) path += 'index.html';
    const file = join(dir, path);
    if (!file.startsWith(dir) || !existsSync(file) || !statSync(file).isFile()) { res.writeHead(404).end(); return; }
    const st = statSync(file), ext = extname(file), accept = String(req.headers['accept-encoding'] ?? '');
    const head = { 'content-type': TYPES[ext] ?? 'application/octet-stream', vary: 'Accept-Encoding', etag: `"${st.size.toString(16)}-${Math.round(st.mtimeMs).toString(16)}"` };
    if (path.startsWith('/assets/') || (proposed && u.searchParams.has('v'))) head['cache-control'] = 'public, max-age=31536000, immutable';
    else if (path === '/index.html') head['cache-control'] = 'no-cache';
    if (req.headers['if-none-match'] === head.etag) { res.writeHead(304, head).end(); return; }
    let body;
    if (proposed && /\bbr\b/.test(accept) && existsSync(`${file}.br`)) { body = readFileSync(`${file}.br`); head['content-encoding'] = 'br'; }
    else if (/\bgzip\b/.test(accept) && existsSync(`${file}.gz`)) { body = readFileSync(`${file}.gz`); head['content-encoding'] = 'gzip'; }
    else if (GZIP.has(ext) && /\bgzip\b/.test(accept)) {
      if (!zipped.has(file)) zipped.set(file, gzipSync(readFileSync(file), { level: 5 }));
      body = zipped.get(file); head['content-encoding'] = 'gzip';
    } else body = readFileSync(file);
    head['content-length'] = body.length;
    res.writeHead(200, head); res.end(req.method === 'HEAD' ? undefined : body);
  });
  await new Promise((done) => server.listen(port, '127.0.0.1', done));
  return { url: `http://127.0.0.1:${server.address().port}/`, close: () => new Promise((done) => { server.close(done); server.closeAllConnections(); }) };
}
