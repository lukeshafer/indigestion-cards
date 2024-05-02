import { Entity, type EntityItem } from 'electrodb';
import { config, auditAttributes } from './_utils';

export type Admin = EntityItem<typeof admins>;
export const admins = new Entity(
	{
		model: {
			entity: 'admin',
			version: '1',
			service: 'card-app',
		},
		attributes: {
			userId: {
				type: 'string',
				required: true,
			},
			username: {
				type: 'string',
				required: true,
			},
			isStreamer: {
				type: 'boolean',
				required: true,
				default: false,
			},
			...auditAttributes('admin'),
		},
		indexes: {
			allAdmins: {
				collection: 'siteConfig',
				pk: {
					field: 'pk',
					composite: [],
				},
				sk: {
					field: 'sk',
					composite: ['userId', 'username', 'isStreamer'],
				},
			},
		},
	},
	config
);
