import { StackContext, Api, Config, use } from 'sst/constructs'
import { Database } from './database'
import { Events } from './events'
import { DesignBucket } from './bucket'

export function API({ stack }: StackContext) {
	const table = use(Database)
	const eventBus = use(Events)
	const bucket = use(DesignBucket)

	const api = new Api(stack, 'api', {
		routes: {
			'GET /': 'packages/functions/src/twitch-api.handler',
			'POST /': 'packages/functions/src/twitch-api.handler',
			'POST /give-pack-to-user': 'packages/functions/src/invoke-give-pack-event.handler',
			'POST /create-card-season': 'packages/functions/src/create-card-season.handler',
			'POST /create-card-design': 'packages/functions/src/create-card-design.handler',
			'POST /delete-card-design/{id}': 'packages/functions/src/delete-card-design.handler',
			'POST /delete-card-season/{id}': 'packages/functions/src/delete-card-season.handler',
			'POST /delete-unmatched-image/{id}': 'packages/functions/src/delete-unmatched-image.handler',
			//'POST /test-api': 'packages/functions/src/test-api.handler',
		},
		defaults: {
			function: {
				bind: [
					new Config.Secret(stack, 'TWITCH_CLIENT_ID'),
					new Config.Secret(stack, 'TWITCH_CLIENT_SECRET'),
					new Config.Secret(stack, 'TWITCH_ACCESS_TOKEN'),
					table,
					eventBus,
					bucket,
				],
			},
		},
	})

	stack.addOutputs({
		ApiEndpoint: api.url,
	})

	return api
}
