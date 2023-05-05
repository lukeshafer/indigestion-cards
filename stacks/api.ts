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
	const { frameBucket, cardDesignBucket } = use(DesignBucket);
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
					config.TWITCH_ACCESS_TOKEN,
					table,
					eventBus,
				],
			},
		},
	});

	const api = new Api(stack, 'api', {
		routes: {
			'POST /add-new-pack-to-queue':
				'packages/functions/src/admin-api/invoke-give-pack-event.handler',
			'POST /give-pack-to-user':
				'packages/functions/src/admin-api/give-pack-to-user-api.handler',
			'POST /create-card-season':
				'packages/functions/src/admin-api/create-card-season.handler',
			'POST /create-card-design':
				'packages/functions/src/admin-api/create-card-design.handler',
			'POST /create-rarity': 'packages/functions/src/admin-api/create-rarity.handler',
			'POST /create-pack-type': 'packages/functions/src/admin-api/create-pack-type.handler',
			'POST /delete-card-design/{seasonId}/{designId}':
				'packages/functions/src/admin-api/delete-card-design.handler',
			'POST /delete-card-season/{id}':
				'packages/functions/src/admin-api/delete-card-season.handler',
			'POST /delete-unmatched-image/{id}':
				'packages/functions/src/admin-api/delete-unmatched-image.handler',
			'POST /delete-rarity/{id}': 'packages/functions/src/admin-api/delete-rarity.handler',
			'POST /create-admin-user': 'packages/functions/src/admin-api/create-admin-user.handler',
			'POST /delete-admin-user': 'packages/functions/src/admin-api/delete-admin-user.handler',
			'POST /revoke-pack': 'packages/functions/src/admin-api/revoke-pack.handler',
			'POST /open-card': 'packages/functions/src/admin-api/open-card.handler',
			'POST /purge-db': 'packages/functions/src/admin-api/purge-db.handler',
			'GET /get-all-channel-point-rewards':
				'packages/functions/src/admin-api/get-all-channel-point-rewards.handler',
			'POST /save-config': 'packages/functions/src/admin-api/save-config.handler',
			'POST /update-rarity': 'packages/functions/src/admin-api/update-rarity.handler',
			'ANY /{proxy+}': 'packages/functions/src/admin-api.handler',
		},
		defaults: {
			function: {
				bind: [
					config.TWITCH_CLIENT_ID,
					config.TWITCH_CLIENT_SECRET,
					config.TWITCH_ACCESS_TOKEN,
					config.STREAMER_ACCESS_TOKEN_ARN,
					config.STREAMER_REFRESH_TOKEN_ARN,
					config.STREAMER_USER_ID,
					table,
					eventBus,
					frameBucket,
					cardDesignBucket,
					siteAuth,
				],
				permissions: ['secretsmanager:GetSecretValue', 'secretsmanager:PutSecretValue'],
			},
		},
		cors: {
			allowCredentials: true,
			allowHeaders: ['content-type'],
			allowMethods: ['ANY'],
			allowOrigins: ['http://localhost:3000', `https://${baseDomain}`],
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
