import { StackContext, Api, use } from 'sst/constructs';
import { Database } from './database';
import { DesignBucket } from './bucket';
import { getHostedZone, getDomainName } from './constants';
import { ImageProcessing } from './image-processing';

export function Minecraft({ app, stack }: StackContext) {
	const { table } = use(Database);
	const { frameBucket, cardDesignBucket } = use(DesignBucket);
	const { cardCDN } = use(ImageProcessing);

	const hostedZone = getHostedZone(app.stage);
	const baseDomain = getDomainName(app.stage);

	const minecraftApi = new Api(stack, 'MinecraftApi', {
		routes: {
			'GET /card/{username}/{designId}/{rarityId}/{cardNumber}/card.png': {
				function: {
					handler: 'packages/functions/src/minecraft/get-card-image.handler',
					copyFiles: [{ from: 'packages/functions/src/minecraft/fonts', to: 'fonts' }],
					environment: { CARD_CDN_URL: cardCDN.domainName },
					bind: [table, frameBucket, cardDesignBucket],
				},
			},
			'GET /usercards/{username}': {
				function: {
					handler: 'packages/functions/src/minecraft/get-user-cards.handler',
					bind: [table],
				},
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
