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

	const api = new Api(stack, 'api', {
		routes: {
			'POST /pack-type': 'packages/functions/src/admin-api/pack-type/post.handler',
			'DELETE /pack-type': 'packages/functions/src/admin-api/pack-type/delete.handler',
			'DELETE /delete-unmatched-image':
				'packages/functions/src/admin-api/delete-unmatched-image.handler',
			'DELETE /delete-rarity-frame':
				'packages/functions/src/admin-api/delete-rarity-frame.handler',
			'DELETE /delete-card-image':
				'packages/functions/src/admin-api/delete-card-image.handler',
			'POST /refresh-twitch-event-subscriptions':
				'packages/functions/src/admin-api/refresh-twitch-event-subscriptions.handler',
			'POST /save-config': 'packages/functions/src/admin-api/save-config.handler',
			...(app.mode === 'dev' && app.stage !== 'prod'
				? {
					'POST /purge-db': 'packages/functions/src/admin-api/purge-db.handler',
				}
				: {}),
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
			allowCredentials: true,
			allowHeaders: ['content-type'],
			allowMethods: ['ANY'],
			allowOrigins:
				app.mode === 'dev' ? ['http://localhost:3000'] : [`https://${baseDomain}`],
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
		ApiEndpoint: api.url,
		TwitchApiEndpoint: twitchApi.url,
	});

	return { api, twitchApi };
}
