import { db as toDB, DB_SERVICE, auditAttributes } from '../db';
import { Entity } from 'electrodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { putDataRecoveryInfo } from '../lib/data-recovery';
import type { CardInstance } from '../db.types';
import { getRarityRankForRarity, getSiteConfig } from '../lib/site-config';

export async function migrateFromBackupTable() {
	const siteConfig = await getSiteConfig();

	if (!process.env.BACKUP_TABLE_NAME) {
		throw new Error('backup table not setup');
	}

	if (process.env.BACKUP_TABLE_NAME === 'dev mode') {
		console.log('process.env', process.env);
		return;
	}

	const fromCards = CardInstancesV1(process.env.BACKUP_TABLE_NAME);
	const toCards = toDB.entities.CardInstances;

	const oldCards = await fromCards.scan.go({ pages: 'all' });

	const results = {
		counts: {
			exists: 0,
			added: 0,
			failed: 0,
			replaced: 0,
		},
		replaced: <{ old: object; new: object }[]>[],
		added: <object[]>[],
		failed: <object[]>[],
	};
	for (const card of oldCards.data) {
		const existingCard = await toCards
			.get({ designId: card.designId, instanceId: card.instanceId })
			.go();
		if (existingCard.data == null) {
			try {
				await toCards
					.put({
						...card,
						rarityRank: await getRarityRankForRarity(card, siteConfig.rarityRanking),
					})
					.go();
				results.added.push(trimCard(card));
				results.counts.added += 1;
			} catch {
				results.failed.push(trimCard(card));
				results.counts.failed += 1;
			}
		} else if (existingCard.data.createdAt !== card.createdAt) {
			results.replaced.push({ old: trimCard(card), new: trimCard(existingCard.data) });
			results.counts.replaced += 1;
		} else {
			results.counts.exists += 1;
		}
	}

	await putDataRecoveryInfo('20230511', results);

	return results;
}

function trimCard(
	card: Pick<
		CardInstance,
		| 'instanceId'
		| 'cardName'
		| 'rarityName'
		| 'cardNumber'
		| 'totalOfType'
		| 'username'
		| 'createdAt'
		| 'minterUsername'
		| 'seasonName'
		| 'packId'
		| 'openedAt'
	>
) {
	return {
		instanceId: card.instanceId,
		cardName: card.cardName,
		rarityName: card.rarityName,
		cardNumber: card.cardNumber,
		totalOfType: card.totalOfType,
		username: card.username,
		createdAt: card.createdAt,
		minterUsername: card.minterUsername,
		seasonName: card.seasonName,
		packId: card.packId,
		openedAt: card.openedAt,
	};
}

const CardInstancesV1 = (table: string) =>
	new Entity(
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
			},
		},
		{
			table: table,
			client: new DynamoDBClient(),
		}
	);
