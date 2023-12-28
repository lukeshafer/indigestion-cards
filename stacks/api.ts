import { StackContext, Api, use } from 'sst/constructs';
import { Database } from './database';
import { Events } from './events';
import { DesignBucket } from './bucket';
import { ConfigStack } from './config';
import { Auth } from './auth';
import { API_VERSION, getHostedZone, getDomainName } from './constants';

export function API({ app, stack }: StackContext) {
	const table = use(Database);
	const eventBus = use(Events);
	const { frameBucket, cardDesignBucket, cardDraftBucket, frameDraftBucket } = use(DesignBucket);
	const config = use(ConfigStack);
	const { siteAuth } = use(Auth);

	const hostedZone = getHostedZone(app.stage);
	const baseDomain = getDomainName(app.stage);

	const twitchApi = new Api(stack, 'twitchApi', {
		routes: {
			'ANY /': 'packages/functions/src/twitch-api.handler',
		},
		defaults: {
			function: {
				bind: [
					config.TWITCH_CLIENT_ID,
					config.TWITCH_CLIENT_SECRET,
					config.TWITCH_TOKENS_ARN,
					table,
					eventBus,
				],
				permissions: ['secretsmanager:GetSecretValue', 'secretsmanager:PutSecretValue'],
				runtime: 'nodejs18.x',
			},
		},
	});

	const adminApi = new Api(stack, 'AdminApi', {
		routes: {
			// PACK TYPE
			'POST /pack-type': 'packages/functions/src/admin-api/pack-type/post.handler',
			'DELETE /pack-type': 'packages/functions/src/admin-api/pack-type/delete.handler',
			// SEASON
			'POST /season': 'packages/functions/src/admin-api/season/post.handler',
			'DELETE /season': 'packages/functions/src/admin-api/season/delete.handler',
			'PATCH /season': 'packages/functions/src/admin-api/season/patch.handler',
			// RARITY
			'POST /rarity': 'packages/functions/src/admin-api/rarity/post.handler',
			'DELETE /rarity': 'packages/functions/src/admin-api/rarity/delete.handler',
			// ADMIN USER
			'POST /admin-user': 'packages/functions/src/admin-api/admin-user/post.handler',
			'DELETE /admin-user': 'packages/functions/src/admin-api/admin-user/delete.handler',
			'GET /admin-user': 'packages/functions/src/admin-api/admin-user/get.handler',
			// PACK
			'POST /pack': 'packages/functions/src/admin-api/pack/post.handler',
			'PATCH /pack': 'packages/functions/src/admin-api/pack/patch.handler',
			'DELETE /pack': 'packages/functions/src/admin-api/pack/delete.handler',
			// CARD
			'PATCH /card': 'packages/functions/src/admin-api/card/patch.handler',
			// DESIGN
			'POST /design': 'packages/functions/src/admin-api/design/post.handler',
			'PATCH /design': 'packages/functions/src/admin-api/design/patch.handler',
			'DELETE /design': 'packages/functions/src/admin-api/design/delete.handler',
			// SITE-CONFIG
			'POST /site-config': 'packages/functions/src/admin-api/site-config/post.handler',
			// UNMATCHED IMAGE
			'DELETE /unmatched-image':
				'packages/functions/src/admin-api/unmatched-image/delete.handler',
			// PACK COUNT
			'GET /pack-count': 'packages/functions/src/admin-api/pack-count/get.handler',
			// OTHER
			'POST /refresh-twitch-event-subscriptions':
				'packages/functions/src/admin-api/refresh-twitch-event-subscriptions.handler',
			'POST /save-config': 'packages/functions/src/admin-api/save-config.handler',
			// STATS
			'GET /stats': 'packages/functions/src/admin-api/stats.handler',
			// TWITCH
			'GET /twitch/chatters': 'packages/functions/src/admin-api/twitch/chatters/get.handler',
			...(app.mode === 'dev' && app.stage !== 'prod'
				? {
						'POST /purge-db': 'packages/functions/src/admin-api/purge-db.handler',
				  }
				: {}),
			// PREORDER
			'POST /preorder': 'packages/functions/src/admin-api/preorder/post.handler',
			// CONVERT-PREORDERS-TO-PACKS
			'POST /convert-all-preorders-to-pack':
				'packages/functions/src/admin-api/convert-all-preorders-to-pack/post.handler',

			// USER ENDPOINTS
			// USER
			'PATCH /user-api/user': 'packages/functions/src/user-api/user/patch.handler',
			// CARD
			'GET /user-api/card': 'packages/functions/src/user-api/card/get.handler',
		},
		defaults: {
			function: {
				bind: [
					config.TWITCH_CLIENT_ID,
					config.TWITCH_CLIENT_SECRET,
					config.TWITCH_TOKENS_ARN,
					config.STREAMER_USER_ID,
					table,
					eventBus,
					frameBucket,
					cardDesignBucket,
					cardDraftBucket,
					frameDraftBucket,
					siteAuth,
					twitchApi,
				],
				permissions: ['secretsmanager:GetSecretValue', 'secretsmanager:PutSecretValue'],
				runtime: 'nodejs18.x',
			},
		},
		cors: {
			allowHeaders: ['content-type', 'authorization'],
			allowMethods: ['DELETE', 'POST', 'GET', 'PATCH'],
			allowOrigins:
				app.mode === 'dev'
					? ['http://localhost:4321', 'http://localhost:5173']
					: [`https://${baseDomain}`],
		},
		customDomain:
			app.mode === 'dev'
				? undefined
				: {
						domainName: `api.${baseDomain}`,
						path: API_VERSION,
						hostedZone: hostedZone,
				  },
	});

	stack.addOutputs({
		ApiEndpoint: adminApi.url,
		TwitchApiEndpoint: twitchApi.url,
	});

	return { adminApi, twitchApi };
}
