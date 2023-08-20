import { FULL_ART_ID, NO_CARDS_OPENED_ID } from 'src/constants';
import { db } from '../db';

export async function migration({ force = false } = {}) {
	const designs = db.entities.cardDesigns;

	const cards = await designs.scan.go();
	let count = 0;
	for (const card of cards.data) {
		console.log(`Processing card ${++count} of ${cards.data.length}`);
		if (card.bestRarityFound && force !== true) {
			console.log('Skipping card because it already has a bestRarityFound');
			continue;
		}

		console.log('Updating card with bestRarityFound');

		const instances = (
			await db.entities.cardInstances.query.byId({ designId: card.designId }).go()
		).data;

		const bestRarityFound = instances.length
			? instances.reduce(
					(acc, curr) => {
						if (!curr.openedAt) return acc;
						if (curr.totalOfType < acc.count || curr.rarityId === FULL_ART_ID)
							return {
								count: curr.totalOfType,
								rarityId: curr.rarityId,
								rarityName: curr.rarityName,
								rarityColor: curr.rarityColor,
								frameUrl: curr.frameUrl,
							};
						return acc;
					},
					{
						count: 99999999,
						rarityId: NO_CARDS_OPENED_ID,
						rarityName: 'No cards opened',
						rarityColor: 'transparent',
						frameUrl: '',
					}
			  )
			: {
					count: 99999999,
					rarityId: NO_CARDS_OPENED_ID,
					rarityName: 'No cards opened',
					rarityColor: 'transparent',
					frameUrl: '',
			  };

		await designs.update({ designId: card.designId }).set({ bestRarityFound }).go();
	}
}
