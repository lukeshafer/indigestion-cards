import type { CardDesign, CardInstance, Season } from '../db.types';
import { FULL_ART_ID } from '../constants';
import { InputValidationError } from './errors';
import { getSeasonAndDesignsBySeasonId } from './season';

type NumberRange = {
	min: number;
	max: number;
};

export type SeasonStatistics = {
	season: Pick<Season, 'seasonName' | 'seasonId'>;
	cardDesigns: Array<Pick<CardDesign, 'cardName' | 'designId'>>;

	cardsOpened: number;
	cardsPossible: NumberRange;
	cardsRemaining: NumberRange;
	percentageOpened: NumberRange;

	packsOpened: number;
	packsUnopened: number;
	packsRemaining: NumberRange;
	packsPossible: NumberRange;

	rarities: {
		fullArt: FullArtStatistics;
		pink: RarityStatistics;
		rainbow: RarityStatistics;
		white: RarityStatistics;
		gold: RarityStatistics;
		silver: RarityStatistics;
		bronze: RarityStatistics;
	};
};

export type RarityStatistics = {
	cardsOpened: number;
	cardsPossible: number;
	cardsRemaining: number;
	percentageOpened: number;

	background: string;
};

export type FullArtStatistics = {
	cardsOpened: number;
	allOpened: boolean;
};

const PACK_SIZE = 5;

export async function getSeasonStatistics(seasonId: string): Promise<SeasonStatistics> {
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

		packsOpened,
		packsUnopened,
		packsRemaining,
		packsPossible,

		rarities: {
			fullArt: getFullArtStatistics({ cardDesigns, cardsOpened }),
			pink: getRarityStatistics({ rarityId: 'pink', cardDesigns, cardsOpened }),
			rainbow: getRarityStatistics({ rarityId: 'rainbow', cardDesigns, cardsOpened }),
			white: getRarityStatistics({ rarityId: 'white', cardDesigns, cardsOpened }),
			gold: getRarityStatistics({ rarityId: 'gold', cardDesigns, cardsOpened }),
			silver: getRarityStatistics({ rarityId: 'silver', cardDesigns, cardsOpened }),
			bronze: getRarityStatistics({ rarityId: 'bronze', cardDesigns, cardsOpened }),
		},
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
	let rarityStats = getRarityStatistics({ ...opts, rarityId: FULL_ART_ID });

	return {
		cardsOpened: rarityStats.cardsOpened,
		allOpened: rarityStats.cardsRemaining === 0,
	};
}

function getRarityStatistics(opts: {
	rarityId: string;
	cardDesigns: Array<CardDesign>;
	cardsOpened: Array<CardInstance>;
}): RarityStatistics {
	let rarityCardsOpened = opts.cardsOpened.filter(c => c.rarityId.startsWith(opts.rarityId));

	let cardsPossible = 0;

	let background = '';
	for (let design of opts.cardDesigns) {
		for (let rarity of design.rarityDetails ?? []) {
			if (rarity.rarityId.startsWith(opts.rarityId) && rarity.count > 0) {
				cardsPossible += rarity.count;
				background = rarity.rarityColor;
			}
		}
	}

	let cardsRemaining = cardsPossible - rarityCardsOpened.length;
	let percentageDistributed = rarityCardsOpened.length / cardsPossible;

	return {
		cardsOpened: rarityCardsOpened.length,
		cardsPossible,
		cardsRemaining,
		percentageOpened: percentageDistributed,

		background,
	};
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
