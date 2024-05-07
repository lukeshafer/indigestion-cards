import { db } from '../db';
import type { CardInstance, SiteConfig } from '../db.types';
import { getUser } from './user';
import { getRarityRankForRarity } from './site-config';

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
}): Promise<{
	data: Array<CardInstance>;
	cursor: string | null;
}> {
	const results = await db.entities.CardInstances.query
		.byUserSortedByRarity({ username: options.username })
		.where((attr, op) => op.exists(attr.openedAt))
		.go({ cursor: options.cursor, count: 30 });

	return results;
}

export async function getCardsByUserSortedByCardName(options: {
	username: string;
	cursor?: string;
}) {
	const results = await db.entities.CardInstances.query
		.byUserSortedByCardName({ username: options.username })
		.where((attr, op) => op.exists(attr.openedAt))
		.go({ cursor: options.cursor, count: 30 });

	return results;
}

export async function updateAllCardRarityRanks(
	newRanking: NonNullable<SiteConfig['rarityRanking']>
) {
	let allCards = await db.entities.CardInstances.scan.go({ pages: 'all' });

	const errors = [];
	for (const card of allCards.data) {
		try {
			const updatedRarity = await getRarityRankForRarity(card, newRanking);
			await db.entities.CardInstances.patch(card).set({ rarityRank: updatedRarity }).go();
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
