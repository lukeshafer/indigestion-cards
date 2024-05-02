import { type CreateEntityItem, Entity, type UpdateEntityItem, type EntityItem } from 'electrodb';
import { config, auditAttributes } from './_utils';

export type Season = EntityItem<typeof season>;
export type CreateSeason = CreateEntityItem<typeof season>;
export type UpdateSeason = UpdateEntityItem<typeof season>;
export const season = new Entity(
	{
		model: {
			entity: 'season',
			version: '1',
			service: 'card-app',
		},
		attributes: {
			seasonName: {
				type: 'string',
				required: true,
			},
			seasonDescription: {
				type: 'string',
			},
			seasonId: {
				type: 'string',
				required: true,
			},
			...auditAttributes('season'),
		},
		indexes: {
			allSeasons: {
				pk: {
					field: 'pk',
					composite: [],
				},
				sk: {
					field: 'sk',
					composite: ['seasonId'],
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
					composite: [],
				},
			},
		},
	},
	config
);
