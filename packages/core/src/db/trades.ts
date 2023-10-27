import { type CreateEntityItem, Entity, type EntityItem } from 'electrodb';
import { config, auditAttributes } from './_utils';
import { randomUUID } from 'crypto';

export type Trade = EntityItem<typeof trades>;
export type CreateTrade = CreateEntityItem<typeof trades>;
const tradeCardsProperties = {
	instanceId: {
		type: 'string',
		required: true,
	},
	designId: {
		type: 'string',
		required: true,
	},
	cardName: {
		type: 'string',
		required: true,
	},
	cardDescription: {
		type: 'string',
		required: true,
	},
	imgUrl: {
		type: 'string',
		required: true,
	},
	rarityId: {
		type: 'string',
		required: true,
	},
	rarityName: {
		type: 'string',
		required: true,
	},
	rarityColor: {
		type: 'string',
		required: true,
	},
	frameUrl: {
		type: 'string',
		required: true,
	},
	cardNumber: {
		type: 'number',
		required: true,
	},
	totalOfType: {
		type: 'number',
		required: true,
	},
} as const;

export const trades = new Entity(
	{
		model: {
			entity: 'trade',
			version: '1',
			service: 'card-app',
		},
		attributes: {
			tradeId: {
				type: 'string',
				default: () => randomUUID(),
				required: true,
			},
			senderUserId: {
				type: 'string',
				required: true,
			},
			senderUsername: {
				type: 'string',
				required: true,
			},
			receiverUserId: {
				type: 'string',
				required: true,
			},
			receiverUsername: {
				type: 'string',
				required: true,
			},
			offeredCards: {
				type: 'list',
				required: true,
				items: {
					type: 'map',
					properties: tradeCardsProperties,
				},
			},
			requestedCards: {
				type: 'list',
				required: true,
				items: {
					type: 'map',
					properties: tradeCardsProperties,
				},
			},
			messages: {
				type: 'list',
				required: true,
				items: {
					type: "string",
					required: true,
				},
			},
			status: {
				type: ['pending', 'accepted', 'rejected'] as const,
				required: true,
				default: 'pending',
			},
			...auditAttributes('trade'),
		},
		indexes: {
			bySenderId: {
				pk: {
					field: 'pk',
					composite: ['senderUserId'],
				},
				sk: {
					field: 'sk',
					composite: ['tradeId'],
				},
			},
			byReceiverId: {
				index: 'gsi1',
				pk: {
					field: 'gsi1pk',
					composite: ['receiverUserId'],
				},
				sk: {
					field: 'gsi1sk',
					composite: ['tradeId'],
				},
			},
		},
	},
	config
);

