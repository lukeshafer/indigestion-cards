import {
	domainName,
	params,
	resolveDomain,
	ssmPermissions,
	twitchClientId,
	twitchClientSecret,
} from './config';
import { database, dataSummaries } from './database';
import { adminImageSecret, cardsCDN } from './image-processing';
import { wsApi } from './websockets-api';
import { twitchApi } from './api';
import { cardDesignBucket, cardDraftBucket, frameDesignBucket, frameDraftBucket } from './buckets';
import { auth } from './auth';
import { eventBus } from './events';

export const site = new sst.aws.Astro('CardsSite', {
	path: 'packages/site',
	environment: {
		PUBLIC_CARD_CDN_URL: $interpolate`https://${cardsCDN.domainName}`,
		DOMAIN_NAME: $dev ? 'localhost:4321' : domainName,
		PUBLIC_WS_URL: wsApi.url,
	},
	permissions: [ssmPermissions],
	server: {
		runtime: 'nodejs24.x',
	},
	domain: resolveDomain(domainName),
	link: [
		database,
		twitchApi,
		frameDesignBucket,
		cardDesignBucket,
		frameDraftBucket,
		cardDraftBucket,
		auth,
		params,
		twitchClientId,
		twitchClientSecret,
		eventBus,
		adminImageSecret,
		dataSummaries,
	],
});
