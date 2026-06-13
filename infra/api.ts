import { auth } from './auth';
import { cardDesignBucket, cardDraftBucket, frameDesignBucket, frameDraftBucket } from './buckets';
import {
	API_VERSION,
	domainName,
	params,
	resolveDomain,
	ssmPermissions,
	twitchClientId,
	twitchClientSecret,
} from './config';
import { database } from './database';
import { eventBus } from './events';
import { wsApi, wsConnectionsTable } from './websockets-api';

export const twitchApi = new sst.aws.ApiGatewayV2('TwitchAPI');

twitchApi.route('$default', {
	handler: 'packages/functions/src/twitch-api.handler',
	link: [params, twitchClientId, twitchClientSecret, database, eventBus],
	permissions: [ssmPermissions],
	runtime: 'nodejs24.x',
});

export const adminApi = new sst.aws.ApiGatewayV2('AdminApi', {
	cors: {
		allowHeaders: ['content-type', 'authorization'],
		allowMethods: ['DELETE', 'POST', 'GET', 'PATCH'],
		allowOrigins:
			$dev == true
				? ['http://localhost:4321', 'http://localhost:4322']
				: [`https://${domainName}`],
	},
	domain: resolveDomain(`api.${domainName}`, API_VERSION),
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
				args.runtime = 'nodejs24.x';
			},
		},
	},
});

adminApi.route('GET /stats', 'packages/functions/src/admin-api/stats.handler');
adminApi.route(
	'GET /twitch/chatters',
	'packages/functions/src/admin-api/twitch/chatters/get.handler'
);
