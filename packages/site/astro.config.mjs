// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import aws from 'astro-sst/lambda';
import prefetch from '@astrojs/prefetch';

import alpinejs from "@astrojs/alpinejs";

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: aws(),
  integrations: [tailwind(), alpinejs()],
  //, prefetch()],
  experimental: {
    middleware: true
  },
  vite: {
    ssr: {
      external: ['electrodb']
    },
    optimizeDeps: {
      exclude: ['sst']
    }
  }
});