import { SSTConfig } from 'sst'
import { API } from './stacks/api'
import { Database } from './stacks/database'
import { Events } from './stacks/events'
import { Sites } from './stacks/sites'
import { DesignBucket } from './stacks/bucket'

export default {
	config(_input) {
		return {
			name: 'lil-indigestion-cards',
			region: 'us-east-2',
		}
	},
	stacks(app) {
		app.stack(Database).stack(Events).stack(API).stack(DesignBucket).stack(Sites)
	},
} satisfies SSTConfig
