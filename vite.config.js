import { defineConfig } from 'vite';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { join, extname } from 'node:path';
import { brotliCompressSync, gzipSync, constants as zlib } from 'node:zlib';
import { feedXml } from './scripts/feed.mjs';
import { signature, reading } from './src/config.js';
// three.js alone is about 600 kB minified; the tapes and MapLibre are split out by import().
// /live/ is the radio's listeners count (`just listeners`), passed through
// in development as nginx does on the host. The posts' RSS feed is written
// into the build as feed.xml (scripts/feed.mjs), and served in development.
const feed = () => feedXml({ site: reading.site, title: signature.name, description: signature.tagline });

const walk = (dir, base = dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name), base) : [join(dir, e.name).slice(base.length)]));

// The files of public/ keep their names, so the host cannot tell a visitor's browser to keep them
// for good. The build gives the room the first 8 hex digits of each file's SHA-256 (`__ROOM_FILES__`,
// read by src/files.js), and the room asks for `/models/sofa.glb?v=1a2b3c4d`: an address that
// changes when the file does, which the host may serve `immutable`. The list also tells the room
// which files exist, so it never asks for one that is not there (the sounds still to be recorded,
// a room.glb). In development the list is left out and every file is asked for by its plain name.
const publicDir = new URL('./public/', import.meta.url).pathname;
function versions() {
  const out = {};
  for (const f of walk(publicDir)) out[`/${f}`] = createHash('sha256').update(readFileSync(join(publicDir, f))).digest('hex').slice(0, 8);
  return out;
}

// What the visitor's browser can ask for while the page is still being read, before any script
// has run: the room's own code (the chunk of src/app.js and what it imports) and the fonts its
// canvases draw with. Without these lines the browser learns of them one after the other (the
// page, then src/main.js, then src/app.js, then the fonts), each a round trip later than the last.
// They are added by a few lines of script in the page's head, and only when the 3D room is what
// will show: a visitor who reads the room as text (`?lofi`, or the choice kept from a last visit)
// downloads none of it. The script repeats the first lines of src/main.js; keep them alike.
function firstLoad() {
  let base = '/';
  return {
    name: 'first-load',
    configResolved(c) { base = c.base; },
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        if (!ctx.bundle) return html; // development: Vite serves the modules one by one
        const chunks = Object.values(ctx.bundle).filter((c) => c.type === 'chunk');
        const app = chunks.find((c) => c.facadeModuleId?.endsWith('/src/app.js'));
        if (!app) return html;
        const seen = new Set(), graph = (c) => { if (!c || seen.has(c.fileName)) return; seen.add(c.fileName); for (const i of c.imports) graph(ctx.bundle[i]); };
        graph(app);
        const already = new Set([...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => m[1]));
        const modules = [...seen].map((f) => base + f).filter((f) => !already.has(f));
        const fonts = Object.keys(ctx.bundle).filter((f) => f.endsWith('.woff2')).map((f) => base + f).sort();
        const code = `(function(){var q=location.search,h=location.hostname,v=null,d=document,t=function(k){return new RegExp('[?&]'+k+'(=|&|$)').test(q)};`
          + `try{v=localStorage.getItem('room:view')}catch(e){}`
          + `if(t('lofi')||t('static')||(v==='lofi'&&!t('hifi')&&!t('grid')&&h!==${JSON.stringify(gridHost)}))return;`
          + `function p(u,f){var l=d.createElement('link');if(f){l.rel='preload';l.as='font';l.type='font/woff2';l.crossOrigin='anonymous'}else{l.rel='modulepreload';l.crossOrigin=''}l.href=u;d.head.appendChild(l)}`
          + `${JSON.stringify(modules)}.forEach(function(u){p(u)});${JSON.stringify(fonts)}.forEach(function(u){p(u,1)})})()`;
        return { html, tags: [{ tag: 'script', children: code, injectTo: 'head' }] };
      },
    },
  };
}

// A copy of every file that shrinks, compressed as far as it goes: `<file>.br` (Brotli, quality
// 11) and `<file>.gz` (gzip, level 9), beside the file. nginx sends them in the file's place
// (`brotli_static`, `gzip_static`), so the host compresses nothing while a visitor waits, and
// sends less than it does compressing as it goes. The models are among them: a meshopt-packed
// .glb is made to be compressed once more on its way (its geometry, not its pictures).
// A file under 1 kB, or one that shrinks by less than 3 %, gets no copy.
const SHRINKS = new Set(['.html', '.js', '.css', '.svg', '.json', '.xml', '.glb', '.bin', '.txt', '.md']);
function precompress() {
  let out = 'dist', on = true;
  return {
    name: 'precompress', apply: 'build',
    configResolved(c) { out = c.build.outDir.startsWith('/') ? c.build.outDir : join(c.root, c.build.outDir); on = !process.env.ROOM_NO_COMPRESS; },
    closeBundle() {
      if (!on) return;
      let files = 0, before = 0, br = 0;
      for (const f of walk(out)) {
        if (!SHRINKS.has(extname(f))) continue;
        const file = join(out, f), raw = readFileSync(file);
        if (raw.length < 1024) continue;
        const b = brotliCompressSync(raw, { params: { [zlib.BROTLI_PARAM_QUALITY]: 11, [zlib.BROTLI_PARAM_SIZE_HINT]: raw.length } });
        if (b.length > raw.length * 0.97) continue;
        writeFileSync(`${file}.br`, b); writeFileSync(`${file}.gz`, gzipSync(raw, { level: 9 }));
        files++; before += raw.length; br += b.length;
      }
      console.log(`precompressed ${files} files: ${(before / 1e6).toFixed(1)} MB, ${(br / 1e6).toFixed(1)} MB as Brotli`);
    },
  };
}

const gridHost = (await import('./src/config.js')).grid?.host ?? '';
export default defineConfig(({ command }) => ({
  // the room's code and the grid's worker are split by import(); see `firstLoad` above for what the page asks for at once
  build: { target: 'es2022', chunkSizeWarningLimit: 850 }, // MapLibre is about 800 kB, loaded only when ▲ grid opens
  define: { __ROOM_FILES__: command === 'build' ? JSON.stringify(versions()) : 'undefined' },
  // a node_modules that is a link to another checkout's (a git worktree) is still served: the fonts come from it
  server: { proxy: { '/live': 'http://127.0.0.1:8787' }, fs: { allow: ['.', realpathSync(new URL('./node_modules', import.meta.url).pathname)] } },
  preview: { proxy: { '/live': 'http://127.0.0.1:8787' } },
  plugins: [{
    name: 'feed',
    generateBundle() { this.emitFile({ type: 'asset', fileName: reading.feed.replace(/^\//, ''), source: feed() }); },
    configureServer(server) {
      server.middlewares.use(reading.feed, (_req, res) => { res.setHeader('content-type', 'application/rss+xml; charset=utf-8'); res.end(feed()); });
    },
  }, firstLoad(), precompress()],
}));
