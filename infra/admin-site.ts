import { twitchApi } from './api';
import { auth } from './auth';
import { cardDesignBucket, cardDraftBucket, frameDesignBucket, frameDraftBucket } from './buckets';
import {
	domainName,
	params,
	resolveDomain,
	ssmPermissions,
	twitchClientId,
	twitchClientSecret,
} from './config';
import { database, dataSummaries } from './database';
import { eventBus } from './events';
import { adminImageSecret } from './image-processing';

export const adminSite = new sst.aws.Astro('AdminSite', {
	path: 'packages/admin',
	permissions: [ssmPermissions],
	domain: resolveDomain(`admin.${domainName}`),
	server: { runtime: 'nodejs24.x' },
	dev: { title: 'Admin Site' },
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
