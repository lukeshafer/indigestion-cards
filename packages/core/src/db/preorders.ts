import { type CreateEntityItem, Entity, type EntityItem } from 'electrodb';
import { config, auditAttributes } from './_utils';
import { randomUUID } from 'crypto';

export type Preorder = EntityItem<typeof preorders>;
export type CreatePreorder = CreateEntityItem<typeof preorders>;
export const preorders = new Entity(
	{
		model: {
			entity: 'preorder',
			version: '1',
			service: 'card-app',
		},
		attributes: {
			id: {
				type: 'string',
				required: true,
				default: randomUUID(),
			},
			userId: {
				type: 'string',
				required: true,
			},
			username: {
				type: 'string',
				required: true,
			},
			...auditAttributes('preorder'),
		},
		indexes: {
			primary: {
				pk: {
					field: 'pk',
					composite: [],
				},
				sk: {
					field: 'sk',
					composite: ['username', 'id'],
				},
			},
		},
	},
	config
);
