import { Entity, type EntityItem, type CreateEntityItem, type UpdateEntityItem } from 'electrodb';
import { config, auditAttributes } from './_utils';

export type Rarity = EntityItem<typeof rarities>;
export type CreateRarity = CreateEntityItem<typeof rarities>;
export type UpdateRarity = UpdateEntityItem<typeof rarities>;
export const rarities = new Entity(
	{
		model: {
			entity: 'rarity',
			version: '1',
			service: 'card-app',
		},
		attributes: {
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
			defaultCount: {
				type: 'number',
				required: true,
			},
			rarityColor: {
				type: 'string',
				required: true,
			},
			...auditAttributes('rarity'),
		},
		indexes: {
			allRarities: {
				collection: 'siteConfig',
				pk: {
					field: 'pk',
					composite: [],
				},
				sk: {
					field: 'sk',
					composite: ['rarityId'],
				},
			},
		},
	},
	config
);
