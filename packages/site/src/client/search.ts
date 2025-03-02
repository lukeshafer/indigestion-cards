import type { CardDesign, CardInstance } from '@core/types';
import Fuse from 'fuse.js';

export function getCardSearcher<T extends CardDesign | CardInstance>(cards: T[]) {
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
			{
				name: 'seasonName',
				weight: 2,
			},
			{
				name: 'cardNumber',
				weight: 2,
			},
			{
				name: 'username',
				weight: 1,
			},
			{
				name: 'stamps',
				weight: 1,
			},
		],
	});

	return (searchTerm: string) => fuse.search(searchTerm).map(result => result.item);
}
