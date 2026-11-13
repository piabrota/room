// A small static server for the measurements (`just mobile`, `just load-budget`): it serves a
// build the way the host does, so the bytes counted here are the bytes a visitor downloads.
//
//   a file with a `.br` or a `.gz` beside it (the build writes them, vite.config.js) is sent as
//   that file when the browser takes it, as nginx does with `brotli_static` and `gzip_static`;
//   text with no such file is gzipped as it goes (nginx's `gzip on`); `plain` sends none of the
//   precompressed files, which is the host before it is told to use them;
//   `/assets/` and any address with `?v=` are `immutable`, the page is `no-cache`.
//
// HTTP/1.1, where the host speaks HTTP/2: six requests at a time, not all at once. No dependency.
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, extname, normalize } from 'node:path';
import { gzipSync } from 'node:zlib';

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.xml': 'text/xml', '.glb': 'model/gltf-binary', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.woff2': 'font/woff2', '.woff': 'font/woff', '.wasm': 'application/wasm', '.bin': 'application/octet-stream', '.ktx2': 'image/ktx2', '.md': 'text/markdown' };
const GZIP = new Set(['.html', '.js', '.css', '.json', '.svg', '.xml', '.md']); // what nginx's recommended gzip settings compress

export async function serve(dir, { plain = false, port = 0 } = {}) {
  const zipped = new Map();
  const server = createServer((req, res) => {
    const u = new URL(req.url, 'http://x');
    let path = normalize(decodeURIComponent(u.pathname)); if (path.endsWith('/')) path += 'index.html';
    const file = join(dir, path);
    if (!file.startsWith(dir) || !existsSync(file) || !statSync(file).isFile()) { res.writeHead(404).end(); return; }
    const ext = extname(file), accept = String(req.headers['accept-encoding'] ?? '');
    const head = { 'content-type': TYPES[ext] ?? 'application/octet-stream', vary: 'Accept-Encoding',
      'cache-control': path.startsWith('/assets/') || u.searchParams.has('v') ? 'public, max-age=31536000, immutable' : 'no-cache' };
    let body;
    if (!plain && /\bbr\b/.test(accept) && existsSync(`${file}.br`)) { body = readFileSync(`${file}.br`); head['content-encoding'] = 'br'; }
    else if (!plain && /\bgzip\b/.test(accept) && existsSync(`${file}.gz`)) { body = readFileSync(`${file}.gz`); head['content-encoding'] = 'gzip'; }
    else if (GZIP.has(ext) && /\bgzip\b/.test(accept)) {
      if (!zipped.has(file)) zipped.set(file, gzipSync(readFileSync(file), { level: 6 }));
      body = zipped.get(file); head['content-encoding'] = 'gzip';
    } else body = readFileSync(file);
    head['content-length'] = body.length;
    res.writeHead(200, head); res.end(req.method === 'HEAD' ? undefined : body);
  });
  await new Promise((done) => server.listen(port, '127.0.0.1', done));
  return { url: `http://127.0.0.1:${server.address().port}/`, close: () => new Promise((done) => { server.close(done); server.closeAllConnections(); }) };
}
