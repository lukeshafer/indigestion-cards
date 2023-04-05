import { StackContext, Api, Config, Table, AstroSite } from 'sst/constructs'

export function API({ stack }: StackContext) {
	const table = new Table(stack, 'db', {
		fields: {
			pk: 'string',
			sk: 'string',
			gsi1pk: 'string',
			gsi1sk: 'string',
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
		},
	})

	//const table = new Table(stack, 'table', {
	//fields: {
	//pk: 'string',
	//sk: 'string',
	//entityType: 'string',
	//userId: 'string',
	//userName: 'string',
	//cardTypeId: 'string',
	//cardInstanceId: 'string',
	//cardName: 'string',
	//cardDescription: 'string',
	//cardImage: 'string',
	//totalCardInstances: 'number',
	//cardInstanceNumber: 'number',
	//dateOpened: 'string',
	//dateReleased: 'string',
	//ownerId: 'string',
	//minterId: 'string',
	//unopenedPacks: 'number',
	//},
	//primaryIndex: {
	//partitionKey: 'pk',
	//sortKey: 'sk',
	//},
	//globalIndexes: {
	//byUserName: {
	//partitionKey: 'userName',
	//},
	//},
	//})

	const adminSite = new AstroSite(stack, 'admin', {
		path: 'packages/admin-site',
		bind: [table],
	})

	const api = new Api(stack, 'api', {
		routes: {
			'GET /': 'packages/functions/src/twitch-api.handler',
			'POST /': 'packages/functions/src/twitch-api.handler',
		},
		defaults: {
			function: {
				bind: [
					new Config.Secret(stack, 'TWITCH_CLIENT_ID'),
					new Config.Secret(stack, 'TWITCH_CLIENT_SECRET'),
					new Config.Secret(stack, 'TWITCH_ACCESS_TOKEN'),
					table,
				],
			},
		},
	})

	stack.addOutputs({
		ApiEndpoint: api.url,
		AdminUrl: adminSite.url,
	})
}
