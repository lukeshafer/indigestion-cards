import { defineConfig } from '@solidjs/start/config';

console.log('loading config')
export default defineConfig({
	//start: {
		//server: {
			//preset: 'aws-lambda',
		//},
	//},
	ssr: {
		noExternal: [
		],
	},
	optimizeDeps: {
		exclude: ['sst'],
	},
});
