import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // The dev server proxies /api to a locally running backend, so the app can
    // be developed without VITE_API_BASE_URL pointing anywhere public.
    proxy: {
      '/api': {
        target: process.env.VITE_DEV_API || 'http://localhost:8010',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Recharts alone is ~540kB raw. It only loads on the two screens that draw
    // charts, so the default 500kB warning is noise rather than a signal here.
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        // Recharts and framer-motion are most of the bundle and change far less
        // often than the app does — splitting them keeps the app chunk small
        // and cacheable across deploys.
        manualChunks: {
          charts: ['recharts'],
          motion: ['framer-motion'],
        },
      },
    },
  },
});
