import { SSTConfig } from 'sst';
import { ConfigStack } from './stacks/config';
import { API } from './stacks/api';
import { Database } from './stacks/database';
import { Events } from './stacks/events';
import { Sites } from './stacks/sites';
import { DesignBucket, DataRecoveryBucket } from './stacks/bucket';
import { Auth } from './stacks/auth';
import { AfterDeployStack } from './stacks/script';
import { AdminSite } from './stacks/admin-site';
import { ImageProcessing } from './stacks/image-processing';
import { Minecraft } from './stacks/minecraft';
import { WebsocketsAPI } from './stacks/websockets-api';

export default {
	config() {
		return {
			name: 'lil-indigestion-cards',
			region: 'us-east-2',
		};
	},
	stacks(app) {
		if (app.stage === 'prod' || app.stage === 'dev') {
			app.setDefaultRemovalPolicy('retain');
		} else {
			app.setDefaultRemovalPolicy('destroy');
		}

		app.stack(ConfigStack)
			.stack(Database)
			.stack(DataRecoveryBucket)
			.stack(AfterDeployStack)
			.stack(WebsocketsAPI)
			.stack(Events)
			.stack(Auth)
			.stack(DesignBucket)
			.stack(API)
			.stack(ImageProcessing)
			.stack(Minecraft)
			.stack(Sites)
			.stack(AdminSite);
	},
} satisfies SSTConfig;
