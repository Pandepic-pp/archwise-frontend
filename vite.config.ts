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
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5000',
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
