import { StackContext, AstroSite, use, SolidStartSite } from 'sst/constructs';
import { Database } from './database';
import { API } from './api';
import { DesignBucket } from './bucket';
import { Auth } from './auth';
import { ConfigStack } from './config';
import { Events } from './events';
import { getHostedZone, getDomainName } from './constants';
import { ImageProcessing } from './image-processing';

export function Sites({ app, stack }: StackContext) {
	const table = use(Database);
	const { adminApi, twitchApi } = use(API);
	const { frameBucket, cardDesignBucket, frameDraftBucket, cardDraftBucket } = use(DesignBucket);
	const { siteAuth } = use(Auth);
	const bus = use(Events);
	const config = use(ConfigStack);
	const { cardCDN, adminImageSecret } = use(ImageProcessing);

	const hostedZone = getHostedZone(stack.stage);

	const baseDomain = getDomainName(stack.stage);

	const betaSiteDomain =
		app.mode === 'dev'
			? undefined
			: {
					domainName: `admin.${baseDomain}`,
					hostedZone: hostedZone,
				};

	const betaSite = new SolidStartSite(stack, 'SolidStartFrontend', {
		path: 'packages/beta-site',
		environment: {
			VITE_CARD_CDN_URL: cardCDN.domainName,
			DOMAIN_NAME: betaSiteDomain?.domainName ?? 'localhost:3000',
		},
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
			bus,
			adminImageSecret,
		],
		customDomain: betaSiteDomain,
		permissions: ['ssm:GetParameter', 'ssm:PutParameter'],
		runtime: 'nodejs18.x',
	});

	const site = new AstroSite(stack, 'site', {
		path: 'packages/site',
		environment: {
			PUBLIC_CARD_CDN_URL: cardCDN.domainName,
			DOMAIN_NAME: app.mode === 'dev' ? 'localhost:4321' : baseDomain,
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
			bus,
			adminImageSecret,
		],
		customDomain:
			app.mode === 'dev'
				? undefined
				: {
						domainName: baseDomain,
						hostedZone: hostedZone,
					},
		permissions: ['ssm:GetParameter', 'ssm:PutParameter'],
		runtime: 'nodejs18.x',
	});

	stack.addOutputs({
		SiteUrl: site.url,
		BetaSiteUrl: betaSite.url,
	});

	return {
		site,
		betaSite,
	};
}
