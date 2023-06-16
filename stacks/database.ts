import { StackContext, Table, Cron, use } from 'sst/constructs';
import { ConfigStack } from './config';

export function Database({ stack }: StackContext) {
	const { TWITCH_CLIENT_SECRET, TWITCH_CLIENT_ID, APP_ACCESS_TOKEN_ARN } = use(ConfigStack);

	const table = new Table(stack, 'data', {
		fields: {
			pk: 'string',
			sk: 'string',
			gsi1pk: 'string',
			gsi1sk: 'string',
			gsi2pk: 'string',
			gsi2sk: 'string',
			gsi3pk: 'string',
			gsi3sk: 'string',
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
		},
	});

	// TODO: add cron job to check twitch for users who have updated their username
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
				bind: [table, TWITCH_CLIENT_SECRET, TWITCH_CLIENT_ID, APP_ACCESS_TOKEN_ARN],
			},
		},
	});

	return table;
}
