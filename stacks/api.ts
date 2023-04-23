import { StackContext, Api, use } from 'sst/constructs'
import { Database } from './database'
import { Events } from './events'
import { DesignBucket } from './bucket'
import { ConfigStack } from './config'
import { Auth } from './auth'

export function API({ stack }: StackContext) {
	const table = use(Database)
	const eventBus = use(Events)
	const { frameBucket, cardDesignBucket } = use(DesignBucket)
	const secrets = use(ConfigStack)
	const auth = use(Auth)

	const twitchApi = new Api(stack, 'twitchApi', {
		routes: {
			'ANY /': 'packages/functions/src/twitch-api.handler',
		},
		defaults: {
			function: {
				bind: [
					secrets.TWITCH_CLIENT_ID,
					secrets.TWITCH_CLIENT_SECRET,
					secrets.TWITCH_ACCESS_TOKEN,
					table,
					eventBus,
				],
			},
		},
	})

	const api = new Api(stack, 'api', {
		routes: {
			'POST /give-pack-to-user': 'packages/functions/src/admin-api/invoke-give-pack-event.handler',
			'POST /create-card-season': 'packages/functions/src/admin-api/create-card-season.handler',
			'POST /create-card-design': 'packages/functions/src/admin-api/create-card-design.handler',
			'POST /create-rarity': 'packages/functions/src/admin-api/create-rarity.handler',
			'POST /delete-card-design/{seasonId}/{designId}':
				'packages/functions/src/admin-api/delete-card-design.handler',
			'POST /delete-card-season/{id}':
				'packages/functions/src/admin-api/delete-card-season.handler',
			'POST /delete-unmatched-image/{id}':
				'packages/functions/admin-src/api/delete-unmatched-image.handler',
			'POST /delete-rarity/{id}': 'packages/functions/src/admin-api/delete-rarity.handler',
			'POST /create-admin-user': 'packages/functions/src/admin-api/create-admin-user.handler',
			'POST /revoke-pack': 'packages/functions/src/admin-api/revoke-pack.handler',
			'POST /open-card': 'packages/functions/src/admin-api/open-card.handler',
		},
		defaults: {
			function: {
				bind: [
					secrets.TWITCH_CLIENT_ID,
					secrets.TWITCH_CLIENT_SECRET,
					secrets.TWITCH_ACCESS_TOKEN,
					table,
					eventBus,
					frameBucket,
					cardDesignBucket,
					auth,
				],
			},
		},
	})

	stack.addOutputs({
		ApiEndpoint: api.url,
		TwitchApiEndpoint: twitchApi.url,
	})

	return api
}
