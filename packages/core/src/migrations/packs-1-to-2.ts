import { Entity } from 'electrodb';
import { config, auditAttributes, db } from '../db';

export async function migration() {
	const packs = db.entities.packs;

	const toMove = await oldPacks.scan.go();
	let count = 0;
	for (const pack of toMove.data) {
		console.log(`Processing pack ${++count} of ${toMove.data.length}`);
		const newPack = {
			...pack,
			cardDetails: await Promise.all(
				pack.cardDetails.map(async (card, index) => {
					console.log(`Processing card ${index + 1} of ${pack.cardDetails.length}`);
					const cardEntity = await db.entities.cardInstances.query
						.byId({ designId: card.designId, instanceId: card.instanceId })
						.go();
					console.log({
						message: `Card ${index + 1} of ${pack.cardDetails.length} processed`,
						card: cardEntity.data,
					});
					return {
						...card,
						cardNumber: cardEntity.data[0].cardNumber,
						totalOfType: cardEntity.data[0].totalOfType,
					};
				})
			),
		};
		console.log({
			message: 'Creating new pack',
			packId: newPack.packId,
			pack: JSON.stringify(newPack, null, 2),
		});

		try {
			const result = await packs.create(newPack).go();
			if (result) {
				await oldPacks.delete(pack).go();
			}
		} catch (err) {
			console.error(err);
			if (await packs.query.byPackId({ packId: newPack.packId }).go()) {
				await oldPacks.delete(pack).go();
			} else throw err;
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
