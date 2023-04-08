import { StackContext, AstroSite, use } from 'sst/constructs'
import { Database } from './database'
import { API } from './api'

export function Sites({ stack }: StackContext) {
	const table = use(Database)
	const api = use(API)

	const adminSite = new AstroSite(stack, 'admin', {
		path: 'packages/admin-site',
		bind: [table, api],
	})

	// TODO: add cron job to check twitch for users who have updated their username

	stack.addOutputs({
		AdminUrl: adminSite.url,
	})
}
