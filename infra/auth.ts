import { params, ssmPermissions, twitchClientId, twitchClientSecret } from './config';
import { database } from './database';
import { eventBus } from './events';

export const auth = new sst.aws.Auth('SiteAuth', {
	issuer: {
		handler: 'packages/functions/src/auth/issuer.handler',
		link: [params, database, twitchClientSecret, twitchClientId, eventBus],
		permissions: [ssmPermissions],
		runtime: 'nodejs22.x',
	},
});
