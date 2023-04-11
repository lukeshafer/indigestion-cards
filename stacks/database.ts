import { StackContext, Table } from 'sst/constructs'

export function Database({ stack }: StackContext) {
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
	})

	// TODO: add cron job to check twitch for users who have updated their username

	return table
}
