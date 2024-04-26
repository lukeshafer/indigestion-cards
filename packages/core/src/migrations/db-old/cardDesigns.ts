import { type CreateEntityItem, type UpdateEntityItem, Entity, type EntityItem } from 'electrodb';
import { config, auditAttributes } from './_utils';

export type CardDesign = EntityItem<typeof cardDesigns>;
export type CreateCardDesign = CreateEntityItem<typeof cardDesigns>;
export type UpdateCardDesign = UpdateEntityItem<typeof cardDesigns>;
export const cardDesigns = new Entity(
	{
		model: {
			entity: 'cardDesign',
			version: '2',
			service: 'card-app',
		},
		attributes: {
			cardName: {
				type: 'string',
				required: true,
			},
			cardDescription: {
				type: 'string',
				required: true,
			},
			designId: {
				type: 'string',
				required: true,
			},
			artist: {
				type: 'string',
				required: true,
			},
			seasonId: {
				type: 'string',
				required: true,
			},
			seasonName: {
				type: 'string',
				required: true,
			},
			releaseDate: {
				type: 'string',
			},
			isComplete: {
				type: 'boolean',
			},
			imgUrl: {
				type: 'string',
				required: true,
			},
			bestRarityFound: {
				type: 'map',
				properties: {
					rarityId: {
						type: 'string',
						required: true,
					},
					rarityName: {
						type: 'string',
						required: true,
					},
					frameUrl: {
						type: 'string',
						required: true,
					},
					count: {
						type: 'number',
						required: true,
					},
					rarityColor: {
						type: 'string',
						required: true,
					},
				},
			},
			rarityDetails: {
				type: 'list',
				items: {
					type: 'map',
					properties: {
						rarityId: {
							type: 'string',
							required: true,
						},
						rarityName: {
							type: 'string',
							required: true,
						},
						frameUrl: {
							type: 'string',
							required: true,
						},
						count: {
							type: 'number',
							required: true,
						},
						rarityColor: {
							type: 'string',
							required: true,
						},
					},
				},
			},
			...auditAttributes('cardDesign'),
		},
		indexes: {
			byDesignId: {
				collection: 'designAndCards',
				pk: {
					field: 'pk',
					composite: ['designId'],
				},
				sk: {
					field: 'sk',
					composite: [],
				},
			},
			bySeasonId: {
				collection: 'seasonAndDesigns',
				index: 'gsi1',
				pk: {
					field: 'gsi1pk',
					composite: ['seasonId'],
				},
				sk: {
					field: 'gsi1sk',
					composite: ['designId'],
				},
			},
			allDesigns: {
				index: 'gsi2',
				pk: {
					field: 'gsi2pk',
					composite: [],
				},
				sk: {
					field: 'gsi2sk',
					composite: ['designId'],
				},
			},
		},
	},
	config
);
