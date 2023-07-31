import { StackContext, EventBus, Queue, use } from 'sst/constructs';
import { Database } from './database';
import { ConfigStack } from './config';

export function Events({ stack }: StackContext) {
	const table = use(Database);
	const config = use(ConfigStack);

	const dlq = new Queue(stack, 'dlq', {
		consumer: {
			function: {
				bind: [table],
				handler: 'packages/functions/src/sqs/create-failed-queue-alert.handler',
				environment: {
					SESSION_USER_ID: 'dlq',
					SESSION_USERNAME: 'DLQ',
					SESSION_TYPE: 'admin',
				},
			},
		},
	});

	const queue = new Queue(stack, 'queue', {
		cdk: {
			queue: {
				deadLetterQueue: {
					maxReceiveCount: 5,
					queue: dlq.cdk.queue,
				},
			},
		},
		consumer: {
			function: {
				bind: [
					table,
					config.TWITCH_CLIENT_ID,
					config.TWITCH_CLIENT_SECRET,
					config.APP_ACCESS_TOKEN_ARN,
				],
				handler: 'packages/functions/src/sqs/give-pack-to-user.handler',
				permissions: ['secretsmanager:GetSecretValue', 'secretsmanager:PutSecretValue'],
				environment: {
					SESSION_USER_ID: 'event_give_pack_to_user',
					SESSION_USERNAME: 'Event: give-pack-to-user',
					SESSION_TYPE: 'admin',
				},
			},
			cdk: {
				eventSource: {
					batchSize: 1,
				},
			},
		},
	});

	const eventBus = new EventBus(stack, 'eventBus', {
		rules: {
			'refresh-channel-point-rewards': {
				pattern: {
					detailType: ['refresh-channel-point-rewards'],
				},
				targets: {
					refreshFunction: {
						function: {
							handler:
								'packages/functions/src/event-bridge/refresh-channel-point-rewards.handler',
							bind: [
								table,
								config.STREAMER_USER_ID,
								config.STREAMER_ACCESS_TOKEN_ARN,
								config.STREAMER_REFRESH_TOKEN_ARN,
								config.APP_ACCESS_TOKEN_ARN,
								config.TWITCH_CLIENT_ID,
								config.TWITCH_CLIENT_SECRET,
							],
							permissions: [
								'secretsmanager:GetSecretValue',
								'secretsmanager:PutSecretValue',
							],
						},
					},
				},
			},
			'give-pack-to-user': {
				pattern: {
					source: ['twitch'],
					detailType: ['give-pack-to-user'],
				},
				targets: {
					queue,
				},
			},
		},
	});

	return eventBus;
}
