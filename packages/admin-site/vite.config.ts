import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';
import path from 'path';

export default defineConfig({
	resolve: {
		alias: {
			'@lil-indigestion-cards/core': path.resolve(__dirname, '../core/src'),
		},
	},

	plugins: [solid()],
});
