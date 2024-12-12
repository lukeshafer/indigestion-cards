// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import aws from 'astro-sst';
import solid from '@astrojs/solid-js';
import icon from 'astro-icon';

// https://astro.build/config
export default defineConfig({
	prefetch: {
		prefetchAll: true,
	},
	output: 'server',
	adapter: aws({
		serverRoutes: ['api/*', 'trades/*', '_actions/*'],
	}),
	integrations: [tailwind(), solid(), icon()],
	vite: {
		ssr: {
			external: ['electrodb'],
		},
		optimizeDeps: {
			exclude: ['sst'],
		},
	},
});
