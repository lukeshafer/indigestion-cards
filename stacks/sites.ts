import { StackContext, AstroSite, use } from 'sst/constructs'
import { Database } from './database'
import { API } from './api'
import { DesignBucket } from './bucket'
import { Auth } from './auth'
import { ConfigStack } from './config'

export function Sites({ stack }: StackContext) {
	const table = use(Database)
	const api = use(API)
	const { frameBucket, cardDesignBucket } = use(DesignBucket)
	const auth = use(Auth)
	const { TWITCH_CLIENT_ID, TWITCH_ACCESS_TOKEN } = use(ConfigStack)

	const adminSite = new AstroSite(stack, 'admin', {
		path: 'packages/admin-site',
		bind: [table, api, frameBucket, cardDesignBucket, auth, TWITCH_CLIENT_ID, TWITCH_ACCESS_TOKEN],
	})

	// TODO: add cron job to check twitch for users who have updated their username

	stack.addOutputs({
		AdminUrl: adminSite.url,
	})
}
