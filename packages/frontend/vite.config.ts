import solid from 'solid-start/vite';
import aws from 'solid-start-sst';
import { defineConfig } from 'vite';
import { ecsstatic } from '@acab/ecsstatic/vite';

export default defineConfig({
	plugins: [solid({ adapter: aws() }), ecsstatic()],
	ssr: {
		noExternal: [
			'@kobalte/core',
			'@internationalized/message',
			'solid-markdown',
			'solid-icons',
		],
	},
	optimizeDeps: {
		exclude: ['sst'],
	},
});
