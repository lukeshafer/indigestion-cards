import { defineConfig } from '@solidjs/start/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@lil-indigestion-cards/core': path.resolve(__dirname, '../core/src'),
      '@lib': path.resolve(__dirname, '../core/src/lib'),
    },
  },
  server: {
    fs: {
      allow: [path.resolve(__dirname, '../../')],
    },
  },
  ssr: {
    external: ['electrodb'],
  },
  optimizeDeps: {
    exclude: ['sst'],
  },
});
