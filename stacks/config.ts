import type { StackContext } from 'sst/constructs'
import { Config } from 'sst/constructs'

export function ConfigStack({ stack }: StackContext) {
	const secrets = Config.Secret.create(
		stack,
		'TWITCH_CLIENT_ID',
		'TWITCH_CLIENT_SECRET',
		'TWITCH_ACCESS_TOKEN'
	)

	return secrets
}
