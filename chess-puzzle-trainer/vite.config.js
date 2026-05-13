// vite.config.ts is canonical. This .js file is kept only because Vite
// processes .js before .ts and we cannot delete it without breaking the build.
// It must mirror vite.config.ts exactly.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:4000',
        changeOrigin: true
      }
    }
  }
});
