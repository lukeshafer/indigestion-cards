import type { CardDesign } from '../db/cardDesigns';
import type { CardInstance } from '../db/cardInstances';
import { PackDetails } from './entity-schemas';
import { db } from 'src/db/db-service';

export type CardPool = {
	cardDesigns: CardDesign[];
	cardInstances: CardInstance[];
};

export function generateCard(info: {
	userId?: string;
	username?: string;
	packId: string | undefined;
	cardPool: CardPool;
}) {
	console.log('Generating card: ', { ...info, cardPool: [] });
	// Steps:
	// 1. Take all the designs and instances, and generate a list of remaining possible cards that can be generated
	const { cardDesigns } = info.cardPool;

	if (cardDesigns.length === 0) {
		throw new Error('No designs found');
	}

	const possibleCardsList = getRemainingPossibleCardsFromCardPool(info.cardPool);

	if (possibleCardsList.length === 0) {
		throw new Error('No possible cards found');
	}

	const {
		designId: assignedDesignId,
		rarityId: assignedRarityId,
		cardNumber: assignedCardNumber,
	} = possibleCardsList[Math.floor(Math.random() * possibleCardsList.length)];
	const design = cardDesigns.find((design) => design.designId === assignedDesignId)!;
	const rarity = design.rarityDetails?.find((rarity) => rarity.rarityId === assignedRarityId);

	if (!rarity) throw new Error('No rarity found');

	const totalOfType = rarity?.count;
	const instanceId = `${design.seasonId}-${design.designId}-${assignedRarityId}-${assignedCardNumber}`;

	const cardDetails = {
		seasonId: design.seasonId,
		seasonName: design.seasonName,
		designId: design.designId,
		rarityId: assignedRarityId,
		rarityName: rarity.rarityName,
		rarityColor: rarity.rarityColor,
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
	const { cardDesigns, cardInstances: existingInstances } = cardPool;

	if (cardDesigns.length === 0) {
		throw new Error('No designs found');
	}

	const possibleCardsList = [];
	for (const design of cardDesigns) {
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
			(possibleCard) =>
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
		const cardPool = await db.collections.seasonAndDesigns({ seasonId }).go({ pages: 'all' });
		return cardPool.data;
	}
	if (packType.packTypeCategory === 'custom') {
		if (!packType.designs) throw new Error('Designs are required for custom packs');
		const cardPool = await Promise.all(
			packType.designs.map(async (design) => {
				const results = await db.collections
					.designAndCards({ designId: design.designId })
					.go({ pages: 'all' });
				return results.data;
			})
		).then((res) =>
			res.reduce(
				(accum, design) => ({
					cardDesigns: [...accum.cardDesigns, ...design.cardDesigns],
					cardInstances: [...accum.cardInstances, ...design.cardInstances],
				}),
				{
					cardDesigns: [],
					cardInstances: [],
				}
			)
		);
		return cardPool;
	}

	throw new Error('Invalid packTypeCategory');
}
