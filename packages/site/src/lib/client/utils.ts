import { FULL_ART_ID, LEGACY_CARD_ID, routes } from '@/constants';
import type { CardDesign } from '@lil-indigestion-cards/core/db/cardDesigns';
import type { CardInstance } from '@lil-indigestion-cards/core/db/cardInstances';
import type { Trade } from '@lil-indigestion-cards/core/db/trades';
import type { RarityRankingRecord } from '@lil-indigestion-cards/core/lib/site-config';
import { z } from 'astro/zod';

export const useViewTransition = (cb: () => unknown) =>
	// @ts-expect-error - startViewTransition is not on Document yet
	document.startViewTransition ? document.startViewTransition(cb) : cb();

export type CardProps = Partial<CardInstance> &
	Partial<CardDesign> & {
		rarityName: string;
		frameUrl: string;
		imgUrl: string;
		cardName: string;
		cardDescription: string;
		designId: string;
		cardNumber: number;
		totalOfType: number;
		scale?: number | string;
		instanceId?: string;
		rarityColor: string;
		rarityId: string;
		username?: string;
	};

export type CardType = CardProps;

export const cardListItemSchema = z.object({
	rarityName: z.string(),
	cardName: z.string(),
	cardDescription: z.string(),
	designId: z.string(),
	cardNumber: z.number(),
	totalOfType: z.number(),
	rarityId: z.string(),
	instanceId: z.string().optional(),
	username: z.string().optional(),
	openedAt: z.string().optional(),
	frameUrl: z.string(),
	imgUrl: z.string(),
	rarityColor: z.string(),
}) satisfies z.Schema<CardType>;
export type CardListItem = z.infer<typeof cardListItemSchema>;

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

export function sortCards<T extends CardListItem>(args: {
	cards: T[];
	// eslint-disable-next-line @typescript-eslint/ban-types
	sort: SortType | (string & {});
	rarityRanking?: RarityRankingRecord;
}) {
	const { cards: originalCards, sort } = args;
	const cards = originalCards.slice();

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

export function formatTradeLink(trade: Trade, reverse = false): string {
	const params = new URLSearchParams({
		receiverUsername: reverse ? trade.senderUsername : trade.receiverUsername,
	});

	trade.requestedCards.forEach(c => params.append(reverse ? 'offeredCards' : 'requestedCards', c.instanceId));
	trade.offeredCards.forEach(c => params.append(reverse ? 'requestedCards' : 'offeredCards', c.instanceId));

	return routes.TRADES + '/new?' + params.toString();
}
