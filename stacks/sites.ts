import { StackContext, AstroSite, use } from 'sst/constructs';
import { Database } from './database';
import { API } from './api';
import { DesignBucket } from './bucket';
import { Auth } from './auth';
import { ConfigStack } from './config';
import { getDomainName } from './constants';

export function Sites({ stack }: StackContext) {
	const table = use(Database);
	const { api, twitchApi } = use(API);
	const { frameBucket, cardDesignBucket } = use(DesignBucket);
	const { siteAuth } = use(Auth);
	const { TWITCH_CLIENT_ID, STREAMER_USER_ID, APP_ACCESS_TOKEN_ARN } = use(ConfigStack);

	const baseDomain = getDomainName(stack.stage);

	const adminSite = new AstroSite(stack, 'admin', {
		path: 'packages/site',
		bind: [
			table,
			api,
			twitchApi,
			frameBucket,
			cardDesignBucket,
			siteAuth,
			TWITCH_CLIENT_ID,
			APP_ACCESS_TOKEN_ARN,
			STREAMER_USER_ID,
		],
		customDomain: {
			domainName: baseDomain,
			hostedZone: 'lksh.dev',
		},
		permissions: ['secretsmanager:GetSecretValue', 'secretsmanager:PutSecretValue'],
	});

	// TODO: add cron job to check twitch for users who have updated their username

	stack.addOutputs({
		AdminUrl: adminSite.url,
	});
}
