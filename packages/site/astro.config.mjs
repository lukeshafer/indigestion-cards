// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import aws from 'astro-sst';
//import prefetch from '@astrojs/prefetch';
import solid from '@astrojs/solid-js';
import { ecsstatic } from '@acab/ecsstatic/vite';

// https://astro.build/config
export default defineConfig({
	output: 'server',
	adapter: aws({
		serverRoutes: ['api/*'],
	}),
	integrations: [tailwind(), solid()],
	vite: {
		ssr: {
			external: ['electrodb'],
		},
		optimizeDeps: {
			exclude: ['sst'],
		},
		plugins: [ecsstatic()],
	},
});
