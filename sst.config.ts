/// <reference path="./.sst/platform/config.d.ts" />

const PROD_STAGE = 'live';

export default $config({
	app(input) {
		return {
			name: 'lil-indigestion-cards',
			removal: input?.stage === PROD_STAGE ? 'retain' : 'retain',
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
		if ($app.stage !== 'luke-v3') {
			throw new Error("Must use stage 'luke-v3'");
		}

		await import('./infra/config');
		await import('./infra/database');
		await import('./infra/websockets-api');
		await import('./infra/events');
		await import('./infra/auth');
		await import('./infra/buckets');
		await import('./infra/api');
    await import('./infra/image-processing');
    await import('./infra/minecraft');
    await import('./infra/site');
    await import('./infra/admin-site');
	},
});
