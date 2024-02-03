import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import type { StackContext } from 'sst/constructs';
import { Config } from 'sst/constructs';
import { getDomainName } from './constants';

export function ConfigStack({ stack, app }: StackContext) {
	const twitchTokens = new Secret(stack, 'TwitchTokens');

	const params = Config.Parameter.create(stack, {
		TWITCH_TOKENS_ARN: twitchTokens.secretArn,
    TWITCH_TOKENS_PARAM: `/sst/${app.name}/${app.stage}/Secret/TWITCH_TOKENS/value`,
		STREAMER_USER_ID: '227134852',
		DOMAIN_NAME: getDomainName(stack.stage),
	});

	const secrets = Config.Secret.create(stack, 'TWITCH_CLIENT_ID', 'TWITCH_CLIENT_SECRET');

	return {
		...params,
		...secrets,
	};
}
