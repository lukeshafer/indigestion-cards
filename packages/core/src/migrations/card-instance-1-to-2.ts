import { Entity } from 'electrodb';
import { db, dbConfig, DB_SERVICE, auditAttributes } from '../db';
import type { CardInstance } from '../db.types';
import { getRarityRankForRarity, getSiteConfig } from '../lib/site-config';

export async function migration() {
	const siteConfig = await getSiteConfig();

	const CardInstancesV2 = db.entities.CardInstances;

	const oldCards = await CardInstancesV1.scan.go({ pages: 'all' });

	let updatedCards: Array<CardInstance> = [];
	for (let card of oldCards.data) {
		let newCard = {
			...card,
			rarityRank: await getRarityRankForRarity(card, siteConfig.rarityRanking),
		};
		updatedCards.push(newCard);
	}

	await CardInstancesV2.put(updatedCards).go();

	for (let card of oldCards.data) {
		await CardInstancesV1.delete(card).go();
	}
}

const CardInstancesV1 = new Entity(
	{
		model: {
			entity: 'cardInstance',
			version: '1',
			service: DB_SERVICE,
		},
		attributes: {
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
			seasonId: {
				type: 'string',
				required: true,
			},
			seasonName: {
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
			rarityColor: {
				type: 'string',
				required: true,
			},
			userId: {
				type: 'string',
			},
			username: {
				type: 'string',
			},
			minterId: {
				type: 'string',
			},
			minterUsername: {
				type: 'string',
			},
			packId: {
				type: 'string',
			},
			openedAt: {
				type: 'string',
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
			tradeHistory: {
				type: 'list',
				items: {
					type: 'map',
					properties: {
						tradeId: {
							type: 'string',
							required: true,
						},
						fromUserId: {
							type: 'string',
							required: true,
						},
						fromUsername: {
							type: 'string',
							required: true,
						},
						toUserId: {
							type: 'string',
							required: true,
						},
						toUsername: {
							type: 'string',
							required: true,
						},
						completedAt: {
							type: 'number',
							required: true,
						},
						version: {
							type: 'number',
						},
						status: {
							type: ['rejected', 'canceled', 'completed', 'failed'] as const,
							required: true,
						},
					},
				},
			},
			...auditAttributes('cardInstance'),
		},
		indexes: {
			primary: {
				type: 'clustered',
				collection: 'DesignAndCards',
				pk: {
					field: 'pk',
					composite: ['designId'],
				},
				sk: {
					field: 'sk',
					composite: ['instanceId'],
				},
			},
			byDesignAndRarity: {
				index: 'gsi1',
				pk: {
					field: 'gsi1pk',
					composite: ['designId'],
				},
				sk: {
					field: 'gsi1sk',
					composite: ['rarityId', 'instanceId'],
				},
			},
			bySeason: {
				index: 'gsi2',
				type: 'clustered',
				collection: 'SeasonAndDesignsAndCards',
				pk: {
					field: 'gsi2pk',
					composite: ['seasonId'],
				},
				sk: {
					field: 'gsi2sk',
					composite: ['designId', 'instanceId'],
				},
			},
			byUser: {
				index: 'gsi3',
				type: 'clustered',
				collection: 'UserAndCards',
				pk: {
					field: 'gsi3pk',
					composite: ['username'],
				},
				sk: {
					field: 'gsi3sk',
					composite: ['instanceId'],
				},
			},
			byPackId: {
				index: 'gsi4',
				type: 'clustered',
				collection: 'PackAndCards',
				pk: {
					field: 'gsi4pk',
					composite: ['packId'],
				},
				sk: {
					field: 'gsi4sk',
					composite: ['instanceId'],
				},
			},
		},
	},
	dbConfig
);
