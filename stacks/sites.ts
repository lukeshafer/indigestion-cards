import { StackContext, AstroSite, use } from 'sst/constructs';
import { Database } from './database';
import { API } from './api';
import { DesignBucket } from './bucket';
import { Auth } from './auth';
import { ConfigStack } from './config';
import { Events } from './events';
import { getHostedZone, getDomainName } from './constants';

export function Sites({ app, stack }: StackContext) {
	const table = use(Database);
	const { adminApi, twitchApi } = use(API);
	const { frameBucket, cardDesignBucket, frameDraftBucket, cardDraftBucket } = use(DesignBucket);
	const { siteAuth } = use(Auth);
	const bus = use(Events);
	const config = use(ConfigStack);
	const hostedZone = getHostedZone(stack.stage);

	const baseDomain = getDomainName(stack.stage);

	const site = new AstroSite(stack, 'site', {
		path: 'packages/site',
		//dev: {
		//deploy: true,
		//},
		bind: [
			table,
			adminApi,
			twitchApi,
			frameBucket,
			cardDesignBucket,
			frameDraftBucket,
			cardDraftBucket,
			siteAuth,
			config.TWITCH_CLIENT_ID,
			config.TWITCH_CLIENT_SECRET,
			config.STREAMER_USER_ID,
			config.TWITCH_TOKENS_ARN, // can remove after updates
			config.TWITCH_TOKENS_PARAM,
			config.DOMAIN_NAME,
			bus,
		],
		customDomain:
			app.mode === 'dev'
				? undefined
				: {
						domainName: baseDomain,
						hostedZone: hostedZone,
					},
		permissions: [
			'secretsmanager:GetSecretValue',
			'secretsmanager:PutSecretValue',
			'ssm:GetParameter',
			'ssm:PutParameter',
		],
		runtime: 'nodejs18.x',
	});

	stack.addOutputs({
		SiteUrl: site.url,
	});
}
