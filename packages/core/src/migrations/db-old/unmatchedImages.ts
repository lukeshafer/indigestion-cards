import { Entity, type EntityItem, type CreateEntityItem } from 'electrodb';
import { config, auditAttributes } from './_utils';

export type UnmatchedImage = EntityItem<typeof unmatchedImages>;
export type CreateUnmatchedImage = CreateEntityItem<typeof unmatchedImages>;
export type UnmatchedImageType = 'cardDesign' | 'frame';
export const unmatchedImages = new Entity(
	{
		model: {
			entity: 'unmatchedImage',
			version: '1',
			service: 'card-app',
		},
		attributes: {
			imageId: {
				type: 'string',
				required: true,
			},
			url: {
				type: 'string',
				required: true,
			},
			type: {
				type: ['cardDesign', 'frame'] as const,
				required: true,
			},
			...auditAttributes('unmatchedImage'),
		},
		indexes: {
			byType: {
				pk: {
					field: 'pk',
					composite: ['type'],
				},
				sk: {
					field: 'sk',
					composite: ['imageId'],
				},
			},
		},
	},
	config
);
