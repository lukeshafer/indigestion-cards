import { randomUUID } from 'crypto';
import { db } from '../db';
import type { CardInstance, Collection, CollectionCards, CollectionRules, User } from '../db.types';
import { getUser } from './user';

type Output<T, Message = string> = Promise<
	| {
			success: true;
			data: T;
			message?: undefined;
	  }
	| {
			success: false;
			data?: undefined;
			message: Message;
	  }
>;

export async function createSetCollection(args: {
	userId: string;
	collectionName: string;
	collectionCards: CollectionCards;
}): Output<{ user: Partial<User>; collection: Collection }, 'USER_DOES_NOT_EXIST'> {
	const verifyResult = await verifyUser(args);
	if (!verifyResult.success) {
		return verifyResult;
	}
	const { user } = verifyResult.data;

	const newCollection: Collection = {
		collectionId: randomUUID(),
		collectionName: args.collectionName.slice(0, 50),
		cards: args.collectionCards,
		collectionType: 'set',
	};

	let result = await db.entities.Users.patch({ userId: user.userId })
		.append({
			collections: [newCollection],
		})
		.go();

	return {
		success: true,
		data: { user: result.data, collection: newCollection },
	} as const;
}

export async function createRuleCollection(args: {
	userId: string;
	collectionName: string;
	collectionRules: CollectionRules;
}): Output<{ user: Partial<User>; collection: Collection }, 'USER_DOES_NOT_EXIST'> {
	const verifyResult = await verifyUser(args);
	if (!verifyResult.success) {
		return verifyResult;
	}
	const { user } = verifyResult.data;

	const newCollection: Collection = {
		collectionId: randomUUID(),
		collectionName: args.collectionName.slice(0, 50),
		rules: args.collectionRules,
		collectionType: 'rule',
	};

	let result = await db.entities.Users.patch({ userId: user.userId })
		.append({
			collections: [newCollection],
		})
		.go();

	return {
		success: true,
		data: { user: result.data, collection: newCollection },
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

export async function deleteCollection(args: {
	userId: string;
	collectionId: string;
}): Output<Partial<User>, 'USER_DOES_NOT_EXIST'> {
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

async function getCollection(args: {
	userId: string;
	collectionId: string;
}): Output<
	{ collection: Collection; user: User },
	'USER_DOES_NOT_EXIST' | 'COLLECTION_DOES_NOT_EXIST'
> {
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

export async function getCollectionCards(args: {
	userId: string;
	collectionId: string;
}): Output<Array<CardInstance>, 'USER_DOES_NOT_EXIST' | 'COLLECTION_DOES_NOT_EXIST'> {
	const collectionResult = await getCollection(args);
	if (collectionResult.success === false) return collectionResult;

	const { collection, user } = collectionResult.data;

	switch (collection.collectionType) {
		case 'set':
			return {
				success: true,
				data: await getSetCollectionCards({
					cards: collection.cards,
					userId: user.userId,
				}),
			} as const;
		case 'rule':
			return {
				success: true,
				data: await getRuleCollectionCards({
					rules: collection.rules,
					username: user.username,
					userId: user.userId,
				}),
			} as const;
	}
}

export async function getSetCollectionCards(args: {
	userId: string;
	cards: Collection['cards'];
}): Promise<Array<CardInstance>> {
	const cardIds = args.cards ?? [];
	if (cardIds.length === 0) return [];

	const result = await db.entities.CardInstances.get(
		cardIds.map(card => ({
			designId: card.designId,
			instanceId: card.instanceId,
		}))
	).go();

	return result.data
		.filter(card => card.userId === args.userId)
		.sort((a, b) => {
			let aIndex = cardIds.findIndex(c => c.instanceId === a.instanceId);
			let bIndex = cardIds.findIndex(c => c.instanceId === b.instanceId);

			return aIndex - bIndex;
		});
}

export async function getRuleCollectionCards(args: {
	username: string;
	userId: string;
	rules: Collection['rules'];
}): Promise<Array<CardInstance>> {
	if (!args.rules || Object.values(args.rules).filter(v => v !== null).length === 0) {
		console.log('Empty rules, returning empty array');
		return [];
	}

	const result = await db.entities.CardInstances.query
		.byUser({ username: args.username })
		.where(buildCollectionCondition({ rules: args.rules, userId: args.userId }))
		.go({ pages: 'all' });

	return result.data;
}

type CardInstanceWhereCallback = Parameters<
	ReturnType<typeof db.entities.CardInstances.query.byUser>['where']
>[0];

const buildCollectionCondition =
	(args: { rules: CollectionRules; userId: string }): CardInstanceWhereCallback =>
	(attr, op) => {
		let conditions: Array<string> = [op.gt(attr.openedAt, "0")];

		const cardOrSeasonConditions = [];
		if (args.rules.cardDesignIds) {
			cardOrSeasonConditions.push(
				...args.rules.cardDesignIds.map(id => op.eq(attr.designId, id))
			);
		}
		if (args.rules.seasonIds) {
			cardOrSeasonConditions.push(
				...args.rules.seasonIds.map(id => op.eq(attr.seasonId, id))
			);
		}
		if (cardOrSeasonConditions.length) {
			conditions.push(cardOrSeasonConditions.join(' OR '));
		}

		if (args.rules.stamps) {
			conditions.push(
				args.rules.stamps.map(stamp => op.contains(attr.stamps, stamp)).join(' OR ')
			);
		}

		if (args.rules.isMinter === true) {
			conditions.push(op.eq(attr.minterId, args.userId));
		} else if (args.rules.isMinter === false) {
			conditions.push(op.ne(attr.minterId, args.userId));
		}

		if (args.rules.rarityIds) {
			conditions.push(
				args.rules.rarityIds.map(ids => op.begins(attr.rarityId, ids)).join(' OR ')
			);
		}

		if (args.rules.mintedByIds) {
			conditions.push(
				args.rules.mintedByIds.map(id => op.eq(attr.minterId, id)).join(' OR ')
			);
		}

		if (args.rules.cardNumbers) {
			conditions.push(
				args.rules.cardNumbers.map(number => op.eq(attr.cardNumber, number)).join(' OR ')
			);
		}

		if (args.rules.tags) {
			conditions.push(args.rules.tags.map(tag => op.contains(attr.tags, tag)).join(' OR '));
		}

		const conditionString = `(${conditions.join(') AND (')})`;
		console.log({ conditionString });

		return conditionString;
	};

export async function getCollectionPreviewCards(args: {
	userId: string;
	collectionId: string;
}): Output<Array<CardInstance>, 'USER_DOES_NOT_EXIST' | 'COLLECTION_DOES_NOT_EXIST'> {
	const collectionResult = await getCollection(args);
	if (collectionResult.success === false) return collectionResult;

	const { collection, user } = collectionResult.data;

	switch (collection.collectionType) {
		case 'set':
			return {
				success: true,
				data: await getSetCollectionCards({
					cards: collection.cards?.slice(0, 3),
					userId: user.userId,
				}),
			} as const;
		case 'rule':
			return {
				success: true,
				data: await getRuleCollectionPreviewCards({
					rules: collection.rules,
					username: user.username,
					userId: user.userId,
				}),
			} as const;
	}
}

async function getRuleCollectionPreviewCards(args: {
	username: string;
	userId: string;
	rules: Collection['rules'];
}): Promise<Array<CardInstance>> {
	if (!args.rules || Object.values(args.rules).filter(v => v !== null).length === 0) {
		console.log('Empty rules, returning empty array');
		return [];
	}

	const conditionFn = buildCollectionCondition({ rules: args.rules, userId: args.userId });

	const result = await db.entities.CardInstances.query
		.byUser({ username: args.username })
		.where(conditionFn)
		.go();

	let { cursor, data: cards } = result;

	while (cards.length < 3 && cursor != null) {
		const newResult = await db.entities.CardInstances.query
			.byUser({ username: args.username })
			.where(conditionFn)
			.go({ cursor });

		cards.push(...newResult.data);
		cursor = newResult.cursor;
	}

	return cards.slice(0, 3);
}
