import type { RarityRankingRecord } from "@core/lib/site-config";
import type { CardDesign, CardInstance } from "@core/types";
import { FULL_ART_ID, LEGACY_CARD_ID } from "@site/constants";

type CardListItem = {
	cardName: string;
	cardDescription: string;
	designId: string;
	imgUrl: string;
	rarityId: string;
	rarityName: string;
	frameUrl: string;
	rarityColor: string;
	cardNumber: number;
	totalOfType: number;
	username?: string | undefined;
	instanceId?: string | undefined;
	openedAt?: string | undefined;
};

export const sortTypes = [
	{ value: 'rarest', label: 'Most to Least Rare' },
	{ value: 'common', label: 'Least to Most Rare' },
	{ value: 'card-name-asc', label: 'Card Name (A-Z)' },
	{ value: 'card-name-desc', label: 'Card Name (Z-A)' },
	{ value: 'open-date-desc', label: 'Date Opened (Newest to Oldest)' },
	{ value: 'open-date-asc', label: 'Date Opened (Oldest to Newest)' },
	{ value: 'owner-asc', label: 'Owner (A-Z)' },
	{ value: 'owner-desc', label: 'Owner (Z-A)' },
] as const;

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

type CardInstanceForSorting =
	| Pick<CardInstance, 'cardName' | 'totalOfType' | 'cardNumber'>
	| Pick<CardDesign, 'cardName' | 'bestRarityFound'>;
export const sortCardsByName =
	(order: 'asc' | 'desc') => (a: CardInstanceForSorting, b: CardInstanceForSorting) =>
		a.cardName.localeCompare(b.cardName) ||
		getTotalOfTypeForSorting(a) - getTotalOfTypeForSorting(b) ||
		getCardNumberForSorting(a) - getCardNumberForSorting(b) * (order === 'asc' ? 1 : -1);

const getTotalOfTypeForSorting = (card: CardInstanceForSorting): number =>
	'totalOfType' in card ? card.totalOfType : (card.bestRarityFound?.count ?? 0);
const getCardNumberForSorting = (card: CardInstanceForSorting): number =>
	'cardNumber' in card ? card.cardNumber : 0;

export function sortCards<T extends CardListItem>(args: {
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
					a.totalOfType - b.totalOfType ||
					+a.cardNumber - +b.cardNumber
			);
		case 'card-name-desc':
			return cards.sort(
				(a, b) =>
					b.cardName.localeCompare(a.cardName) ||
					a.totalOfType - b.totalOfType ||
					+a.cardNumber - +b.cardNumber
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
						+a.cardNumber - +b.cardNumber
			);
		case 'open-date-asc':
			return cards.sort((a, b) =>
				!(a.openedAt && b.openedAt)
					? 0
					: new Date(a.openedAt).getTime() - new Date(b.openedAt).getTime() ||
						a.cardName.localeCompare(b.cardName) ||
						+a.cardNumber - +b.cardNumber
			);
		case 'owner-asc':
			return cards.sort((a, b) =>
				!(a.username && b.username)
					? 0
					: a.username.localeCompare(b.username) ||
						a.cardName.localeCompare(b.cardName) ||
						+a.cardNumber - +b.cardNumber
			);
		case 'owner-desc':
			return cards.sort((a, b) =>
				!(a.username && b.username)
					? 0
					: b.username.localeCompare(a.username) ||
						a.cardName.localeCompare(b.cardName) ||
						+a.cardNumber - +b.cardNumber
			);
		default:
			return cards;
	}
}

function rarestCardSort(a: CardListItem, b: CardListItem, rarityRanking?: RarityRankingRecord) {
	if (rarityRanking) {
		const aRank = rarityRanking[a.rarityId]?.ranking ?? Infinity;
		const bRank = rarityRanking[b.rarityId]?.ranking ?? Infinity;
		return aRank - bRank;
	}

	if (a.totalOfType !== b.totalOfType) {
		return a.totalOfType - b.totalOfType;
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

	return a.cardName.localeCompare(b.cardName) || +a.cardNumber - +b.cardNumber;
}
