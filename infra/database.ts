import { params, twitchClientId, twitchClientSecret, ssmPermissions } from './config';

export const dataSummaries = new sst.aws.Bucket('DataSummaries', {
	transform: {
		bucket(args, opts) {
			args.forceDestroy = undefined;
			if ($app.stage === 'luke') {
				args.bucket = 'luke-lil-indigestion-card-datasummariesbucket424a2-fn3boh27zeyc';
				opts.import = 'luke-lil-indigestion-card-datasummariesbucket424a2-fn3boh27zeyc';
				return;
			} else if ($app.stage === 'luke-v3') {
				return;
			} else {
				throw new Error(`Bucket DataSummaries import not setup for stage ${$app.stage}`);
			}
		},
	},
});

export const database = new sst.aws.Dynamo('Database', {
	transform: {
		table(args, opts) {
			if ($app.stage === 'luke') {
				opts.import = 'luke-lil-indigestion-cards-data';
				return;
			} else if ($app.stage === 'luke-v3') {
				return;
			} else {
				throw new Error(`Database import not setup for stage ${$app.stage}`);
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

function filterEntities(entities: Array<string>) {
	return { dynamodb: { NewImage: { __edb_e__: { S: entities } } } };
}

database.subscribe(
	{
		handler: 'packages/functions/src/table-consumers/update-statistics.handler',
		link: [database, dataSummaries, twitchClientId, twitchClientSecret, params],
		permissions: [ssmPermissions],
	},
	{
		filters: [
			filterEntities(['season', 'cardDesign', 'cardInstance', 'pack', 'rarity', 'trade']),
		],
	}
);

database.subscribe(
	{
		handler: 'packages/functions/src/table-consumers/refresh-user-list.handler',
		link: [database, dataSummaries, twitchClientId, twitchClientSecret, params],
		permissions: [ssmPermissions],
	},
	{ filters: [filterEntities(['cardInstance', 'user', 'preorder', 'trade'])] }
);

database.subscribe(
	{
		handler: 'packages/functions/src/table-consumers/refresh-designs-list.handler',
		link: [database, dataSummaries, twitchClientId, twitchClientSecret, params],
		permissions: [ssmPermissions],
	},
	{ filters: [filterEntities(['season', 'cardDesign', 'cardInstance', 'rarity'])] }
);

database.subscribe(
	{
		handler: 'packages/functions/src/table-consumers/refresh-user-cards.handler',
		link: [database, dataSummaries, twitchClientId, twitchClientSecret, params],
		permissions: [ssmPermissions],
	},
	{ filters: [filterEntities(['season', 'cardDesign', 'cardInstance', 'rarity'])] }
);

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
		permissions: [ssmPermissions],
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

// await import('../packages/core/src/migrations/index').then(M => M.migration());

let seedDB = new sst.aws.Function('SeedDb', {
	handler: 'packages/functions/src/deployment/seed-db.handler',
	link: [database, params, twitchClientId, twitchClientSecret],
	runtime: 'nodejs22.x',
	permissions: [
		{
			actions: ['ssm:GetParameter', 'ssm:PutParameter'],
			resources: [`*`],
		},
	],
});

let migration = new sst.aws.Function('MigrateDb', {
	handler: 'packages/functions/src/deployment/migrate-db.handler',
	link: [database, params, twitchClientId, twitchClientSecret],
	runtime: 'nodejs22.x',
	permissions: [
		{
			actions: ['ssm:GetParameter', 'ssm:PutParameter'],
			resources: [`*`],
		},
	],
});

$resolve([seedDB.name, migration.name]).apply(async ([seedDBName, migrationName]) => {
	const lambda = await import('@aws-sdk/client-lambda').then(
		({ Lambda }) => new Lambda({ region: 'us-east-2' })
	);

	console.log('Invoking migration lambdas');

	await lambda.invoke({ FunctionName: seedDBName });
	await lambda.invoke({ FunctionName: migrationName });
});
