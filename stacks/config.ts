import { Secret } from 'aws-cdk-lib/aws-secretsmanager'
import type { StackContext } from 'sst/constructs'
import { Config } from 'sst/constructs'

export function ConfigStack({ stack }: StackContext) {
	const streamerAccessToken = new Secret(stack, 'StreamerAccessToken')
	const streamerRefreshToken = new Secret(stack, 'StreamerRefreshToken')

	const params = Config.Parameter.create(stack, {
		STREAMER_ACCESS_TOKEN_NAME: streamerAccessToken.secretName,
		STREAMER_REFRESH_TOKEN_NAME: streamerRefreshToken.secretName,
	})

	const secrets = Config.Secret.create(
		stack,
		'TWITCH_CLIENT_ID',
		'TWITCH_CLIENT_SECRET',
		'TWITCH_ACCESS_TOKEN'
	)

	return {
		...params,
		...secrets,
	}
}
