import type { CardDesign, CardInstance, Season } from '../db.types';
import { FULL_ART_ID } from '../constants';
import { InputValidationError } from './errors';
import { getSeasonAndDesignsBySeasonId } from './season';

type NumberRange = {
	min: number;
	max: number;
};

export type SeasonStatistics = {
	season: Season;
	cardDesigns: Array<CardDesign>;

	cardsOpened: number;
	cardsPossible: NumberRange;
	cardsRemaining: NumberRange;
	percentageOpened: NumberRange;

	packsOpened: number;
	packsUnopened: number;
	packsRemaining: NumberRange;

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
};

export type FullArtStatistics = {
	cardsOpened: number;
	allOpened: boolean;
};

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

	const packsOpened = cardsOpened.length / 5;
	const packsUnopened = (unopenedAndOpenedCardInstances.length - cardsOpened.length) / 5;
	const packsRemaining: NumberRange = {
		min: Math.floor(cardsRemaining.min / 5),
		max: Math.floor(cardsRemaining.max / 5),
	};

	console.log('Designs', cardDesigns);

	return {
		season,
		cardDesigns,

		cardsOpened: cardsOpened.length,
		cardsPossible,
		cardsRemaining,
		percentageOpened: percentageDistributed,

		packsOpened,
		packsUnopened,
		packsRemaining,

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

	return {
		min:
			minTotal +
			opts.cardsOpened.reduce<number>(
				(count, card) => (card.rarityId.startsWith(FULL_ART_ID) ? count + 1 : count),
				0
			),
		max: minTotal + opts.cardDesigns.length,
	};
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

	for (let design of opts.cardDesigns) {
		for (let rarity of design.rarityDetails ?? []) {
			if (rarity.rarityId.startsWith(opts.rarityId)) {
				cardsPossible += rarity.count;
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
