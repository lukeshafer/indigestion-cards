// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import aws from 'astro-sst/lambda';
//import prefetch from '@astrojs/prefetch';
import solid from '@astrojs/solid-js';

// https://astro.build/config
export default defineConfig({
	output: 'server',
	build: {
		inlineStylesheets: 'always',
	},
	adapter: aws(),
	integrations: [tailwind(), solid()],
	experimental: {
		viewTransitions: true,
	},
	vite: {
		ssr: {
			external: ['electrodb'],
		},
		optimizeDeps: {
			exclude: ['sst'],
		},
	},
});
