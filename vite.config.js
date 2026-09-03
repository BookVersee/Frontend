import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: false,
    proxy: {
      '/api': {
        target: 'http://localhost:5226',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
      },
      '/hubs': {
        target: 'http://localhost:5226',
        changeOrigin: true,
        ws: true,
        secure: false,
      },
    },
  },
});
