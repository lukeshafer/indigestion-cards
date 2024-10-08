// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import aws from 'astro-sst';
import solid from '@astrojs/solid-js';
import icon from 'astro-icon';

// https://astro.build/config
export default defineConfig({
	output: 'server',
	adapter: aws({
		serverRoutes: ['api/*', 'trades/*'],
	}),
	integrations: [tailwind(), 
    solid(), 
    icon()],
	vite: {
		ssr: {
			external: ['electrodb'],
		},
		optimizeDeps: {
			exclude: ['sst'],
		},
	},
});
