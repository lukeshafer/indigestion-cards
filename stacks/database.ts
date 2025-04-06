import { StackContext, Table, Cron, use, Bucket } from 'sst/constructs';
import { ConfigStack } from './config';

export function Database({ stack }: StackContext) {
	const config = use(ConfigStack);

	const dataSummaries = new Bucket(stack, 'DataSummaries', {});

	const table = new Table(stack, 'data', {
		stream: 'new_image',
		fields: {
			pk: 'string',
			sk: 'string',
			gsi1pk: 'string',
			gsi1sk: 'string',
			gsi2pk: 'string',
			gsi2sk: 'string',
			gsi3pk: 'string',
			gsi3sk: 'string',
			gsi4pk: 'string',
			gsi4sk: 'string',
			gsi5pk: 'string',
			gsi5sk: 'string',
			gsi6pk: 'string',
			gsi6sk: 'string',
			gsi7pk: 'string',
			gsi7sk: 'string',
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
			gsi3: {
				partitionKey: 'gsi3pk',
				sortKey: 'gsi3sk',
			},
			gsi4: {
				partitionKey: 'gsi4pk',
				sortKey: 'gsi4sk',
			},
			gsi5: {
				partitionKey: 'gsi5pk',
				sortKey: 'gsi5sk',
			},
			gsi6: {
				partitionKey: 'gsi6pk',
				sortKey: 'gsi6sk',
			},
			gsi7: {
				partitionKey: 'gsi7pk',
				sortKey: 'gsi7sk',
			},
		},
	});

	const entityFilter = (entities: Array<string>) => {
		return { dynamodb: { NewImage: { __edb_e__: { S: entities } } } };
	};
	table.addConsumers(stack, {
		updateStatistics: {
			filters: [
				entityFilter(['season', 'cardDesign', 'cardInstance', 'pack', 'rarity', 'trade']),
			],
			function: {
				handler: 'packages/functions/src/table-consumers/update-statistics.handler',
				bind: [table, dataSummaries],
			},
		},
		refreshUserlist: {
			filters: [entityFilter(['cardInstance', 'user', 'preorder', 'trade'])],
			function: {
				handler: 'packages/functions/src/table-consumers/refresh-user-list.handler',
				bind: [table, dataSummaries, config.TWITCH_TOKENS_PARAM],
			},
		},
		refreshDesignslist: {
			filters: [entityFilter(['season', 'cardDesign', 'cardInstance', 'rarity'])],
			function: {
				handler: 'packages/functions/src/table-consumers/refresh-designs-list.handler',
				bind: [table, dataSummaries, config.TWITCH_TOKENS_PARAM],
			},
		},
	});

	new Cron(stack, 'RefreshUsernamesCron', {
		schedule: 'cron(0 6 * * ? *)',
		job: {
			function: {
				handler: 'packages/functions/src/cron/refresh-usernames.handler',
				environment: {
					SESSION_USER_ID: 'RefreshUsernamesCron',
					SESSION_TYPE: 'admin',
					SESSION_USERNAME: 'Refresh Usernames Cron Job',
				},
				bind: [
					table,
					config.TWITCH_CLIENT_SECRET,
					config.TWITCH_CLIENT_ID,
					config.TWITCH_TOKENS_PARAM,
				],
				permissions: ['ssm:GetParameter', 'ssm:PutParameter'],
				runtime: 'nodejs22.x',
			},
		},
	});

	new Cron(stack, 'RefreshUserCardCountsCron', {
		schedule: 'cron(10 6 * * ? *)',
		job: {
			function: {
				handler: 'packages/functions/src/cron/refresh-card-and-pack-count.handler',
				environment: {
					SESSION_USER_ID: 'RefreshUserCardCountsCron',
					SESSION_TYPE: 'admin',
					SESSION_USERNAME: 'Refresh User Card Counts Cron Job',
				},
				bind: [table],
				runtime: 'nodejs22.x',
			},
		},
	});

	return { table, dataSummaries };
}
