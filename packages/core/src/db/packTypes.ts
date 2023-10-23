import { Entity, type EntityItem, type CreateEntityItem } from 'electrodb';
import { config, auditAttributes } from './_utils';

export type PackType = EntityItem<typeof packTypes>;
export type CreatePackType = CreateEntityItem<typeof packTypes>;
export const packTypes = new Entity(
	{
		model: {
			entity: 'packType',
			version: '1',
			service: 'card-app',
		},
		attributes: {
			packTypeId: {
				type: 'string',
				required: true,
			},
			packTypeName: {
				type: 'string',
				required: true,
			},
			packTypeDescription: {
				type: 'string',
			},
			packTypeCategory: {
				type: ['season', 'custom'] as const,
				required: true,
			},
			cardCount: {
				type: 'number',
				required: true,
			},
			seasonId: {
				type: 'string',
			},
			seasonName: {
				type: 'string',
			},
			designs: {
				type: 'list',
				items: {
					type: 'map',
					properties: {
						designId: {
							type: 'string',
							required: true,
						},
						cardName: {
							type: 'string',
							required: true,
						},
						imgUrl: {
							type: 'string',
							required: true,
						},
					},
				},
			},
			...auditAttributes('packType'),
		},
		indexes: {
			allPackTypes: {
				collection: 'siteConfig',
				pk: {
					field: 'pk',
					composite: [],
				},
				sk: {
					field: 'sk',
					composite: ['packTypeId'],
				},
			},
			bySeasonId: {
				index: 'gsi1',
				pk: {
					field: 'gsi1pk',
					composite: ['seasonId'],
				},
				sk: {
					field: 'gsi1sk',
					composite: ['packTypeId'],
				},
			},
		},
	},
	config
);
