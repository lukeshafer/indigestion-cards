import { defineConfig } from '@solidjs/start/config';
import path from 'node:path';

export default defineConfig({
	middleware: './src/middleware.ts',
	server: {
		preset: 'aws-lambda',
		output: {
			dir: 'dist',
			publicDir: 'dist/client',
		},
		esbuild: {
			options: {
				target: 'esnext',
				treeShaking: true,
			},
		},
	},
	vite: {
		ssr: {
			external: ['electrodb'],
		},
		optimizeDeps: {
			exclude: [
				'sst',
				'@aws-sdk/client-apigatewaymanagementapi',
				'@aws-sdk/client-dynamodb',
				'@aws-sdk/client-eventbridge',
				'@aws-sdk/client-s3',
				'@aws-sdk/client-ssm',
			],
		},
		resolve: {
			alias: {
				'@site': path.resolve(process.cwd(), 'src'),
				'@core/lib': path.resolve(process.cwd(), '../core/src/lib'),
			},
		},
	},
});
