import { SSTConfig } from 'sst';
import { ConfigStack } from './stacks/config';
import { API } from './stacks/api';
import { Database } from './stacks/database';
import { Events } from './stacks/events';
import { Sites } from './stacks/sites';
import { DesignBucket } from './stacks/bucket';
import { Auth } from './stacks/auth';
import { AfterDeployStack } from './stacks/script';
import { AdminSite } from './stacks/admin-site';

export default {
	config() {
		return {
			name: 'lil-indigestion-cards',
			region: 'us-east-2',
		};
	},
	stacks(app) {
		if (app.stage !== 'prod') {
			app.setDefaultRemovalPolicy('destroy');
		}

		app.stack(ConfigStack)
			.stack(Database)
			.stack(AfterDeployStack)
			.stack(Events)
			.stack(Auth)
			.stack(DesignBucket)
			.stack(API)
			.stack(Sites)
			.stack(AdminSite);
	},
} satisfies SSTConfig;
