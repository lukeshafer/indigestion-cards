import { db } from '../db';
import type { CardInstance, SiteConfig } from '../db.types';
import { getUser } from './user';
import { getRarityRankForRarity } from './site-config';
import Fuse from 'fuse.js';

export async function deleteCardInstanceById(args: { designId: string; instanceId: string }) {
	const { data: card } = await db.entities.CardInstances.get(args).go();
	if (!card) throw new Error('Card not found');
	const user = card.userId ? await getUser(card.userId) : null;

	if (user) {
		const result = await db.transaction
			.write(({ CardInstances, Users }) => [
				CardInstances.delete(args).commit(),
				Users.patch({ userId: user.userId })
					.set({ cardCount: (user.cardCount || 1) - 1 })
					.commit(),
			])
			.go();
		return result.data;
	}

	const result = await db.entities.CardInstances.delete(args).go();
	return result.data;
}

export async function getCardInstanceById(args: { instanceId: string; designId: string }) {
	const result = await db.entities.CardInstances.get(args).go();
	return result.data;
}

export async function getCardInstanceByUsername(args: {
	username: string;
	instanceId: string;
}): Promise<CardInstance | undefined> {
	const result = await db.entities.CardInstances.query.byUser(args).go();
	return result.data[0];
}

export async function getCardInstanceByDesignAndRarity(args: {
	designId: string;
	rarityId: string;
}) {
	const result = await db.entities.CardInstances.query
		.byDesignAndRarity(args)
		.go({ pages: 'all' });
	return result.data;
}

export async function getCardInstanceByUsernameDesignRarityCardNumber(args: {
	username: string;
	designId: string;
	rarityId: string;
	cardNumber: string;
}) {
	const result = await db.entities.CardInstances.query
		.byDesignAndRarity({ rarityId: args.rarityId, designId: args.designId })
		.go({ pages: 'all' });

	const card = result.data.find(
		({ username, cardNumber }) =>
			username?.toLowerCase() === args.username.toLowerCase() &&
			String(cardNumber) === args.cardNumber
	);

	return card || null;
}

export async function batchUpdateCardUsernames(args: { oldUsername: string; newUsername: string }) {
	const cards = await db.entities.CardInstances.query
		.byUser({ username: args.oldUsername })
		.go({ pages: 'all' });

	const result = await db.entities.CardInstances.put(
		cards.data.map(card => ({
			...card,
			username:
				card.username?.toLowerCase() === args.oldUsername.toLowerCase()
					? args.newUsername
					: card.username,
			minterUsername:
				card.minterUsername?.toLowerCase() === args.oldUsername.toLowerCase()
					? args.newUsername
					: card.minterUsername,
		}))
	).go();

	return result;
}

export async function createCardInstance(card: CardInstance) {
	return db.entities.CardInstances.create(card).go();
}

export async function getCardsByUserSortedByRarity(options: {
	username: string;
	cursor?: string;
	isReversed?: boolean;
	ignoredIds?: Array<string>;
}): Promise<{
	data: Array<CardInstance>;
	cursor: string | null;
}> {
	const results = await db.entities.CardInstances.query
		.byUserSortedByRarity({ username: options.username })
		.where((attr, op) => {
			const conditions = [op.exists(attr.openedAt)];
			for (const id of options.ignoredIds ?? []) {
				conditions.push(op.ne(attr.instanceId, id));
			}
			return conditions.join(' and ');
		})
		.go({ cursor: options.cursor, count: 30, order: options.isReversed ? 'desc' : 'asc' });

	return results;
}

export async function getCardsByUserSortedByCardName(options: {
	username: string;
	cursor?: string;
	isReversed?: boolean;
	ignoredIds?: Array<string>;
}) {
	const results = await db.entities.CardInstances.query
		.byUserSortedByCardName({ username: options.username })
		.where((attr, op) => {
			const conditions = [op.exists(attr.openedAt)];
			for (const id of options.ignoredIds ?? []) {
				conditions.push(op.ne(attr.instanceId, id));
			}
			return conditions.join(' and ');
		})
		.go({ cursor: options.cursor, count: 30, order: options.isReversed ? 'desc' : 'asc' });

	return results;
}

export async function getCardsByUserSortedByOpenDate(options: {
	username: string;
	isReversed?: boolean;
	ignoredIds?: Array<string>;
}) {
	const results = await db.entities.CardInstances.query
		.byUser({ username: options.username })
		.where((attr, op) => {
			const conditions = [op.exists(attr.openedAt)];
			for (const id of options.ignoredIds ?? []) {
				conditions.push(op.ne(attr.instanceId, id));
			}
			return conditions.join(' and ');
		})
		.go({ pages: 'all' });

	return {
		data: results.data.sort(sortCardsByOpenDate(options.isReversed ? 'desc' : 'asc')),
		cursor: null,
	};
}

export async function getCardsByDesignSortedByRarity(options: {
	designId: string;
	cursor?: string;
	isReversed?: boolean;
}): Promise<{
	data: Array<CardInstance>;
	cursor: string | null;
}> {
	const results = await db.entities.CardInstances.query
		.byDesignSortedByRarity({ designId: options.designId })
		.where((attr, op) => op.exists(attr.openedAt))
		.go({ cursor: options.cursor, count: 30, order: options.isReversed ? 'desc' : 'asc' });

	return results;
}

export async function getCardsByDesignSortedByOwnerName(options: {
	designId: string;
	isReversed?: boolean;
}): Promise<{
	data: Array<CardInstance>;
	cursor: null;
}> {
	const results = await db.entities.CardInstances.query
		.byDesignSortedByRarity({ designId: options.designId })
		.where((attr, op) => op.exists(attr.openedAt))
		.go({ pages: 'all', order: options.isReversed ? 'desc' : 'asc' });

	return {
		data: results.data.sort(sortCardsByOwnerName(options.isReversed ? 'desc' : 'asc')),
		cursor: null,
	};
}

export async function getCardsByDesignSortedByOpenDate(options: {
	designId: string;
	isReversed?: boolean;
}): Promise<{
	data: Array<CardInstance>;
	cursor: null;
}> {
	const results = await db.entities.CardInstances.query
		.byDesignSortedByRarity({ designId: options.designId })
		.where((attr, op) => op.exists(attr.openedAt))
		.go({ pages: 'all', order: options.isReversed ? 'desc' : 'asc' });

	return {
		data: results.data.sort(sortCardsByOpenDate(options.isReversed ? 'desc' : 'asc')),
		cursor: null,
	};
}

export async function updateAllCardRarityRanks(
	newRanking: NonNullable<SiteConfig['rarityRanking']>
) {
	let allCards = await db.entities.CardInstances.scan.go({ pages: 'all' });

	const errors = [];
	for (const card of allCards.data) {
		try {
			const updatedRarity = await getRarityRankForRarity(card, newRanking);
			await db.entities.CardInstances.patch(card)
				.set({ rarityRank: updatedRarity })
				.composite({ cardName: card.cardName, cardNumberPadded: card.cardNumberPadded })
				.go();
		} catch (error) {
			console.error(error);
			errors.push(error);
		}
	}

	if (errors.length > 0) {
		console.error('Errors found:', errors.length);
		return Promise.reject('An error has occurred. Check log for details.');
	}
}

export async function searchUserCards(options: {
	username: string;
	searchText: string;
	sortType: 'rarity' | 'cardName' | 'openDate' | 'owner';
	isReversed?: boolean;
	ignoredIds?: Array<string>;
}) {
	switch (options.sortType) {
		case 'cardName': {
			const cards = await db.entities.CardInstances.query
				.byUserSortedByCardName({ username: options.username })
				.where((attr, op) => {
					const conditions = [op.exists(attr.openedAt)];
					for (const id of options.ignoredIds ?? []) {
						conditions.push(op.ne(attr.instanceId, id));
					}
					return conditions.join(' and ');
				})
				.go({ pages: 'all', order: options.isReversed ? 'desc' : 'asc' });
			return searchCards(options.searchText, cards.data);
		}
		case 'rarity': {
			const cards = await db.entities.CardInstances.query
				.byUserSortedByRarity({ username: options.username })
				.where((attr, op) => {
					const conditions = [op.exists(attr.openedAt)];
					for (const id of options.ignoredIds ?? []) {
						conditions.push(op.ne(attr.instanceId, id));
					}
					return conditions.join(' and ');
				})
				.go({ pages: 'all', order: options.isReversed ? 'desc' : 'asc' });
			return searchCards(options.searchText, cards.data);
		}
		case 'openDate': {
			const cards = await getCardsByUserSortedByOpenDate(options);
			return searchCards(options.searchText, cards.data);
		}
		default: {
			const cards = await db.entities.CardInstances.query
				.byUserSortedByRarity({ username: options.username })
				.where((attr, op) => {
					const conditions = [op.exists(attr.openedAt)];
					for (const id of options.ignoredIds ?? []) {
						conditions.push(op.ne(attr.instanceId, id));
					}
					return conditions.join(' and ');
				})
				.go({ pages: 'all', order: options.isReversed ? 'desc' : 'asc' });
			return searchCards(options.searchText, cards.data);
		}
	}
}

export async function searchDesignCards(options: {
	designId: string;
	searchText: string;
	sortType: 'rarity' | 'cardName' | 'openDate' | 'owner';
	isReversed?: boolean;
}) {
	const cards = await db.entities.CardInstances.query
		.byDesignSortedByRarity({ designId: options.designId })
		.where((attr, op) => op.exists(attr.openedAt))
		.go({ pages: 'all', order: options.isReversed ? 'desc' : 'asc' });

	switch (options.sortType) {
		case 'owner': {
			cards.data.sort(sortCardsByOwnerName(options.isReversed ? 'desc' : 'asc'));
			break;
		}
		case 'openDate': {
			cards.data.sort(sortCardsByOpenDate(options.isReversed ? 'desc' : 'asc'));
			break;
		}
	}

	return searchCards(options.searchText, cards.data);
}

function searchCards(searchText: string, cards: Array<CardInstance>) {
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

	return fuse.search(searchText).map(result => result.item);
}

function sortCardsByOwnerName(order: 'asc' | 'desc') {
	return (cardA: CardInstance, cardB: CardInstance) => {
		const sortValue = !(cardA.username && cardB.username)
			? 0
			: cardA.username.localeCompare(cardB.username) ||
				cardA.cardName.localeCompare(cardB.cardName) ||
				+cardA.cardNumber - +cardB.cardNumber;

		if (order === 'desc') return sortValue * -1;
		else return sortValue;
	};
}

function sortCardsByOpenDate(order: 'asc' | 'desc') {
	return (cardA: CardInstance, cardB: CardInstance) => {
		const sortValue =
			new Date(cardA.openedAt!).getTime() - new Date(cardB.openedAt!).getTime() ||
			cardA.cardName.localeCompare(cardB.cardName) ||
			+cardA.cardNumber - +cardB.cardNumber;

		if (order === 'desc') return sortValue * -1;
		else return sortValue;
	};
}
