import { auth } from './auth';
import { cardDesignBucket, cardDraftBucket, frameDesignBucket, frameDraftBucket } from './buckets';
import {
	API_VERSION,
	getDomainName,
	params,
	ssmPermissions,
	twitchClientId,
	twitchClientSecret,
} from './config';
import { database } from './database';
import { eventBus } from './events';
import { wsApi, wsConnectionsTable } from './websockets-api';

const baseDomain = getDomainName($app.stage);

const twitchApi = new sst.aws.ApiGatewayV2('TwitchAPI');

twitchApi.route('$default', {
	handler: 'packages/functions/src/twitch-api.handler',
	link: [params, twitchClientId, twitchClientSecret, database, eventBus],
	permissions: [ssmPermissions],
	runtime: 'nodejs22.x',
});

const adminApi = new sst.aws.ApiGatewayV2('AdminApi', {
	cors: {
		allowHeaders: ['content-type', 'authorization'],
		allowMethods: ['DELETE', 'POST', 'GET', 'PATCH'],
		allowOrigins:
			$dev == true
				? ['http://localhost:4321', 'http://localhost:4322']
				: [`https://${baseDomain}`],
	},
	domain:
		$dev === true
			? undefined
			: {
					name: `api.${baseDomain}`,
					path: API_VERSION,
				},
	transform: {
		route: {
			handler(args) {
				args.link = [
					params,
					twitchClientId,
					twitchClientSecret,
					database,
					eventBus,
					frameDraftBucket,
					cardDesignBucket,
					cardDraftBucket,
					frameDesignBucket,
					auth,
					twitchApi,
					wsApi,
					wsConnectionsTable,
				];

				args.permissions = [ssmPermissions];
				args.runtime = 'nodejs22.x';
			},
		},
	},
});

adminApi.route('POST /pack-type', 'packages/functions/src/admin-api/pack-type/post.handler');
adminApi.route('DELETE /pack-type', 'packages/functions/src/admin-api/pack-type/delete.handler');
adminApi.route('POST /season', 'packages/functions/src/admin-api/season/post.handler');
adminApi.route('DELETE /season', 'packages/functions/src/admin-api/season/delete.handler');
adminApi.route('PATCH /season', 'packages/functions/src/admin-api/season/patch.handler');
adminApi.route('POST /rarity', 'packages/functions/src/admin-api/rarity/post.handler');
adminApi.route('DELETE /rarity', 'packages/functions/src/admin-api/rarity/delete.handler');
adminApi.route('POST /admin-user', 'packages/functions/src/admin-api/admin-user/post.handler');
adminApi.route('DELETE /admin-user', 'packages/functions/src/admin-api/admin-user/delete.handler');
adminApi.route('GET /admin-user', 'packages/functions/src/admin-api/admin-user/get.handler');
adminApi.route('POST /pack', 'packages/functions/src/admin-api/pack/post.handler');
adminApi.route('PATCH /pack', 'packages/functions/src/admin-api/pack/patch.handler');
adminApi.route('DELETE /pack', 'packages/functions/src/admin-api/pack/delete.handler');
adminApi.route('PATCH /card', 'packages/functions/src/admin-api/card/patch.handler');
adminApi.route('POST /design', 'packages/functions/src/admin-api/design/post.handler');
adminApi.route('PATCH /design', 'packages/functions/src/admin-api/design/patch.handler');
adminApi.route('DELETE /design', 'packages/functions/src/admin-api/design/delete.handler');
adminApi.route('POST /site-config', 'packages/functions/src/admin-api/site-config/post.handler');
adminApi.route(
	'DELETE /unmatched-image',
	'packages/functions/src/admin-api/unmatched-image/delete.handler'
);
adminApi.route('GET /pack-count', 'packages/functions/src/admin-api/pack-count/get.handler');
adminApi.route(
	'POST /refresh-twitch-event-subscriptions',
	'packages/functions/src/admin-api/refresh-twitch-event-subscriptions.handler'
);
adminApi.route('POST /save-config', 'packages/functions/src/admin-api/save-config.handler');
adminApi.route('GET /stats', 'packages/functions/src/admin-api/stats.handler');
adminApi.route(
	'GET /twitch/chatters',
	'packages/functions/src/admin-api/twitch/chatters/get.handler'
);
adminApi.route('POST /preorder', 'packages/functions/src/admin-api/preorder/post.handler');
adminApi.route(
	'POST /convert-all-preorders-to-pack',
	'packages/functions/src/admin-api/convert-all-preorders-to-pack/post.handler'
);
adminApi.route('PATCH /faq', 'packages/functions/src/admin-api/faq/patch.handler');
adminApi.route('POST /moment-card', 'packages/functions/src/admin-api/moment-card/post.handler');

if ($dev === true && $app.stage !== 'prod' && $app.stage !== 'live') {
	adminApi.route('POST /purge-db', 'packages/functions/src/admin-api/purge-db.handler');
}
