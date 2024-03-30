import { Entity, type EntityItem } from 'electrodb';
import { config, auditAttributes } from './_utils';

export type MomentRedemption = EntityItem<typeof momentRedemptions>;
export const momentRedemptions = new Entity(
	{
		model: {
			entity: 'momentRedemption',
			version: '1',
			service: 'card-app',
		},
		attributes: {
			momentDate: {
				type: 'string',
				default: () => new Date().toISOString().slice(0, 10),
				// cannot be modified after created
				readOnly: true,
			},
			userId: {
				type: 'string',
				required: true,
			},
			username: {
				type: 'string',
				required: true,
			},
			...auditAttributes('momentRedemption'),
		},
		indexes: {
			primary: {
				pk: {
					field: 'pk',
					composite: ['momentDate'],
				},
				sk: {
					field: 'sk',
					composite: ['userId'],
				},
			},
			getAll: {
				index: 'gsi1',
				pk: {
					field: 'gsipk1',
					composite: [],
				},
				sk: {
					field: 'gsisk1',
					composite: ['momentDate', 'userId'],
				},
			},
		},
	},
	config
);
