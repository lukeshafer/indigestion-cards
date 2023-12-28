import { Entity, type EntityItem, type CreateEntityItem, type UpdateEntityItem } from 'electrodb';
import { config, auditAttributes } from './_utils';

export const twitchEventTypes = [
	'channel.channel_points_custom_reward_redemption.add',
	'channel.subscription.gift',
] as const;

export type TwitchEvent = EntityItem<typeof twitchEvents>;
export type CreateTwitchEvent = CreateEntityItem<typeof twitchEvents>;
export type UpdateTwitchEvent = UpdateEntityItem<typeof twitchEvents>;
export const twitchEvents = new Entity(
	{
		model: {
			entity: 'twitchEvents',
			version: '1',
			service: 'card-app',
		},
		attributes: {
			eventId: {
				type: 'string',
				required: true,
			},
			eventName: {
				type: 'string',
				required: true,
			},
			eventType: {
				type: twitchEventTypes,
				required: true,
			},
			packTypeId: {
				type: 'string',
			},
			packTypeName: {
				type: 'string',
			},
			cost: {
				type: 'number',
			},
			isEnabled: {
				type: 'boolean'
			},
			isPaused: {
				type: 'boolean'
			},
			...auditAttributes('twitchEvents'),
		},
		indexes: {
			byEventId: {
				pk: {
					field: 'pk',
					composite: [],
				},
				sk: {
					field: 'sk',
					composite: ['eventId', 'eventType'],
				},
			},
		},
	},
	config
);
