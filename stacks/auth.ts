import { type StackContext, use } from 'sst/constructs'
import { Auth as SSTAuth } from 'sst/constructs/future'
import { ConfigStack } from './config'
import { Database } from './database'

export function Auth({ stack }: StackContext) {
	const secrets = use(ConfigStack)
	const db = use(Database)

	const siteAuth = new SSTAuth(stack, 'AdminSiteAuth', {
		authenticator: {
			handler: 'packages/functions/src/auth.handler',
			bind: [secrets.TWITCH_CLIENT_ID, secrets.TWITCH_CLIENT_SECRET, db],
		},
	})

	const streamerAuth = new SSTAuth(stack, 'StreamerAuth', {
		authenticator: {
			handler: 'packages/functions/src/streamer-auth.handler',
			bind: [
				secrets.TWITCH_CLIENT_ID,
				secrets.TWITCH_CLIENT_SECRET,
				secrets.STREAMER_ACCESS_TOKEN_NAME,
				secrets.STREAMER_REFRESH_TOKEN_NAME,
				db,
			],
			permissions: ['secretsmanager:GetSecretValue', 'secretsmanager:PutSecretValue'],
		},
	})

	stack.addOutputs({
		authEndpoint: siteAuth.url,
		streamerAuthEndpoint: streamerAuth.url,
	})

	return {
		siteAuth,
		streamerAuth,
	}
}
