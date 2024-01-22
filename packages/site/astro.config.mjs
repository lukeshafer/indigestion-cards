// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import aws from 'astro-sst';
import solid from '@astrojs/solid-js';
import icon from 'astro-icon';

// https://astro.build/config
export default defineConfig({
	output: 'server',
    // @ts-expect-error until the SST adapter is updated for Astro 4
	adapter: aws({
		serverRoutes: ['api/*', 'trades/*'],
		//responseMode: 'stream',
	}),
	integrations: [tailwind(), 
    // @ts-expect-error until the solid integration is updated for Astro 4
    solid(), 
    // @ts-expect-error until the astro-icon integration is updated for Astro 4
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
