import { Entity } from 'electrodb';
import { config, auditAttributes } from '../db/_utils';
import { cardDesigns } from 'src/db/cardDesigns';

export async function migration() {
	const old = await oldDesigns.scan.go();
	let successCount = 0;
	let errorCount = 0;
	for (const design of old.data) {
		try {
			console.log('Migrating design', design.designId, { design });
			await cardDesigns.create(design).go();
			await oldDesigns.delete(design).go();
			successCount++;
		} catch (error) {
			console.error('An error occurred with the design', design.designId, {
				design,
				error,
			});
			errorCount++;
			continue;
		}
	}

	console.log({ successCount, errorCount });
}

const oldDesigns = new Entity(
	{
		model: {
			entity: 'cardDesign',
			version: '1',
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
		},
	},
	config
);
