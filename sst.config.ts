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
		if (!$app.stage.startsWith('luke')) {
			throw new Error("Stage name must start with 'luke'");
		}

		await Promise.all([
			// no deps
			import('./infra/websockets-api'),
			import('./infra/config'),
		]);

		await Promise.all([
			// needs config
			import('./infra/database'),
		]);

		const [imageProcessing] = await Promise.all([
			// needs database
			import('./infra/image-processing'),
			import('./infra/events'),
			import('./infra/buckets'),
		]);

		await Promise.all([
			// needs events / image-processing
			import('./infra/auth'),
			import('./infra/minecraft'),
		]);

		await Promise.all([
			// needs auth
			import('./infra/api'),
		]);

		await Promise.all([
			// needs api
			import('./infra/site'),
			import('./infra/admin-site'),
		]);

    return {
      CardsCDN: $interpolate`https://${imageProcessing.cardsCDN.domainName}`
    }
	},
});
