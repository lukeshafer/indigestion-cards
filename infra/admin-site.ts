import { adminApi, twitchApi } from './api';
import { auth } from './auth';
import { cardDesignBucket, cardDraftBucket, frameDesignBucket, frameDraftBucket } from './buckets';
import { domainName, params, ssmPermissions, twitchClientId, twitchClientSecret } from './config';
import { database, dataSummaries } from './database';
import { eventBus } from './events';
import { adminImageSecret } from './image-processing';

// TODO: maybe can delete this line and references to the restore table
const backupTableName = 'prod-indigestion-cards-restore-20240511-203500';

export const adminSite = new sst.aws.Astro('AdminSite', {
	path: 'packages/admin',
	environment: { BACKUP_TABLE_NAME: backupTableName },
	permissions: [ssmPermissions],
	domain: $dev ? undefined : `admin.${domainName}`,
	server: {
		runtime: 'nodejs22.x',
	},
	// dev: { title: 'Admin Site' },
	link: [
		database,
		adminApi,
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
