import { SSTConfig } from 'sst'
import { ConfigStack } from './stacks/config'
import { API } from './stacks/api'
import { Database } from './stacks/database'
import { Events } from './stacks/events'
import { Sites } from './stacks/sites'
import { DesignBucket } from './stacks/bucket'
import { AuthStack } from './stacks/auth'

export default {
	config(_input) {
		return {
			name: 'lil-indigestion-cards',
			region: 'us-east-2',
		}
	},
	stacks(app) {
		app
			.stack(ConfigStack)
			.stack(Database)
			.stack(AuthStack)
			.stack(Events)
			.stack(DesignBucket)
			.stack(API)
			.stack(Sites)
	},
} satisfies SSTConfig
