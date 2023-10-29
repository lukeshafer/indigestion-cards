import type { CardInstance } from '@lil-indigestion-cards/core/db/cardInstances';
import Fuse from 'fuse.js';

export function getCardSearcher(cards: CardInstance[]) {
	const fuse = new Fuse(cards, {
		keys: [
			{
				name: 'cardName',
				weight: 5,
			},
			{
				name: 'rarityName',
				weight: 5,
			},
			'cardNumber',
			'stamps',
		],
	});

	return (searchTerm: string) => fuse.search(searchTerm).map((result) => result.item);
}
