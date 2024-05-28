import type { CardDesign, CardInstance } from '../db.types';
import type { PackDetails } from './entity-schemas';
import { db } from '../db';
import { PackTypeIsOutOfCardsError } from './errors';
import { getRarityRankForRarity } from './site-config';

export type CardPool = {
	CardDesigns: CardDesign[];
	CardInstances: CardInstance[];
};

export async function generateCard(info: {
	userId?: string;
	username?: string;
	packId: string | undefined;
	cardPool: CardPool;
}) {
	console.log('Generating card: ', { ...info, cardPool: [] });
	// Steps:
	// 1. Take all the designs and instances, and generate a list of remaining possible cards that can be generated
	const { CardDesigns } = info.cardPool;

	if (CardDesigns.length === 0) {
		throw new PackTypeIsOutOfCardsError('No designs found');
	}

	const possibleCardsList = getRemainingPossibleCardsFromCardPool(info.cardPool);

	if (possibleCardsList.length === 0) {
		throw new PackTypeIsOutOfCardsError('No cards remaining');
	}

	const {
		designId: assignedDesignId,
		rarityId: assignedRarityId,
		cardNumber: assignedCardNumber,
	} = possibleCardsList[Math.floor(Math.random() * possibleCardsList.length)];
	const design = CardDesigns.find(design => design.designId === assignedDesignId)!;
	const rarity = design.rarityDetails?.find(rarity => rarity.rarityId === assignedRarityId);

	if (!rarity) throw new PackTypeIsOutOfCardsError('No rarity found');

	const totalOfType = rarity?.count;
	const instanceId = generateInstanceId({
		seasonId: design.seasonId,
		designId: design.designId,
		rarityId: assignedRarityId,
		cardNumber: assignedCardNumber,
	});

	const cardDetails = {
		seasonId: design.seasonId,
		seasonName: design.seasonName,
		designId: design.designId,
		rarityId: assignedRarityId,
		rarityName: rarity.rarityName,
		rarityColor: rarity.rarityColor,
		rarityRank: await getRarityRankForRarity(rarity),
		frameUrl: rarity.frameUrl,
		imgUrl: design.imgUrl,
		cardName: design.cardName,
		cardDescription: design.cardDescription,
		instanceId,
		username: info.username,
		userId: info.userId,
		minterId: info.userId,
		minterUsername: info.username,
		openedAt: info.packId ? undefined : new Date().toISOString(),
		packId: info.packId,
		cardNumber: assignedCardNumber,
		totalOfType,
	} satisfies CardInstance;

	console.log('Generated card', {
		seasonId: design.seasonId,
		seasonName: design.seasonName,
		designId: design.designId,
		cardName: design.cardName,
		rarityId: assignedRarityId,
		rarityName: rarity.rarityName,
		instanceId,
		username: info.username,
		userId: info.userId,
		packId: info.packId,
	});

	return cardDetails;
}

export function getRemainingPossibleCardsFromCardPool(cardPool: CardPool) {
	const { CardDesigns, CardInstances: existingInstances } = cardPool;

	if (CardDesigns.length === 0) {
		throw new Error('No designs found');
	}

	const possibleCardsList = [];
	for (const design of CardDesigns) {
		if (!design.rarityDetails) continue;
		for (const rarity of design.rarityDetails) {
			for (let i = 0; i < rarity.count; i++) {
				possibleCardsList.push({
					designId: design.designId,
					rarityId: rarity.rarityId,
					cardNumber: i + 1,
					totalOfType: rarity.count,
				});
			}
		}
	}

	for (const card of existingInstances) {
		// remove the card from the list of possible cards
		const index = possibleCardsList.findIndex(
			possibleCard =>
				possibleCard.designId === card.designId &&
				possibleCard.rarityId === card.rarityId &&
				possibleCard.cardNumber === card.cardNumber
		);
		if (index !== -1) {
			possibleCardsList.splice(index, 1);
		}
	}

	return possibleCardsList;
}

export async function getCardPoolFromType(packType: PackDetails['packType']): Promise<CardPool> {
	if (packType.packTypeCategory === 'season') {
		const seasonId = packType.seasonId;
		if (!seasonId) throw new Error('SeasonId is required for season packs');
		const cardPool = await db.collections
			.SeasonAndDesignsAndCards({ seasonId })
			.go({ pages: 'all' });

		console.debug('cardPool length:', cardPool.data.CardInstances.length);
		return cardPool.data;
	}

	if (packType.packTypeCategory === 'custom') {
		if (!packType.designs) throw new Error('Designs are required for custom packs');
		const cardPool = await Promise.all(
			packType.designs.map(async design => {
				const results = await db.collections
					.DesignAndCards({ designId: design.designId })
					.go({
						pages: 'all',
					});
				return results.data;
			})
		).then(res =>
			res.reduce(
				(accum, design) => ({
					CardDesigns: [...accum.CardDesigns, ...design.CardDesigns],
					CardInstances: [...accum.CardInstances, ...design.CardInstances],
				}),
				{
					CardDesigns: [],
					CardInstances: [],
				}
			)
		);
		return cardPool;
	}

	throw new Error('Invalid packTypeCategory');
}

/**
 * Generate a card instance ID using the standard format for the site
 * @returns `${seasonId}-${designId}-${rarityId}-${cardNumber}`
 */
export function generateInstanceId(opts: {
	seasonId: string;
	designId: string;
	rarityId: string;
	cardNumber: number;
}) {
	return `${opts.seasonId}-${opts.designId}-${opts.rarityId}-${opts.cardNumber}`;
}
