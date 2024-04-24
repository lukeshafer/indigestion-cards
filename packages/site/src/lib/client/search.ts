import type { CardInstance } from '@core/types';
import Fuse from 'fuse.js';

export function getCardSearcher(cards: ( CardInstance & { checked: boolean } )[]) {
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
