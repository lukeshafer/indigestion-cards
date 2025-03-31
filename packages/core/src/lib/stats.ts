import type { CardDesign, CardInstance } from '../db.types';
import { FULL_ART_ID } from '../constants';
import { InputValidationError } from './errors';
import { getSeasonAndDesignsBySeasonId } from './season';
import { z } from 'zod';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Bucket } from 'sst/node/bucket';

const s3 = new S3Client();

type NumberRange = {
	min: number;
	max: number;
};

const schemas = {
	get numberRange() {
		return z.object({
			min: z.number(),
			max: z.number(),
		});
	},

	get fullSiteStatistics() {
		/*
		 * Other ideas?
		 * number of trades
		 * number of shit stamps
		 */
		return z.object({
			cardsOpened: z.number(),
			cardsShitStamped: z.number(),
			tradesCompleted: z.number(),
			tradesRejected: z.number(),
			cardsTraded: z.number(),
		});
	},

	get seasonStatistics() {
		return z.object({
			season: z.object({ seasonName: z.string(), seasonId: z.string() }),
			cardDesigns: z.array(z.object({ cardName: z.string(), designId: z.string() })),

			cardsOpened: z.number(),
			cardsPossible: schemas.numberRange,
			cardsRemaining: schemas.numberRange,
			percentageOpened: schemas.numberRange,

			cardsShitStamped: z.number(),

			packsOpened: z.number(),
			packsUnopened: z.number(),
			packsRemaining: schemas.numberRange,
			packsPossible: schemas.numberRange,

			fullArt: schemas.fullArtStatistics,

			rarities: z.array(schemas.rarityStatistics),
		});
	},

	get fullArtStatistics() {
		return z.object({
			cardsOpened: z.number(),
			allOpened: z.boolean(),
		});
	},

	get rarityStatistics() {
		return z.object({
			cardsOpened: z.number(),
			cardsPossible: z.number(),
			cardsRemaining: z.number(),
			percentageOpened: z.number(),

			rarityName: z.string(),
			rarityId: z.string(),
			background: z.string(),
		});
	},
};

export type SeasonStatistics = z.infer<typeof schemas.seasonStatistics>;
export type RarityStatistics = z.infer<typeof schemas.rarityStatistics>;
export type FullArtStatistics = z.infer<typeof schemas.fullArtStatistics>;

const PACK_SIZE = 5;

async function generateSeasonStatistics(seasonId: string): Promise<SeasonStatistics> {
	const {
		Seasons: [season],
		CardDesigns: cardDesigns,
		CardInstances: unopenedAndOpenedCardInstances,
	} = await getSeasonAndDesignsBySeasonId(seasonId);

	if (!season) {
		throw new InputValidationError(`Invalid season id: ${seasonId}`);
	}

	const cardsOpened = unopenedAndOpenedCardInstances.filter(card => card.openedAt != undefined);
	const cardsPossible = getTotalPossibleCardCount({ cardDesigns, cardsOpened });
	const cardsRemaining: NumberRange = {
		min: cardsPossible.min - cardsOpened.length,
		max: cardsPossible.max - cardsOpened.length,
	};
	const percentageDistributed: NumberRange = {
		min: cardsOpened.length / cardsPossible.max,
		max: cardsOpened.length / cardsPossible.min,
	};

	const packsOpened = cardsOpened.length / PACK_SIZE;
	const packsUnopened = (unopenedAndOpenedCardInstances.length - cardsOpened.length) / PACK_SIZE;
	const totalPacksGenerated = packsOpened + packsUnopened;
	const packsRemaining: NumberRange = {
		min: Math.floor(cardsRemaining.min / PACK_SIZE) - packsUnopened,
		max: Math.floor(cardsRemaining.max / PACK_SIZE) - packsUnopened,
	};
	const packsPossible: NumberRange = {
		min: totalPacksGenerated + packsRemaining.min,
		max: totalPacksGenerated + packsRemaining.max,
	};

	console.log('Designs', cardDesigns);

	return {
		season: { seasonName: season.seasonName, seasonId: season.seasonId },
		cardDesigns: cardDesigns.map(({ cardName, designId }) => ({ cardName, designId })),

		cardsOpened: cardsOpened.length,
		cardsPossible,
		cardsRemaining,
		percentageOpened: percentageDistributed,

		cardsShitStamped: cardsOpened.filter(c => c.stamps?.includes('shit-pack')).length,

		packsOpened,
		packsUnopened,
		packsRemaining,
		packsPossible,

		fullArt: getFullArtStatistics({ cardDesigns, cardsOpened }),
		rarities: getRarityStatistics({ cardDesigns, cardsOpened }),
	};
}

function getTotalPossibleCardCount(opts: {
	cardDesigns: Array<CardDesign>;
	cardsOpened: Array<CardInstance>;
}): NumberRange {
	let minTotal = 0;
	for (let card of opts.cardDesigns) {
		for (let rarity of card.rarityDetails ?? []) {
			if (rarity.rarityId.startsWith(FULL_ART_ID)) {
				// We skip full arts to keep their total counts a mystery
				continue;
			}

			minTotal += rarity.count;
		}
	}

	let min = minTotal + opts.cardsOpened.reduce<number>(countFullArts, 0);
	min -= min % PACK_SIZE;

	let max = minTotal + opts.cardDesigns.length;
	max -= max % PACK_SIZE;

	return { min, max };
}

function getFullArtStatistics(opts: {
	cardDesigns: Array<CardDesign>;
	cardsOpened: Array<CardInstance>;
}): FullArtStatistics {
	let cardsOpened = opts.cardsOpened.filter(c => c.rarityId.startsWith(FULL_ART_ID)).length;

	let cardsPossible = 0;

	for (let design of opts.cardDesigns) {
		for (let rarity of design.rarityDetails ?? []) {
			if (rarity.rarityId.startsWith(FULL_ART_ID) && rarity.count > 0) {
				cardsPossible += rarity.count;
			}
		}
	}

	return {
		cardsOpened,
		allOpened: cardsPossible === cardsOpened,
	};
}

function getRarityStatistics(opts: {
	cardDesigns: Array<CardDesign>;
	cardsOpened: Array<CardInstance>;
}): Array<RarityStatistics> {
	let rarityMap = new Map<string, RarityStatistics>();

	for (let design of opts.cardDesigns) {
		for (let rarity of design.rarityDetails ?? []) {
			if (rarity.count > 0 && !rarity.rarityId.startsWith(FULL_ART_ID)) {
				let prev = rarityMap.get(rarity.rarityId);
				rarityMap.set(rarity.rarityId, {
					cardsOpened: 0,
					cardsRemaining: 0,
					percentageOpened: 0,
					cardsPossible: (prev?.cardsPossible ?? 0) + rarity.count,

					rarityName: rarity.rarityName,
					rarityId: rarity.rarityId,
					background: rarity.rarityColor,
				});
			}
		}
	}

	for (let [rarityId, stats] of rarityMap) {
		let rarityCardsOpened = opts.cardsOpened.filter(c => c.rarityId.startsWith(rarityId));

		stats.cardsOpened = rarityCardsOpened.length;
		stats.cardsRemaining = stats.cardsPossible - rarityCardsOpened.length;
		stats.percentageOpened = rarityCardsOpened.length / stats.cardsPossible;
	}

	return Array.from(rarityMap.values());
}

export interface AdminRarityStats {
	rarityId: string;
	rarityName: string;
	received: number;
	unopened: number;
	opened: number;
	notGivenOut: number;
	total: number;
	instances: Array<CardInstance | null>;
}

export function getRarityStatsOverviewFromDesignAndInstances(
	design: CardDesign,
	cardInstances: Array<CardInstance>
) {
	const rarityStats = {} as Record<string, AdminRarityStats>;
	design.rarityDetails?.forEach(rarity => {
		rarityStats[rarity.rarityId] = {
			rarityId: rarity.rarityId,
			rarityName: rarity.rarityName,
			received: 0,
			unopened: 0,
			opened: 0,
			notGivenOut: rarity.count,
			total: rarity.count,
			instances: new Array<CardInstance | null>(rarity.count).fill(null),
		};
	});

	cardInstances.forEach(instance => {
		const rarityId = instance.rarityId;
		const rarity = rarityStats[rarityId];
		if (!rarity) return;

		rarity.received += 1;
		rarity.unopened += instance.openedAt ? 0 : 1;
		rarity.opened += instance.openedAt ? 1 : 0;
		rarity.notGivenOut -= 1;
		rarity.instances[instance.cardNumber - 1] = instance;
	});

	return Object.values(rarityStats);
}

const countFullArts = (count: number, card: CardInstance) =>
	card.rarityId.startsWith(FULL_ART_ID) ? count + 1 : count;

const STATISTICS_PREFIX = 'statistics';
export async function updateSeasonStatistics(seasonId: string): Promise<void> {
	const statistics = await generateSeasonStatistics(seasonId);

	await s3.send(
		new PutObjectCommand({
			Bucket: Bucket.DataSummaries.bucketName,
			Key: `${STATISTICS_PREFIX}/${seasonId}`,
			Body: JSON.stringify(statistics),
		})
	);
}

export async function getSeasonStatistics(seasonId: string): Promise<SeasonStatistics> {
	console.log('Fetching statistics from S3');
	let body;
	try {
		let object = await s3.send(
			new GetObjectCommand({
				Bucket: Bucket.DataSummaries.bucketName,
				Key: `${STATISTICS_PREFIX}/${seasonId}`,
			})
		);
		body = await object.Body?.transformToString();
		if (body == undefined) {
			throw new Error('Body not found.');
		}
	} catch (e) {
		console.error(e);
		let statistics = await generateSeasonStatistics(seasonId);

		await s3.send(
			new PutObjectCommand({
				Bucket: Bucket.DataSummaries.bucketName,
				Key: `${STATISTICS_PREFIX}/${seasonId}`,
				Body: JSON.stringify(statistics),
			})
		);

		return statistics;
	}

	let statistics = schemas.seasonStatistics.safeParse(JSON.parse(body));

	if (statistics.success === false) {
		let statistics = await generateSeasonStatistics(seasonId);

		await s3.send(
			new PutObjectCommand({
				Bucket: Bucket.DataSummaries.bucketName,
				Key: `${STATISTICS_PREFIX}/${seasonId}`,
				Body: JSON.stringify(statistics),
			})
		);

		return statistics;
	}

	return statistics.data;
}
