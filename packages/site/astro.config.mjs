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
	redirects: {
		'/admin/open-packs': '/open-packs',
		'/card': '/cards',
		'/card/[designId]': '/cards/[designId]',
		'/card/[...instanceSlug]': '/cards/[...instanceSlug]',
		'/user': '/users',
		'/user/[username]': '/users/[username]',
		'/user/[...userInstanceSlug]': '/users/[...userInstanceSlug]',
	},
});
