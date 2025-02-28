import { getAllCardDesigns, getCardDesignAndInstancesById } from '@core/lib/design';

export async function getPacksRemaining() {
	const designs = await getAllCardDesigns();

	const promises: Array<Promise<DesignCountData>> = [];
	for (let design of designs) {
		promises.push(
			getCardDesignAndInstancesById({ designId: design.designId }).then(result => {
				const ownedCards = result.CardInstances.length;
				const possibleCards =
					design.rarityDetails?.reduce((acc, rarity) => {
						return acc + rarity.count;
					}, 0) ?? 0;
				const remainingCards = possibleCards - ownedCards;

				return {
					seasonId: design.seasonId,
					seasonName: design.seasonName,
					ownedCards,
					possibleCards,
					remainingCards,
				};
			})
		);
	}
	const designCountData = await Promise.all(promises);

	const counts = new Map<string, DesignCountData>();
	for (let data of designCountData) {
		const prev = counts.get(data.seasonId);
		counts.set(data.seasonId, {
			seasonId: data.seasonId,
			seasonName: data.seasonName,
			ownedCards: data.ownedCards + (prev?.ownedCards ?? 0),
			possibleCards: data.possibleCards + (prev?.possibleCards ?? 0),
			remainingCards: data.remainingCards + (prev?.remainingCards ?? 0),
		});
	}

	return Array.from(counts.values());
}

interface DesignCountData {
	seasonId: string;
	seasonName: string;
	ownedCards: number;
	possibleCards: number;
	remainingCards: number;
}
