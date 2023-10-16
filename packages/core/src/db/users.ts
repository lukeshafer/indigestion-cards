import { CreateEntityItem, Entity, type EntityItem } from 'electrodb';
import { config, auditAttributes } from './_utils';

export type User = EntityItem<typeof users>;
export type CreateUser = CreateEntityItem<typeof users>;
export const users = new Entity(
	{
		model: {
			entity: 'user',
			version: '1',
			service: 'card-app',
		},
		attributes: {
			userId: {
				type: 'string',
				required: true,
			},
			ownerId: {
				type: 'string',
				watch: ['userId'],
				get: (_, { userId }) => userId,
			},
			username: {
				type: 'string',
				required: true,
			},
			cardCount: {
				type: 'number',
				required: true,
				default: 0,
			},
			packCount: {
				type: 'number',
				required: true,
				default: 0,
			},
			lookingFor: {
				type: 'string',
			},
			pinnedCard: {
				type: 'map',
				properties: {
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
					stamps: {
						type: 'list',
						items: {
							type: 'string',
						},
					},
				},
			},
			...auditAttributes('user'),
		},
		indexes: {
			byId: {
				pk: {
					field: 'pk',
					composite: ['userId'],
				},
				sk: {
					field: 'sk',
					composite: [],
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
