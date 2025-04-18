import type { RarityRankingRecord } from '@core/lib/site-config';
import type { CardDesign, CollectionRulesSort } from '@core/types';
import { FULL_ART_ID, LEGACY_CARD_ID } from '@site/constants';

export const sortTypes = [
	{ value: 'rarest', label: 'Most to Least Rare' },
	{ value: 'common', label: 'Least to Most Rare' },
	{ value: 'card-name-asc', label: 'Card Name (A-Z)' },
	{ value: 'card-name-desc', label: 'Card Name (Z-A)' },
	{ value: 'open-date-desc', label: 'Date Opened (Newest to Oldest)' },
	{ value: 'open-date-asc', label: 'Date Opened (Oldest to Newest)' },
	{ value: 'owner-asc', label: 'Owner (A-Z)' },
	{ value: 'owner-desc', label: 'Owner (Z-A)' },
] as const satisfies Array<{ value: CollectionRulesSort; label: string }>;

export type SortType = (typeof sortTypes)[number]['value'];

export type SortInfo = {
	by: 'rarity' | 'cardName' | 'owner' | 'openDate';
	isReversed: boolean;
};
export function getSortInfo(sortType: SortType): SortInfo {
	switch (sortType) {
		case 'rarest':
			return {
				by: 'rarity',
				isReversed: false,
			};
		case 'common':
			return {
				by: 'rarity',
				isReversed: true,
			};
		case 'card-name-asc':
			return {
				by: 'cardName',
				isReversed: false,
			};
		case 'card-name-desc':
			return {
				by: 'cardName',
				isReversed: true,
			};
		case 'open-date-asc':
			return {
				by: 'openDate',
				isReversed: false,
			};
		case 'open-date-desc':
			return {
				by: 'openDate',
				isReversed: true,
			};
		case 'owner-asc':
			return {
				by: 'owner',
				isReversed: false,
			};
		case 'owner-desc':
			return {
				by: 'owner',
				isReversed: true,
			};
		default: {
			throw new Error('invalid (for now)');
		}
	}
}

type CardInstanceForSorting = {
	cardName: string;
	totalOfType?: number;
	bestRarityFound?: CardDesign['bestRarityFound'];
	cardNumber?: number;
	rarityId?: string;
	openedAt?: string;
	username?: string;
};

export function sortCards<T extends CardInstanceForSorting>(args: {
	cards: T[];
	sort: SortType | (string & {});
	rarityRanking?: RarityRankingRecord;
}) {
	const { cards: inputCards, sort } = args;
	const cards = inputCards.slice();

	switch (sort) {
		case 'card-name-asc':
			return cards.sort(
				(a, b) =>
					a.cardName.localeCompare(b.cardName) ||
					(a.totalOfType || 0) - (b.totalOfType || 0) ||
					(a.cardNumber || Infinity) - (b.cardNumber || Infinity)
			);
		case 'card-name-desc':
			return cards.sort(
				(a, b) =>
					b.cardName.localeCompare(a.cardName) ||
					(a.totalOfType || 0) - (b.totalOfType || 0) ||
					(a.cardNumber || Infinity) - (b.cardNumber || Infinity)
			);
		case 'rarest':
			return cards.sort((a, b) => rarestCardSort(a, b, args.rarityRanking));
		case 'common':
			return cards.sort((a, b) => rarestCardSort(a, b, args.rarityRanking)).reverse();
		case 'open-date-desc':
			return cards.sort((a, b) =>
				!(a.openedAt && b.openedAt)
					? 0
					: new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime() ||
						a.cardName.localeCompare(b.cardName) ||
						sortCardNumber(a, b)
			);
		case 'open-date-asc':
			return cards.sort((a, b) =>
				!(a.openedAt && b.openedAt)
					? 0
					: new Date(a.openedAt).getTime() - new Date(b.openedAt).getTime() ||
						a.cardName.localeCompare(b.cardName) ||
						sortCardNumber(a, b)
			);
		case 'owner-asc':
			return cards.sort((a, b) =>
				!(a.username && b.username)
					? 0
					: a.username.localeCompare(b.username) ||
						a.cardName.localeCompare(b.cardName) ||
						sortCardNumber(a, b)
			);
		case 'owner-desc':
			return cards.sort((a, b) =>
				!(a.username && b.username)
					? 0
					: b.username.localeCompare(a.username) ||
						a.cardName.localeCompare(b.cardName) ||
						sortCardNumber(a, b)
			);
		default:
			return cards;
	}
}

function rarestCardSort(
	a: CardInstanceForSorting,
	b: CardInstanceForSorting,
	rarityRanking?: RarityRankingRecord
) {
	if (rarityRanking) {
		const aRank = rarityRanking[a.rarityId ?? -1]?.ranking ?? Infinity;
		const bRank = rarityRanking[b.rarityId ?? -1]?.ranking ?? Infinity;
		return aRank - bRank;
	}

	if (a.totalOfType !== b.totalOfType) {
		return (a.totalOfType || 0) - (b.totalOfType || 0);
	}

	if (a.rarityId === LEGACY_CARD_ID && b.rarityId !== LEGACY_CARD_ID) {
		return -1;
	} else if (b.rarityId === LEGACY_CARD_ID && a.rarityId !== LEGACY_CARD_ID) {
		return 1;
	}
	if (a.rarityId === FULL_ART_ID && b.rarityId !== FULL_ART_ID) {
		return -1;
	} else if (b.rarityId === FULL_ART_ID && a.rarityId !== FULL_ART_ID) {
		return 1;
	}

	return a.cardName.localeCompare(b.cardName) || sortCardNumber(a, b);
}

function sortCardNumber(a: CardInstanceForSorting, b: CardInstanceForSorting) {
	return (a.cardNumber || Infinity) - (b.cardNumber || Infinity);
}
