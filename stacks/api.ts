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

	const api = new Api(stack, 'api', {
		routes: {
			'GET /': 'packages/functions/src/twitch-api.handler',
			'POST /': 'packages/functions/src/twitch-api.handler',
			'POST /give-pack-to-user': 'packages/functions/src/invoke-give-pack-event.handler',
			'POST /create-card-season': 'packages/functions/src/create-card-season.handler',
			'POST /create-card-design': 'packages/functions/src/create-card-design.handler',
			'POST /create-rarity': 'packages/functions/src/create-rarity.handler',
			'POST /delete-card-design/{seasonId}/{designId}':
				'packages/functions/src/delete-card-design.handler',
			'POST /delete-card-season/{id}': 'packages/functions/src/delete-card-season.handler',
			'POST /delete-unmatched-image/{id}': 'packages/functions/src/delete-unmatched-image.handler',
			'POST /delete-rarity/{id}': 'packages/functions/src/delete-rarity.handler',
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
	})

	return api
}
