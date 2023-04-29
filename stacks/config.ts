import { Secret } from 'aws-cdk-lib/aws-secretsmanager'
import type { StackContext } from 'sst/constructs'
import { Config } from 'sst/constructs'

export function ConfigStack({ stack }: StackContext) {
	const streamerAccessToken = new Secret(stack, 'StreamerAccessToken')
	const streamerRefreshToken = new Secret(stack, 'StreamerRefreshToken')
	const streamerAuthState = new Secret(stack, 'StreamerAuthState')

	const params = Config.Parameter.create(stack, {
		STREAMER_AUTH_STATE_ARN: streamerAuthState.secretArn,
		STREAMER_ACCESS_TOKEN_ARN: streamerAccessToken.secretArn,
		STREAMER_REFRESH_TOKEN_ARN: streamerRefreshToken.secretArn,
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
