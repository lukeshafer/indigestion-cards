import { defineConfig } from '@solidjs/start/config';
import { searchForWorkspaceRoot } from 'vite';
import path from 'path'
import { ecsstatic } from '@acab/ecsstatic/vite';

console.log('loading config');
export default defineConfig({
	resolve: {
		alias: {
			'@lib': path.resolve(__dirname, '../core/src/lib'),
		},
	},
	server: {
		fs: {
			allow: [searchForWorkspaceRoot(process.cwd()), 'node_modules/'],
		},
	},
	ssr: {
		external: ['electrodb'],
		noExternal: [],
	},
	optimizeDeps: {
		exclude: ['sst'],
	},
	plugins: [ecsstatic()]
});
