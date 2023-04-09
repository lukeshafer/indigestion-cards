import { StackContext, AstroSite, use } from 'sst/constructs'
import { Database } from './database'
import { API } from './api'
import { DesignBucket } from './bucket'

export function Sites({ stack }: StackContext) {
	const table = use(Database)
	const api = use(API)
	const bucket = use(DesignBucket)

	const adminSite = new AstroSite(stack, 'admin', {
		path: 'packages/admin-site',
		bind: [table, api, bucket],
	})

	// TODO: add cron job to check twitch for users who have updated their username

	stack.addOutputs({
		AdminUrl: adminSite.url,
	})
}
