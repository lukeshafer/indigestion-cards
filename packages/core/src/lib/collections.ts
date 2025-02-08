import { db } from '../db';
import type { CardInstance, Collection } from '../db.types';
import { getUser } from './user';

export async function createSetCollection(args: {
	userId: string;
	collectionName: string;
	collectionCards: Array<string>;
}) {
	const verifyResult = await verifyUser(args);
	if (!verifyResult.success) {
		return verifyResult;
	}
	const { user } = verifyResult.data;

	let result = await db.entities.Users.patch({ userId: user.userId })
		.append({
			collections: [
				{
					collectionName: args.collectionName,
					cards: args.collectionCards,
					collectionType: 'set',
				},
			],
		})
		.go();

	return {
		success: true,
		data: { user: result.data, collection: result.data.collections!.at(-1)! },
	} as const;
}

export async function createRuleCollection(args: {
	userId: string;
	collectionName: string;
	collectionRules: NonNullable<Collection['rules']>;
}) {
	const verifyResult = await verifyUser(args);
	if (!verifyResult.success) {
		return verifyResult;
	}
	const { user } = verifyResult.data;

	let result = await db.entities.Users.patch({ userId: user.userId })
		.append({
			collections: [
				{
					collectionName: args.collectionName,
					rules: args.collectionRules,
					collectionType: 'set',
				},
			],
		})
		.go();

	return {
		success: true,
		data: { user: result.data, collection: result.data.collections!.at(-1)! },
	} as const;
}

async function verifyUser(args: { userId: string }) {
	const user = await getUser(args.userId);

	if (!user) {
		return { success: false, message: 'USER_DOES_NOT_EXIST' } as const;
	}

	const existingCollections = user.collections ?? [];

	return { success: true, data: { user, existingCollections } } as const;
}

export async function deleteCollection(args: { userId: string; collectionId: string }) {
	const user = await getUser(args.userId);
	if (!user) {
		return { success: false, message: 'USER_DOES_NOT_EXIST' } as const;
	}

	const existingCollections = user.collections ?? [];
	const withoutDeleted = existingCollections.filter(c => c.collectionId !== args.collectionId);

	let result = await db.entities.Users.patch({ userId: user.userId })
		.set({ collections: withoutDeleted })
		.go();

	return { success: true, data: result.data } as const;
}

async function getCollection(args: { userId: string; collectionId: string }) {
	const user = await getUser(args.userId);
	if (!user) {
		return { success: false, message: 'USER_DOES_NOT_EXIST' } as const;
	}

	const collection = user.collections?.find(c => c.collectionId === args.collectionId);
	if (!collection) {
		return { success: false, message: 'COLLECTION_DOES_NOT_EXIST' } as const;
	}
	return { success: true, data: { collection, user } } as const;
}

export async function getCollectionCards(args: { userId: string; collectionId: string }) {
	const collectionResult = await getCollection(args);
	if (collectionResult.success === false) return collectionResult;

	const { collection, user } = collectionResult.data;

	switch (collection.collectionType) {
		case 'set':
			return {
				success: true,
				data: getSetCollectionCards({ cards: collection.cards, username: user.username }),
			};
		case 'rule':
			return {
				success: true,
				data: getRuleCollectionCards({
					rules: collection.rules,
					username: user.username,
					userId: user.userId,
				}),
			};
	}
}

export async function getSetCollectionCards(args: {
	username: string;
	cards: Collection['cards'];
}): Promise<Array<CardInstance>> {
	const cardIds = args.cards ?? [];

	const result = await db.entities.CardInstances.query
		.byUser({ username: args.username })
		.where((attr, op) => cardIds.map(id => op.eq(attr.instanceId, id)).join(' OR '))
		.go({ pages: 'all' });

	return result.data;
}

export async function getRuleCollectionCards(args: {
	username: string;
	userId: string;
	rules: Collection['rules'];
}): Promise<Array<CardInstance>> {
	const {
		cardDesignIds,
		stamps,
		isMinter,
		rarityIds,
		seasonIds,
		mintedByIds,
		//tags, TODO:
		//cardNumerators, TODO:
	} = args.rules ?? {};

	const result = await db.entities.CardInstances.query
		.byUser({ username: args.username })
		.where((attr, op) => {
			let conditions: Array<string> = [];

			if (cardDesignIds) {
				conditions.push(cardDesignIds.map(id => op.eq(attr.designId, id)).join(' OR '));
			}

			if (stamps) {
				conditions.push(stamps.map(stamp => op.contains(attr.stamps, stamp)).join(' OR '));
			}

			if (isMinter === true) {
				conditions.push(op.eq(attr.minterId, args.userId));
			} else if (isMinter === false) {
				conditions.push(op.ne(attr.minterId, args.userId));
			}

			if (rarityIds) {
				conditions.push(rarityIds.map(stamp => op.eq(attr.rarityId, stamp)).join(' OR '));
			}

			if (seasonIds) {
				conditions.push(seasonIds.map(id => op.eq(attr.seasonId, id)).join(' OR '));
			}

			if (mintedByIds) {
				conditions.push(mintedByIds.map(id => op.eq(attr.minterId, id)).join(' OR '));
			}

			return `(${conditions.join(') AND (')}`;
		})
		.go({ pages: 'all' });

	return result.data;
}
