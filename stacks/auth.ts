import { type StackContext, use } from 'sst/constructs'
import { Auth as SSTAuth } from 'sst/constructs/future'
import { ConfigStack } from './config'

export function Auth({ stack }: StackContext) {
	const secrets = use(ConfigStack)

	const auth = new SSTAuth(stack, 'AdminSiteAuth', {
		authenticator: {
			handler: 'packages/functions/src/auth.handler',
			bind: [secrets.TWITCH_CLIENT_ID, secrets.TWITCH_CLIENT_SECRET],
		},
	})

	stack.addOutputs({
		authEndpoint: auth.url,
	})

	return auth
}
