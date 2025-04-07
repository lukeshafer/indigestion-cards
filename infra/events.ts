import { database } from './database';
import { twitchClientSecret, twitchClientId, params } from './config';
import { wsConnectionsTable, wsApi } from './websockets-api';

const packDLQ = new sst.aws.Queue('PackDLQ');
packDLQ.subscribe({
	link: [database],
	handler: 'packages/functions/src/sqs/create-failed-queue-alert.handler',
	environment: {
		SESSION_USER_ID: 'pack-dlq',
		SESSION_USERNAME: 'pack-DLQ',
		SESSION_TYPE: 'admin',
	},
	runtime: 'nodejs22.x',
});

const packQueue = new sst.aws.Queue('PackQueue', {
	dlq: {
		retry: 5,
		queue: packDLQ.arn,
	},
	visibilityTimeout: '60 seconds',
});

packQueue.subscribe(
	{
		handler: 'packages/functions/src/sqs/give-pack-to-user.handler',
		link: [database, params, twitchClientId, twitchClientSecret, wsConnectionsTable, wsApi],
		permissions: [{ actions: ['ssm:GetParameter', 'ssm:PutParameter'], resources: ['*'] }],
		runtime: 'nodejs22.x',
		environment: {
			SESSION_USER_ID: 'event_give_pack_to_user',
			SESSION_USERNAME: 'Event: give-pack-to-user',
			SESSION_TYPE: 'admin',
		},
	},
	{ batch: { size: 1 } }
);

const tradeDLQ = new sst.aws.Queue('TradeDLQ');
tradeDLQ.subscribe({
	link: [database],
	handler: 'packages/functions/src/sqs/handle-failed-trade.handler',
	environment: {
		SESSION_USER_ID: 'trade-dlq',
		SESSION_USERNAME: 'trade-DLQ',
		SESSION_TYPE: 'admin',
	},
	runtime: 'nodejs22.x',
});

const tradeQueue = new sst.aws.Queue('PackQueue', {
	dlq: {
		retry: 5,
		queue: tradeDLQ.arn,
	},
});

tradeQueue.subscribe(
	{
		handler: 'packages/functions/src/sqs/process-trade.handler',
		link: [database, params, twitchClientId, twitchClientSecret, wsConnectionsTable, wsApi],
		permissions: [{ actions: ['ssm:GetParameter', 'ssm:PutParameter'], resources: ['*'] }],
		runtime: 'nodejs22.x',
		environment: {
			SESSION_USER_ID: 'event_process_trade',
			SESSION_USERNAME: 'Event: process-trade',
			SESSION_TYPE: 'admin',
		},
	},
	{ batch: { size: 1 } }
);

const eventBus = new sst.aws.Bus('EventBus')

// eventBus.subscribe('refresh-channel-point-rewards')
