import { StackContext, AstroSite, use } from 'sst/constructs';
import { Database } from './database';
import { API } from './api';
import { DesignBucket } from './bucket';
import { Auth } from './auth';
import { ConfigStack } from './config';
import { HOSTED_ZONE, getDomainName } from './constants';

export function Sites({ app, stack }: StackContext) {
	const table = use(Database);
	const { api, twitchApi } = use(API);
	const { frameBucket, cardDesignBucket, frameDraftBucket, cardDraftBucket } = use(DesignBucket);
	const { siteAuth } = use(Auth);
	const { TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET, STREAMER_USER_ID, APP_ACCESS_TOKEN_ARN, TWITCH_TOKENS_ARN } =
		use(ConfigStack);

	const baseDomain = getDomainName(stack.stage);

	const adminSite = new AstroSite(stack, 'admin', {
		path: 'packages/site',
		bind: [
			table,
			api,
			twitchApi,
			frameBucket,
			cardDesignBucket,
			frameDraftBucket,
			cardDraftBucket,
			siteAuth,
			TWITCH_CLIENT_ID,
			TWITCH_CLIENT_SECRET,
			APP_ACCESS_TOKEN_ARN,
			STREAMER_USER_ID,
			TWITCH_TOKENS_ARN,
		],
		customDomain: app.mode === 'dev' ? undefined : {
			domainName: baseDomain,
			hostedZone: HOSTED_ZONE,
		},
		permissions: ['secretsmanager:GetSecretValue', 'secretsmanager:PutSecretValue'],
	});

	// TODO: add cron job to check twitch for users who have updated their username

	stack.addOutputs({
		AdminUrl: adminSite.url,
	});
}
