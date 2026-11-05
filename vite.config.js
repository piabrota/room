import { defineConfig } from 'vite';
// three.js alone is about 600 kB minified; the tapes are split out by import().
export default defineConfig({ build: { target: 'es2022', chunkSizeWarningLimit: 800 } });
