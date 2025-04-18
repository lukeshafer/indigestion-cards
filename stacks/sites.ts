import { StackContext, AstroSite, use } from 'sst/constructs';
import { Database } from './database';
import { API } from './api';
import { DesignBucket } from './bucket';
import { Auth } from './auth';
import { ConfigStack } from './config';
import { Events } from './events';
import { getHostedZone, getDomainName } from './constants';
import { ImageProcessing } from './image-processing';
import { WebsocketsAPI } from './websockets-api';

export function Sites({ app, stack }: StackContext) {
	const { table, dataSummaries } = use(Database);
	const { adminApi, twitchApi } = use(API);
	const { frameBucket, cardDesignBucket, frameDraftBucket, cardDraftBucket } = use(DesignBucket);
	const { siteAuth } = use(Auth);
	const { eventBus } = use(Events);
  const { wsApi } = use(WebsocketsAPI)
	const config = use(ConfigStack);
	const { cardCDN, adminImageSecret } = use(ImageProcessing);

	const hostedZone = getHostedZone(stack.stage);

	const baseDomain = getDomainName(stack.stage);

	const site = new AstroSite(stack, 'site', {
		path: 'packages/site',
		environment: {
			PUBLIC_CARD_CDN_URL: cardCDN.domainName,
			DOMAIN_NAME: app.mode === 'dev' ? 'localhost:4321' : baseDomain,
      PUBLIC_WS_URL: wsApi.url,
		},
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
			config.TWITCH_TOKENS_PARAM,
			config.DOMAIN_NAME,
			eventBus,
			adminImageSecret,
      dataSummaries,
		],
		customDomain:
			app.mode === 'dev'
				? undefined
				: {
						domainName: baseDomain,
						hostedZone: hostedZone,
					},
		permissions: ['ssm:GetParameter', 'ssm:PutParameter'],
		runtime: 'nodejs22.x',
	});

	stack.addOutputs({
		SiteUrl: site.url,
	});

	return {
		site,
	};
}
