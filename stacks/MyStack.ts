import {
	StackContext,
	Api,
	Config,
	Table,
	AstroSite,
	EventBus,
} from 'sst/constructs'

export function API({ stack }: StackContext) {
	const table = new Table(stack, 'db', {
		fields: {
			pk: 'string',
			sk: 'string',
			gsi1pk: 'string',
			gsi1sk: 'string',
			gsi2pk: 'string',
			gsi2sk: 'string',
		},
		primaryIndex: {
			partitionKey: 'pk',
			sortKey: 'sk',
		},
		globalIndexes: {
			gsi1: {
				partitionKey: 'gsi1pk',
				sortKey: 'gsi1sk',
			},
			gsi2: {
				partitionKey: 'gsi2pk',
				sortKey: 'gsi2sk',
			},
		},
	})

	const eventBus = new EventBus(stack, 'eventBus', {
		rules: {
			'give-pack-to-user': {
				pattern: {
					source: ['twitch'],
					detailType: ['give-pack-to-user'],
				},
				targets: {
					// TODO: send to queue instead of function to prevent race conditions
					'give-pack-to-user': {
						function: 'packages/functions/src/give-pack-to-user.handler',
					},
				},
			},
		},
		defaults: {
			function: {
				bind: [table],
			},
		},
	})

	const api = new Api(stack, 'api', {
		routes: {
			'GET /': 'packages/functions/src/twitch-api.handler',
			'POST /': 'packages/functions/src/twitch-api.handler',
			'POST /create-card-series':
				'packages/functions/src/create-card-series.handler',
			'POST /create-card-design':
				'packages/functions/src/create-card-design.handler',
		},
		defaults: {
			function: {
				bind: [
					new Config.Secret(stack, 'TWITCH_CLIENT_ID'),
					new Config.Secret(stack, 'TWITCH_CLIENT_SECRET'),
					new Config.Secret(stack, 'TWITCH_ACCESS_TOKEN'),
					table,
					eventBus,
				],
			},
		},
	})

	const adminSite = new AstroSite(stack, 'admin', {
		path: 'packages/admin-site',
		bind: [table, api],
	})

	// TODO: add cron job to check twitch for users who have updated their username

	stack.addOutputs({
		ApiEndpoint: api.url,
		AdminUrl: adminSite.url,
	})
}
