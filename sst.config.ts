/// <reference path="./.sst/platform/config.d.ts" />

const PROD_STAGE = 'live';

export default $config({
	app(input) {
		return {
			name: 'lil-indigestion-cards',
			removal: input?.stage === PROD_STAGE ? 'retain' : 'remove',
			protect: [PROD_STAGE].includes(input?.stage),
			home: 'aws',
			providers: {
				aws: {
					region: 'us-east-2',
				},
			},
		};
	},
	async run() {
		await import('./infra/config');
		await import('./infra/database');
	},
});
