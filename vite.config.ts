import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  // Polyfill process.env for packages (like Excalidraw) that assume a Node environment
  define: {
    'process.env': {},
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://archwise-backend.onrender.com/',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'https://archwise-backend.onrender.com/',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  optimizeDeps: {
    // Excalidraw has some ESM quirks — force pre-bundling
    include: ['@excalidraw/excalidraw'],
  },
});
