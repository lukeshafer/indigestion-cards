import { StackContext, Api, use } from 'sst/constructs';
import { Database } from './database';
import { Events } from './events';
import { DesignBucket } from './bucket';
import { ConfigStack } from './config';
import { Auth } from './auth';
import { API_VERSION, HOSTED_ZONE, getDomainName } from './constants';

export function API({ app, stack }: StackContext) {
	const table = use(Database);
	const eventBus = use(Events);
	const { frameBucket, cardDesignBucket, cardDraftBucket, frameDraftBucket } = use(DesignBucket);
	const config = use(ConfigStack);
	const { siteAuth } = use(Auth);

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
					config.APP_ACCESS_TOKEN_ARN,
					table,
					eventBus,
				],
				permissions: ['secretsmanager:GetSecretValue', 'secretsmanager:PutSecretValue'],
			},
		},
	});

	const api = new Api(stack, 'api', {
		routes: {
			'DELETE /delete-unmatched-image':
				'packages/functions/src/admin-api/delete-unmatched-image.handler',
			'DELETE /delete-rarity-frame':
				'packages/functions/src/admin-api/delete-rarity-frame.handler',
			'DELETE /delete-card-image':
				'packages/functions/src/admin-api/delete-card-image.handler',
			'POST /refresh-twitch-event-subscriptions':
				'packages/functions/src/admin-api/refresh-twitch-event-subscriptions.handler',
			'POST /save-config': 'packages/functions/src/admin-api/save-config.handler',
			...(app.stage === 'luke'
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
					config.STREAMER_ACCESS_TOKEN_ARN,
					config.STREAMER_REFRESH_TOKEN_ARN,
					config.APP_ACCESS_TOKEN_ARN,
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
			},
		},
		cors: {
			allowCredentials: false,
			allowHeaders: ['content-type'],
			allowMethods: ['ANY'],
			allowOrigins:
				app.stage === 'luke'
					? ['http://localhost:3000', `https://${baseDomain}`]
					: [`https://${baseDomain}`],
		},
		customDomain: {
			domainName: `api.${baseDomain}`,
			path: API_VERSION,
			hostedZone: HOSTED_ZONE,
		},
	});

	stack.addOutputs({
		ApiEndpoint: api.url,
		TwitchApiEndpoint: twitchApi.url,
	});

	return { api, twitchApi };
}
