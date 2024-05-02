import { Entity, type EntityItem, type CreateEntityItem } from 'electrodb';
import { config, auditAttributes } from './_utils';

export type UserLogin = EntityItem<typeof userLogins>;
export type CreateUserLogin = CreateEntityItem<typeof userLogins>;
export const userLogins = new Entity(
	{
		model: {
			entity: 'userLogin',
			version: '1',
			service: 'card-app',
		},
		attributes: {
			userId: {
				type: 'string',
				required: true,
				label: 'userId',
			},
			username: {
				type: 'string',
				required: true,
			},
			hasProfile: {
				type: 'boolean',
			},
			...auditAttributes('admin'),
		},
		indexes: {
			allLogins: {
				pk: {
					field: 'pk',
					composite: [],
				},
				sk: {
					field: 'sk',
					composite: ['userId'],
				},
			},
			byUsername: {
				index: 'gsi3',
				collection: 'cardsByOwnerName',
				pk: {
					field: 'gsi3pk',
					composite: ['username'],
				},
				sk: {
					field: 'gsi3sk',
					composite: [],
				},
			},
		},
	},
	config
);
