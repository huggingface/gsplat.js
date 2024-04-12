import { defineConfig } from 'vite';

export default defineConfig({
  optimizeDeps: {
    include: ['gsplat']
  },
  build: {
    target: 'esnext'
  }
});