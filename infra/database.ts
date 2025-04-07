import { params, twitchClientId, twitchClientSecret } from './config';

export const database = new sst.aws.Dynamo('data', {
	transform: {
		table(args, opts) {
			if ($app.stage === 'luke') {
				opts.import = 'luke-lil-indigestion-cards-data';
				return;
			}
		},
	},
	stream: 'new-and-old-images',
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
		hashKey: 'pk',
		rangeKey: 'sk',
	},
	globalIndexes: {
		gsi1: {
			hashKey: 'gsi1pk',
			rangeKey: 'gsi1sk',
		},
		gsi2: {
			hashKey: 'gsi2pk',
			rangeKey: 'gsi2sk',
		},
		gsi3: {
			hashKey: 'gsi3pk',
			rangeKey: 'gsi3sk',
		},
		gsi4: {
			hashKey: 'gsi4pk',
			rangeKey: 'gsi4sk',
		},
		gsi5: {
			hashKey: 'gsi5pk',
			rangeKey: 'gsi5sk',
		},
		gsi6: {
			hashKey: 'gsi6pk',
			rangeKey: 'gsi6sk',
		},
		gsi7: {
			hashKey: 'gsi7pk',
			rangeKey: 'gsi7sk',
		},
	},
});

new sst.aws.Cron('RefreshUsernamesCron', {
	schedule: 'cron(0 6 * * ? *)',

	function: {
		handler: 'packages/functions/src/cron/refresh-usernames.handler',
		environment: {
			SESSION_USER_ID: 'RefreshUsernamesCron',
			SESSION_TYPE: 'admin',
			SESSION_USERNAME: 'Refresh Usernames Cron Job',
		},
		link: [database, twitchClientSecret, twitchClientId, params],
		permissions: [
			{
				actions: ['ssm:GetParameter', 'ssm:PutParameter'],
				resources: ['*'],
			},
		],
		runtime: 'nodejs22.x',
	},
});

new sst.aws.Cron('RefreshUserCardCountsCron', {
	schedule: 'cron(10 6 * * ? *)',
	function: {
		handler: 'packages/functions/src/cron/refresh-card-and-pack-count.handler',
		environment: {
			SESSION_USER_ID: 'RefreshUserCardCountsCron',
			SESSION_TYPE: 'admin',
			SESSION_USERNAME: 'Refresh User Card Counts Cron Job',
		},
		link: [database],
		runtime: 'nodejs22.x',
	},
});
