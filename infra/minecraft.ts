import { cardDesignBucket, frameDesignBucket } from './buckets';
import { domainName } from './config';
import { database } from './database';
import { cardCDN } from './image-processing';

export const minecraftApi = new sst.aws.ApiGatewayV2('MinecraftApi', {
	domain:
		$dev === true
			? undefined
			: {
					name: `minecraft.api.${domainName}`,
					path: 'v1',
				},
});

minecraftApi.route('GET /card/{username}/{designId}/{rarityId}/{cardNumber}/card.png', {
	handler: 'packages/functions/src/minecraft/get-card-image.handler',
	copyFiles: [{ from: 'packages/functions/src/minecraft/fonts', to: 'fonts' }],
	environment: { CARD_CDN_URL: cardCDN.url },
	link: [database, frameDesignBucket, cardDesignBucket],
});

minecraftApi.route('GET /usercards/{username}', {
	handler: 'packages/functions/src/minecraft/get-user-cards.handler',
	link: [database],
});
