import { defineConfig } from 'vite';
import { feedXml } from './scripts/feed.mjs';
import { signature, reading } from './src/config.js';
// three.js alone is about 600 kB minified; the tapes are split out by import().
// /live/ is the radio's listeners count (`just listeners`), passed through
// in development as nginx does on the host. The posts' RSS feed is written
// into the build as feed.xml (scripts/feed.mjs), and served in development.
const feed = () => feedXml({ site: reading.site, title: signature.name, description: signature.tagline });
export default defineConfig({
  build: { target: 'es2022', chunkSizeWarningLimit: 800 },
  server: { proxy: { '/live': 'http://127.0.0.1:8787' } },
  preview: { proxy: { '/live': 'http://127.0.0.1:8787' } },
  plugins: [{
    name: 'feed',
    generateBundle() { this.emitFile({ type: 'asset', fileName: reading.feed.replace(/^\//, ''), source: feed() }); },
    configureServer(server) {
      server.middlewares.use(reading.feed, (_req, res) => { res.setHeader('content-type', 'application/rss+xml; charset=utf-8'); res.end(feed()); });
    },
  }],
});
