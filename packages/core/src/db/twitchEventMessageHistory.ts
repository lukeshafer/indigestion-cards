import { Entity, type EntityItem } from 'electrodb';
import { config, auditAttributes } from './_utils';

export type TwitchEventMessageHistory = EntityItem<typeof twitchEventMessageHistory>;
export const twitchEventMessageHistory = new Entity(
	{
		model: {
			entity: 'twitchEventMessageHistory',
			version: '1',
			service: 'card-app',
		},
		attributes: {
			message_id: {
				type: 'string',
				required: true,
			},
			message_timestamp: {
				type: 'string',
				required: true,
			},
			...auditAttributes('twitchEventMessageHistory'),
		},
		indexes: {
			byMessageId: {
				pk: {
					field: 'pk',
					composite: ['message_id'],
				},
				sk: {
					field: 'sk',
					composite: [],
				},
			},
		},
	},
	config
);
