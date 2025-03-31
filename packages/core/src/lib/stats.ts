import type { CardDesign, CardInstance } from '../db.types';
import { FULL_ART_ID } from '../constants';
import { InputValidationError } from './errors';
import { getAllSeasons, getSeasonAndDesignsBySeasonId } from './season';
import { z } from 'zod';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Bucket } from 'sst/node/bucket';
import { getAllUsers } from './user';
import { getOutgoingTradesByUserId } from './trades';

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

	get siteStatistics() {
		return z.object({
			cardsOpened: z.number(),
			cardsShitStamped: z.number(),
			packsOpened: z.number(),
			packsUnopened: z.number(),
			cardsTraded: z.number(),
			packsTraded: z.number(),

			tradesCompleted: z.number(),
			tradesRejected: z.number(),
			tradesCanceled: z.number(),
			tradesFailed: z.number(),
			tradesPending: z.number(),

			seasons: z.array(schemas.seasonStatistics),
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

export type SiteStatistics = z.infer<typeof schemas.siteStatistics>;
export type SeasonStatistics = z.infer<typeof schemas.seasonStatistics>;
export type RarityStatistics = z.infer<typeof schemas.rarityStatistics>;
export type FullArtStatistics = z.infer<typeof schemas.fullArtStatistics>;

async function generateSeasonStatistics(seasonId: string): Promise<SeasonStatistics> {
	const PACK_SIZE = seasonId === 'moments' ? 1 : 5;
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
	// cardsPossible.min -= cardsPossible.min % PACK_SIZE;
	// cardsPossible.max -= cardsPossible.max % PACK_SIZE;

	const cardsRemaining: NumberRange = {
		min: cardsPossible.min - cardsOpened.length,
		max: cardsPossible.max - cardsOpened.length,
	};
	const percentageDistributed: NumberRange = {
		min: cardsOpened.length / cardsPossible.max,
		max: cardsOpened.length / cardsPossible.min,
	};

	const packsOpened = Math.floor(cardsOpened.length / PACK_SIZE);
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

async function generateFullSiteStatistics(): Promise<SiteStatistics> {
	const seasons = await getAllSeasons();

	const seasonStats = await Promise.all(seasons.map(s => generateSeasonStatistics(s.seasonId)));

	const siteStats: SiteStatistics = {
		cardsOpened: 0,
		cardsShitStamped: 0,
		packsOpened: 0,
		packsUnopened: 0,

		cardsTraded: 0,
		packsTraded: 0,

		tradesCompleted: 0,
		tradesRejected: 0,
		tradesCanceled: 0,
		tradesFailed: 0,
		tradesPending: 0,

		seasons: seasonStats,
	};

	for (let season of seasonStats) {
		siteStats.cardsOpened += season.cardsOpened;
		siteStats.cardsShitStamped += season.cardsShitStamped;
		siteStats.packsOpened += season.packsOpened;
		siteStats.packsUnopened += season.packsUnopened;
	}

	const users = await getAllUsers();
	const trades = (await Promise.all(users.map(u => getOutgoingTradesByUserId(u.userId)))).flat();

	for (let trade of trades) {
		switch (trade.status) {
			case 'rejected':
				siteStats.tradesRejected += 1;
				break;
			case 'completed':
				siteStats.tradesCompleted += 1;
				siteStats.cardsTraded += trade.offeredCards.length + trade.requestedCards.length;
				siteStats.packsTraded +=
					(trade.offeredPacks?.length ?? 0) + (trade.requestedPacks?.length ?? 0);
				break;
			case 'canceled':
				siteStats.tradesCanceled += 1;
				break;
			case 'failed':
				siteStats.tradesFailed += 1;
				break;
			case 'pending':
				siteStats.tradesPending += 1;
				break;
		}
	}

	return siteStats;
}

function getTotalPossibleCardCount(opts: {
	cardDesigns: Array<CardDesign>;
	cardsOpened: Array<CardInstance>;
}): NumberRange {
	let minTotal = 0;
	let fullArtsPossible = 0;
	for (let card of opts.cardDesigns) {
		for (let rarity of card.rarityDetails ?? []) {
			if (rarity.rarityId.startsWith(FULL_ART_ID)) {
				fullArtsPossible += rarity.count;
				// We skip full arts to keep their total counts a mystery
				continue;
			}

			minTotal += rarity.count;
		}
	}

	let fullArtsOpened = opts.cardsOpened.reduce<number>(countFullArts, 0);
	let min = minTotal + fullArtsOpened;

	if (fullArtsOpened === fullArtsPossible) {
		return { min, max: min }; // if all full arts are open, there is no range
	}

	let max = minTotal + opts.cardDesigns.length;

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
const SEASON_STATS_PREFIX = 'seasons';
const SITE_STATS_NAME = 'full-site';
export async function updateSeasonStatistics(seasonId: string): Promise<void> {
	const statistics = await generateSeasonStatistics(seasonId);
	await putSeasonStatisticsInS3(seasonId, statistics);
}

export async function updateSiteStatistics(): Promise<void> {
	const statistics = await generateFullSiteStatistics();
	await putSiteStatisticsInS3(statistics);
}

async function putSeasonStatisticsInS3(
	seasonId: string,
	statistics: SeasonStatistics
): Promise<void> {
	await s3.send(
		new PutObjectCommand({
			Bucket: Bucket.DataSummaries.bucketName,
			Key: `${STATISTICS_PREFIX}/${SEASON_STATS_PREFIX}/${seasonId}`,
			Body: JSON.stringify(statistics),
		})
	);
}

async function putSiteStatisticsInS3(statistics: SiteStatistics): Promise<void> {
	await s3.send(
		new PutObjectCommand({
			Bucket: Bucket.DataSummaries.bucketName,
			Key: `${STATISTICS_PREFIX}/${SITE_STATS_NAME}`,
			Body: JSON.stringify(statistics),
		})
	);
}

export async function getSeasonStatistics(seasonId: string): Promise<SeasonStatistics> {
	console.log('Attempting to fetch season statistics from S3');
	let body;
	try {
		let object = await s3.send(
			new GetObjectCommand({
				Bucket: Bucket.DataSummaries.bucketName,
				Key: `${STATISTICS_PREFIX}/${SEASON_STATS_PREFIX}/${seasonId}`,
			})
		);
		body = await object.Body?.transformToString();
		if (body == undefined) {
			throw new Error('Body not found.');
		}
	} catch (e) {
		console.error(e);
		console.log('Unable to locate season statistics. Generating...');
		let statistics = await generateSeasonStatistics(seasonId);
		await putSeasonStatisticsInS3(seasonId, statistics);

		return statistics;
	}

	let statistics = schemas.seasonStatistics.safeParse(JSON.parse(body));

	if (statistics.success === false) {
		console.log('Existing season statistics use invalid schema. Re-generating...');
		let statistics = await generateSeasonStatistics(seasonId);

		await putSeasonStatisticsInS3(seasonId, statistics);

		return statistics;
	}

	return statistics.data;
}

export async function getSiteStatistics(): Promise<SiteStatistics> {
	console.log('Attempting to fetch site statistics from S3');
	let body;
	try {
		let object = await s3.send(
			new GetObjectCommand({
				Bucket: Bucket.DataSummaries.bucketName,
				Key: `${STATISTICS_PREFIX}/${SITE_STATS_NAME}`,
			})
		);
		body = await object.Body?.transformToString();
		if (body == undefined) {
			throw new Error('Body not found.');
		}
	} catch (e) {
		console.error(e);
		console.log('Unable to locate site statistics. Generating...');
		let statistics = await generateFullSiteStatistics();
		await putSiteStatisticsInS3(statistics);

		return statistics;
	}

	let statistics = schemas.siteStatistics.safeParse(JSON.parse(body));

	if (statistics.success === false) {
		console.log('Existing site statistics use invalid schema. Re-generating...');
		let statistics = await generateFullSiteStatistics();
		await putSiteStatisticsInS3(statistics);

		return statistics;
	}

	return statistics.data;
}
