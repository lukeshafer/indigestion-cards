import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import type { StackContext } from 'sst/constructs';
import { Config } from 'sst/constructs';
import { getDomainName } from './constants';

export function ConfigStack({ stack }: StackContext) {
	const streamerAccessToken = new Secret(stack, 'StreamerAccessToken');
	const streamerRefreshToken = new Secret(stack, 'StreamerRefreshToken');
	const appAccessToken = new Secret(stack, 'AppAccessToken');

	const params = Config.Parameter.create(stack, {
		STREAMER_ACCESS_TOKEN_ARN: streamerAccessToken.secretArn,
		STREAMER_REFRESH_TOKEN_ARN: streamerRefreshToken.secretArn,
		APP_ACCESS_TOKEN_ARN: appAccessToken.secretArn,
		STREAMER_USER_ID: '227134852',
		DOMAIN_NAME: getDomainName(stack.stage),
	});

	const secrets = Config.Secret.create(stack, 'TWITCH_CLIENT_ID', 'TWITCH_CLIENT_SECRET');

	return {
		...params,
		...secrets,
	};
}
