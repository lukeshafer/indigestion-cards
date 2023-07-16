import { Entity } from 'electrodb';
import { config, auditAttributes, db } from '../db';

export async function migration() {
	const packs = db.entities.packs;

	const toMove = await oldPacks.scan.go()
	for (const pack of toMove.data) {
		const result = await packs.create({
			...pack,
			cardDetails: await Promise.all(pack.cardDetails.map(async (card) => {
				const cardEntity = await db.entities.cardInstances.query.byId({ designId: card.designId, instanceId: card.instanceId }).go()
				return {
					...card,
					cardNumber: cardEntity.data[0].cardNumber,
					totalOfType: cardEntity.data[0].totalOfType,
				}
			})),
		}).go()
		if (result) {
			await oldPacks.delete(pack).go()
		}
	}
}

const oldPacks = new Entity(
	{
		model: {
			entity: 'pack',
			version: '1',
			service: 'card-app',
		},
		attributes: {
			packId: {
				type: 'string',
				required: true,
			},
			packTypeId: {
				type: 'string',
				required: true,
			},
			packTypeName: {
				type: 'string',
				required: true,
			},
			seasonId: {
				type: 'string',
			},
			username: {
				type: 'string',
			},
			userId: {
				type: 'string',
			},
			cardDetails: {
				type: 'list',
				required: true,
				items: {
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
						frameUrl: {
							type: 'string',
							required: true,
						},
						opened: {
							type: 'boolean',
							required: true,
							default: false,
						},
					},
				},
			},
			...auditAttributes('pack'),
		},
		indexes: {
			allPacks: {
				pk: {
					field: 'pk',
					composite: [],
				},
				sk: {
					field: 'sk',
					composite: ['packId'],
				},
			},
			byUsername: {
				index: 'gsi1',
				pk: {
					field: 'gsi1pk',
					composite: ['username'],
				},
				sk: {
					field: 'gsi1sk',
					composite: ['packId'],
				},
			},
			byPackId: {
				index: 'gsi2',
				collection: 'packsAndCards',
				pk: {
					field: 'gsi2pk',
					composite: ['packId'],
				},
				sk: {
					field: 'gsi2sk',
					composite: [],
				},
			},
		},
	},
	config
);
