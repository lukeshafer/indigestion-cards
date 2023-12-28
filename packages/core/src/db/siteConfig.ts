import { Entity, type EntityItem, type CreateEntityItem, type UpdateEntityItem } from 'electrodb';
import { config, auditAttributes } from './_utils';

export type SiteConfig = EntityItem<typeof siteConfig>;
export type CreateSiteConfig = CreateEntityItem<typeof siteConfig>;
export type UpdateSiteConfig = UpdateEntityItem<typeof siteConfig>;
export const siteConfig = new Entity(
	{
		model: {
			entity: 'siteConfig',
			version: '1',
			service: 'card-app',
		},
		attributes: {
			baseRarity: {
				type: 'map',
				required: true,
				properties: {
					rarityId: {
						type: 'string',
						required: true,
					},
					frameUrl: {
						type: 'string',
						required: true,
					},
					rarityColor: {
						type: 'string',
						required: true,
					},
					rarityName: {
						type: 'string',
						required: true,
					},
				},
			},
			messages: {
				type: 'list',
				required: true,
				items: {
					type: 'map',
					properties: {
						message: {
							type: 'string',
							required: true,
						},
						type: {
							type: ['error', 'success', 'info', 'warning'] as const,
							required: true,
							default: 'info',
						},
					},
				},
			},
			rarityRanking: {
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
						ranking: {
							type: 'number',
							required: true,
						}
					},
				},
			},
      tradingIsEnabled: {
        type: 'boolean',
      },
			...auditAttributes('siteConfig'),
		},
		indexes: {
			primary: {
				pk: {
					field: 'pk',
					composite: [],
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
