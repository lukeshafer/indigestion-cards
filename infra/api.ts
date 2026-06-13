import { params, ssmPermissions, twitchClientId, twitchClientSecret } from './config';
import { database } from './database';
import { eventBus } from './events';

export const twitchApi = new sst.aws.ApiGatewayV2('TwitchAPI');

twitchApi.route('$default', {
	handler: 'packages/functions/src/twitch-api.handler',
	link: [params, twitchClientId, twitchClientSecret, database, eventBus],
	permissions: [ssmPermissions],
	runtime: 'nodejs24.x',
});
