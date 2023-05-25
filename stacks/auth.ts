import { type StackContext, use } from 'sst/constructs';
import { Auth as SSTAuth } from 'sst/constructs/future';
import { ConfigStack } from './config';
import { Database } from './database';

export function Auth({ stack }: StackContext) {
	const secrets = use(ConfigStack);
	const db = use(Database);

	const siteAuth = new SSTAuth(stack, 'AdminSiteAuth', {
		authenticator: {
			handler: 'packages/functions/src/auth.handler',
			bind: [
				secrets.TWITCH_CLIENT_ID,
				secrets.TWITCH_CLIENT_SECRET,
				db,
				secrets.STREAMER_USER_ID,
				secrets.STREAMER_ACCESS_TOKEN_ARN,
				secrets.STREAMER_REFRESH_TOKEN_ARN,
				secrets.DOMAIN_NAME,
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
