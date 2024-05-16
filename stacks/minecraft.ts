import { StackContext, Api, use } from 'sst/constructs';
import { Database } from './database';
import { DesignBucket } from './bucket';
import { getHostedZone, getDomainName } from './constants';

export function Minecraft({ app, stack }: StackContext) {
	const table = use(Database);
	const { frameBucket, cardDesignBucket } = use(DesignBucket);

	const hostedZone = getHostedZone(app.stage);
	const baseDomain = getDomainName(app.stage);

	const minecraftApi = new Api(stack, 'MinecraftApi', {
		routes: {
			'GET /cards/by-id': 'packages/functions/src/minecraft/cards-by-id.handler',
		},
		defaults: {
			function: {
				bind: [table, frameBucket, cardDesignBucket],
				runtime: 'nodejs18.x',
			},
		},
		customDomain:
			app.mode === 'dev'
				? undefined
				: {
						domainName: `minecraft.api.${baseDomain}`,
						path: 'v1',
						hostedZone: hostedZone,
					},
	});

	stack.addOutputs({
		MinecraftApiEndpoint: minecraftApi.url,
	});

	return { minecraftApi };
}
