import { StackContext, EventBus, Queue, use } from 'sst/constructs'
import { Database } from './database'

export function Events({ stack }: StackContext) {
	const table = use(Database)

	const queue = new Queue(stack, 'queue', {
		consumer: {
			function: {
				bind: [table],
				handler: 'packages/functions/src/sqs/give-pack-to-user.handler',
			},
			cdk: {
				eventSource: {
					batchSize: 1,
				},
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
					queue,
				},
			},
		},
		defaults: {
			function: {
				bind: [table],
			},
		},
	})

	return eventBus
}
