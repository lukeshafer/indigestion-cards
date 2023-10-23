import { Table } from 'sst/node/table';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { type Attribute, type EntityConfiguration, Entity } from 'electrodb';

export const config = {
	table: Table.data.tableName,
	client: new DynamoDBClient(),
} satisfies EntityConfiguration;

export const auditAttributes = (entityName: string) =>
	({
		createdAt: {
			type: 'number',
			default: () => Date.now(),
			// cannot be modified after created
			readOnly: true,
		},
		updatedAt: {
			type: 'number',
			// watch for changes to any attribute
			watch: '*',
			// set current timestamp when updated
			set: (_, i) => {
				// add to audit log
				if (
					!process.env.SESSION_USER_ID ||
					process.env.SESSION_TYPE !== 'admin' ||
					!process.env.SESSION_USERNAME
				) {
					throw new Error('Username and ID are required in process.env');
					return;
				}

				audits.create({
					entity: entityName,
					username: process.env.SESSION_USERNAME,
					userId: process.env.SESSION_USER_ID,
					timestamp: Date.now(),
					item: JSON.stringify(i),
				});

				return Date.now();
			},
			readOnly: true,
		},
	}) satisfies Record<string, Attribute>;

const audits = new Entity(
	{
		model: {
			entity: 'audit',
			version: '1',
			service: 'card-app',
		},
		attributes: {
			entity: {
				type: 'string',
				required: true,
			},
			item: {
				type: 'string',
				required: true,
			},
			userId: {
				type: 'string',
				required: true,
			},
			username: {
				type: 'string',
				required: true,
			},
			timestamp: {
				type: 'number',
				required: true,
			},
		},
		indexes: {
			byEntity: {
				pk: {
					field: 'pk',
					composite: ['entity'],
				},
				sk: {
					field: 'sk',
					composite: ['item', 'userId', 'username', 'timestamp'],
				},
			},
			byUserId: {
				index: 'gsi1',
				pk: {
					field: 'gsi1pk',
					composite: ['userId'],
				},
				sk: {
					field: 'gsi1sk',
					composite: ['entity', 'item', 'username', 'timestamp'],
				},
			},
		},
	},
	config
);
