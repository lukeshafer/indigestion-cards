import { type StackContext, use } from 'sst/constructs';
import { Auth as SSTAuth } from 'sst/constructs/future';
import { Events } from './events';
import { ConfigStack } from './config';
import { Database } from './database';

export function Auth({ stack }: StackContext) {
	const config = use(ConfigStack);
	const db = use(Database);
	const events = use(Events);

	const siteAuth = new SSTAuth(stack, 'AdminSiteAuth', {
		authenticator: {
			handler: 'packages/functions/src/auth.handler',
			bind: [
				config.TWITCH_CLIENT_ID,
				config.TWITCH_CLIENT_SECRET,
				db,
				config.STREAMER_USER_ID,
				//config.STREAMER_ACCESS_TOKEN_ARN,
				//config.STREAMER_REFRESH_TOKEN_ARN,
				config.TWITCH_TOKENS_ARN,
				config.DOMAIN_NAME,
				events,
			],
			permissions: ['secretsmanager:GetSecretValue', 'secretsmanager:PutSecretValue'],
		},
	});

	stack.addOutputs({
		authEndpoint: siteAuth.url,
	});

	return {
		siteAuth,
	};
}
