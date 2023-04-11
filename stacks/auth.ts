import { type StackContext, use, Auth } from 'sst/constructs'
import { ConfigStack } from './config'

export function AuthStack({ stack }: StackContext) {
	const secrets = use(ConfigStack)

	const auth = new Auth(stack, 'AdminAuth', {
		authenticator: {
			handler: 'packages/functions/src/auth.handler',
			bind: [secrets.TWITCH_CLIENT_ID, secrets.TWITCH_CLIENT_SECRET],
		},
	})

	return auth
}
