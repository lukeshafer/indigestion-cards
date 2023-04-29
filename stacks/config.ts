import { Secret } from 'aws-cdk-lib/aws-secretsmanager'
import type { StackContext } from 'sst/constructs'
import { Config } from 'sst/constructs'

export function ConfigStack({ stack }: StackContext) {
	const streamerAccessToken = new Secret(stack, 'StreamerAccessToken')
	const streamerRefreshToken = new Secret(stack, 'StreamerRefreshToken')

	const params = Config.Parameter.create(stack, {
		STREAMER_ACCESS_TOKEN_ARN: streamerAccessToken.secretArn,
		STREAMER_REFRESH_TOKEN_ARN: streamerRefreshToken.secretArn,
		STREAMER_USER_ID: '144313393',
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
