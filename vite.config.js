import { defineConfig } from 'vite';
// three.js alone is about 600 kB minified; the tapes are split out by import().
// /live/ is the radio's listeners count (`just listeners`), passed through
// in development as nginx does on the host.
export default defineConfig({
  build: { target: 'es2022', chunkSizeWarningLimit: 800 },
  server: { proxy: { '/live': 'http://127.0.0.1:8787' } },
  preview: { proxy: { '/live': 'http://127.0.0.1:8787' } },
});
