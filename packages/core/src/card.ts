import { UnmatchedImageType, db } from './db';
import type { EntityItem, CreateEntityItem, Entity, UpdateEntityItem } from 'electrodb';
import { ElectroError } from 'electrodb';
import { createNewUser, getUser } from './user';
import { CardPool } from './pack';

type Result<T> =
	| {
			success: true;
			data: T;
	  }
	| {
			success: false;
			error: string;
	  };

export type CardDesign = typeof db.entities.cardDesigns;
export type Card = typeof db.entities.cardInstances;
type Season = typeof db.entities.season;
type UnmatchedImage = typeof db.entities.unmatchedImages;
type Pack = typeof db.entities.packs;
type Rarity = typeof db.entities.rarities;
type PackType = typeof db.entities.packTypes;

export type CardDesignEntity = EntityItem<CardDesign>;
export type RarityEntity = EntityItem<Rarity>;

export async function generateCard(info: {
	userId: string;
	username: string;
	packId: string | undefined;
	cardPool: CardPool;
}) {
	// Steps:
	// 1. Get a random card design from the season
	// 2. Get all existing instances of that card design
	// 3. Generate a rarity for the card
	// 4. Generate a unique instanceId for the card
	// 5. Create the card instance
	const { cardDesigns, cardInstances: existingInstances } = info.cardPool;

	if (cardDesigns.length === 0) {
		throw new Error('No designs found');
	}

	const design = cardDesigns[Math.floor(Math.random() * cardDesigns.length)];

	if (!design.rarityDetails) {
		throw new Error('No rarity details found');
	}

	const rarityMap = new Map(
		design.rarityDetails.map(({ rarityName, rarityId, count, frameUrl }) => [
			rarityId,
			{ rarityName, rarityId, max: count, count: 0, frameUrl },
		])
	);

	existingInstances.forEach((instance) => {
		const rarityDetails = rarityMap.get(instance.rarityId);
		if (!rarityDetails) return;
		const newCount = rarityDetails.count + 1;
		if (rarityDetails.max - newCount === 0) rarityMap.delete(instance.rarityId);
		else rarityMap.set(instance.rarityId, { ...rarityDetails, count: newCount });
	});

	const rarityList: string[] = [];
	rarityMap.forEach(({ max, count }, rarity) => {
		for (let i = 0; i < max - count; i++) {
			rarityList.push(rarity);
		}
	});

	if (!rarityList || rarityList.length === 0) {
		throw new Error('No rarities found');
	}

	const assignedRarityId = rarityList[Math.floor(Math.random() * rarityList.length)];
	const assignedRarity = rarityMap.get(assignedRarityId)!;

	const existingInstancesOfRarity = existingInstances
		.filter((instance) => instance.rarityId === assignedRarityId)
		.map((instance) => instance.cardNumber);

	const possibleCardNumbers = Array.from({ length: assignedRarity.max }, (_, i) => i + 1).filter(
		(cardNumber) => !existingInstancesOfRarity.includes(cardNumber)
	);

	if (possibleCardNumbers.length === 0) {
		throw new Error('No card numbers found');
	}

	const cardNumber = possibleCardNumbers[Math.floor(Math.random() * possibleCardNumbers.length)];
	const totalOfType = assignedRarity.max;
	const instanceId = `${design.seasonId}-${design.designId}-${assignedRarityId}-${cardNumber}`;

	if (info.packId) {
		const result = await db.entities.cardInstances
			.create({
				seasonId: design.seasonId,
				designId: design.designId,
				rarityId: assignedRarityId,
				rarityName: assignedRarity.rarityName,
				frameUrl: assignedRarity.frameUrl,
				imgUrl: design.imgUrl,
				cardName: design.cardName,
				cardDescription: design.cardDescription,
				instanceId,
				username: info.username,
				userId: info.userId,
				minterId: info.userId,
				minterUsername: info.username,
				openedAt: info.packId ? undefined : new Date().toISOString(),
				packId: info.packId,
				cardNumber,
				totalOfType,
			})
			.go();
		return result.data;
	}

	const user =
		(await getUser(info.userId)) ??
		(await createNewUser({ userId: info.userId, username: info.username }));

	const result = await db.transaction
		.write(({ users, cardInstances }) => [
			users
				.patch({ userId: info.userId })
				.set({ cardCount: (user.cardCount ?? 0) + 1 })
				.commit(),
			cardInstances
				.create({
					seasonId: design.seasonId,
					designId: design.designId,
					rarityId: assignedRarityId,
					rarityName: assignedRarity.rarityName,
					frameUrl: assignedRarity.frameUrl,
					imgUrl: design.imgUrl,
					cardName: design.cardName,
					cardDescription: design.cardDescription,
					instanceId,
					username: info.username,
					userId: info.userId,
					minterId: info.userId,
					minterUsername: info.username,
					openedAt: info.packId ? undefined : new Date().toISOString(),
					packId: info.packId,
					cardNumber,
					totalOfType,
				})
				.commit(),
		])
		.go();

	if (result.canceled || !result.data[1].item) throw new Error('Failed to create card instance');

	return result.data[1].item;
}

export async function deleteCardInstanceById(args: { designId: string; instanceId: string }) {
	const card = await db.entities.cardInstances.query.byId(args).go();
	const user = await getUser(card.data[0].userId);
	if (!user) throw new Error('User not found');

	const result = await db.transaction
		.write(({ cardInstances, users }) => [
			cardInstances.delete(args).commit(),
			users
				.patch({ userId: user.userId })
				.set({ cardCount: (user.cardCount || 1) - 1 })
				.commit(),
		])
		.go();
	return result.data;
}

export async function getAllPacks() {
	const result = await db.entities.packs.query.allPacks({}).go();
	return result.data;
}

export async function getPackById(args: { packId: string }) {
	const result = await db.entities.packs.query.byPackId(args).go();
	return result.data[0];
}

export async function findPackForUser(args: { userId: string }) {
	const result = await db.entities.packs.find({ userId: args.userId }).go();
	if (result.data.length === 0) return null;
	return result.data[0];
}

export async function deleteFirstPackForUser(args: {
	userId: string;
}): Promise<Result<EntityItem<Pack> | null>> {
	try {
		const pack = await findPackForUser(args);
		if (!pack) return { success: false, error: 'User has no pack to delete!' };

		const user = await getUser(args.userId);
		const result = await db.transaction
			.write(({ users, cardInstances, packs }) => [
				packs.delete({ packId: pack.packId }).commit(),
				...(pack.userId && user
					? [
							users
								.patch({ userId: pack.userId })
								// if packCount is null OR 0, set it to 0, otherwise subtract 1
								.set({ packCount: (user?.packCount || 1) - 1 })
								.commit(),
					  ]
					: []),
				...(pack.cardDetails?.map((card) =>
					cardInstances
						.delete({ designId: card.designId, instanceId: card.instanceId })
						.commit()
				) ?? []),
			])
			.go();

		if (result.canceled) throw new Error('Canceled transaction');

		return {
			success: true,
			data: result.data[0].item,
		};
	} catch (err) {
		console.error(err);
		if (err instanceof Error)
			return {
				success: false,
				error: err.message,
			};

		return {
			success: false,
			error: 'Unknown error',
		};
	}
}

export async function deletePack(args: { packId: string }) {
	const {
		data: {
			packs: [pack],
		},
	} = await db.collections.packsAndCards({ packId: args.packId }).go();

	const user = pack.userId ? await getUser(pack.userId) : null;

	const result = await db.transaction
		.write(({ users, cardInstances, packs }) => [
			packs.delete({ packId: args.packId }).commit(),
			...(pack.userId && user
				? [
						users
							.patch({ userId: pack.userId })
							// if packCount is null OR 0, set it to 0, otherwise subtract 1
							.set({ packCount: (user?.packCount || 1) - 1 })
							.commit(),
				  ]
				: []),
			...(pack.cardDetails?.map((card) =>
				cardInstances
					.delete({ designId: card.designId, instanceId: card.instanceId })
					.commit()
			) ?? []),
		])
		.go();

	if (result.canceled) throw new Error('Error deleting pack');

	return result.data[0].item;
}

export async function createPack(args: {
	userId: string;
	username: string;
	count: number;
	cardPool: CardPool;
	seasonId?: string;
	packType: {
		packTypeId: string;
		packTypeName: string;
	};
}) {
	const packId = `pack-${args.userId}-${new Date().toISOString()}-${Math.random() % 99}`;

	const user =
		(await getUser(args.userId)) ??
		(await createNewUser({ userId: args.userId, username: args.username }));

	const cards: EntityItem<Card>[] = [];
	const cardPool = args.cardPool;
	for (let i = 0; i < args.count; i++) {
		const card = await generateCard({
			userId: args.userId,
			username: args.username,
			packId,
			cardPool: args.cardPool,
		});
		cardPool.cardInstances.push(card);
		cards.push(card);
	}

	const result = await db.transaction
		.write(({ users, packs }) => [
			users
				.patch({ userId: args.userId })
				.set({ packCount: (user.packCount ?? 0) + 1 })
				.commit(),
			packs
				.create({
					packId,
					packTypeId: args.packType.packTypeId,
					packTypeName: args.packType.packTypeName,
					userId: args.userId,
					username: args.username,
					seasonId: args.seasonId,
					cardDetails: cards.map((card) => ({
						instanceId: card.instanceId,
						designId: card.designId,
						cardName: card.cardName,
						cardDescription: card.cardDescription,
						imgUrl: card.imgUrl,
						rarityId: card.rarityId,
						rarityName: card.rarityName,
						frameUrl: card.frameUrl,
					})),
				})
				.commit(),
		])
		.go();
}

export async function openCardFromPack(args: { designId: string; instanceId: string }) {
	console.log('openCardFromPack', args);
	const card = await db.entities.cardInstances.query.byId(args).go();
	if (!card.data || card.data.length === 0) {
		throw new Error('Card not found');
	}
	if (card.data[0].openedAt || !card.data[0].packId) {
		throw new Error('Card already opened');
	}

	const packId = card.data[0].packId;
	const pack = await getPackById({ packId: packId });
	const user = await getUser(card.data[0].userId);
	if (!user) throw new Error('User not found');

	const newCardDetails = pack.cardDetails?.map((c) =>
		c.instanceId !== args.instanceId ? c : { ...c, opened: true }
	);
	const deletePack = newCardDetails.every((c) => c.opened);

	const result = await db.transaction
		.write(({ cardInstances, users, packs }) => [
			cardInstances
				.patch(args)
				.set({ openedAt: new Date().toISOString(), packId: undefined })
				.commit(),
			users
				.patch({ userId: card.data[0].userId })
				.set({
					cardCount: (user.cardCount ?? 0) + 1,
					packCount: deletePack ? (user.packCount ?? 1) - 1 : user.packCount,
				})
				.commit(),
			deletePack
				? packs.delete({ packId: packId }).commit()
				: packs.patch({ packId: packId }).set({ cardDetails: newCardDetails }).commit(),
		])
		.go();

	return {
		success: true,
		data: result.data[0].item,
	};
}

// PACK TYPE //

export async function getAllPackTypes() {
	const result = await db.entities.packTypes.query.allPackTypes({}).go();
	return result.data;
}

export async function getPackTypeById(args: { packTypeId: string }) {
	const result = await db.entities.packTypes.query.allPackTypes(args).go();
	return result.data[0];
}

export async function getPackTypesBySeasonId(args: { seasonId: string }) {
	const result = await db.entities.packTypes.query.bySeasonId(args).go();
	return result.data;
}

export async function createPackType(args: CreateEntityItem<PackType>) {
	try {
		const result = await db.entities.packTypes.create({ ...args }).go();
		return { success: true, data: result.data };
	} catch (err) {
		if (!(err instanceof ElectroError)) return { success: false, error: `${err}` };

		if (err.code === 4001)
			// aws error, design already exists
			return {
				success: false,
				error: 'Pack already exists',
			};

		// default
		return {
			success: false,
			error: err.message,
		};
	}
}

export async function deletePackTypeById(args: { packTypeId: string }) {
	const result = await db.entities.packTypes.delete(args).go();
	return { success: true, data: result.data };
}

// DESIGN //
export async function getAllCardDesigns() {
	const result = await db.entities.cardDesigns.find({}).go();
	return result.data;
}

export async function getCardDesignById(args: { designId: string }) {
	const result = await db.entities.cardDesigns.query.byDesignId(args).go();
	return result.data[0];
}

export async function getCardDesignAndInstancesById(args: { designId: string }) {
	const result = await db.collections.designAndCards(args).go();
	return result.data;
}

export async function deleteCardDesignById(args: { designId: string; seasonId: string }) {
	const design = await getCardDesignAndInstancesById(args);
	if (design.cardInstances.length > 0)
		return {
			success: false,
			error: 'Cannot delete design with existing instances',
		};

	const result = await db.entities.cardDesigns.delete(args).go();

	return { success: true, data: result.data };
}

export async function createCardDesign(
	card: CreateEntityItem<CardDesign>
): Promise<Result<CardDesignEntity>> {
	try {
		const result = await db.entities.cardDesigns.create({ ...card }).go();
		return { success: true, data: result.data };
	} catch (err) {
		if (!(err instanceof ElectroError)) return { success: false, error: `${err}` };

		if (err.code === 4001)
			// aws error, design already exists
			return {
				success: false,
				error: 'Design already exists',
			};

		// default
		return {
			success: false,
			error: err.message,
		};
	}
}

// UNMATCHED DESIGN IMAGES //
export async function getUnmatchedDesignImages(type: EntityItem<UnmatchedImage>['type']) {
	const result = await db.entities.unmatchedImages.query.byType({ type }).go();
	return result.data;
}

export async function createUnmatchedDesignImage(image: CreateEntityItem<UnmatchedImage>) {
	const result = await db.entities.unmatchedImages.create(image).go();
	return result.data;
}

export async function deleteUnmatchedDesignImage(args: {
	imageId: string;
	type: UnmatchedImageType;
}) {
	const result = await db.entities.unmatchedImages.delete(args).go();
	return result.data;
}

// SEASONS //
export async function getAllSeasons() {
	const result = await db.entities.season.query.allSeasons({}).go();
	return result.data;
}

export async function getSeasonById(id: string) {
	const result = await db.entities.season.query.bySeasonId({ seasonId: id }).go();
	return result.data[0];
}

export async function getSeasonAndDesignsBySeasonId(id: string) {
	const result = await db.collections.seasonAndDesigns({ seasonId: id }).go();
	return result.data;
}

export async function deleteSeasonById(id: string): Promise<Result<EntityItem<Season>>> {
	const seasonData = await getSeasonAndDesignsBySeasonId(id);
	if (seasonData.cardDesigns.length > 0)
		return {
			success: false,
			error: 'Cannot delete season with existing designs',
		};

	const result = await db.entities.season.delete({ seasonId: id }).go();
	return { success: true, data: result.data };
}

export async function createSeason(
	season: CreateEntityItem<Season>
): Promise<Result<EntityItem<Season>>> {
	try {
		const result = await db.entities.season.create({ ...season }).go();
		return {
			success: true,
			data: result.data,
		};
	} catch (err) {
		if (!(err instanceof ElectroError)) return { success: false, error: `${err}` };

		if (err.code === 4001)
			// aws error, season already exists
			return {
				success: false,
				error: 'Season already exists',
			};

		// default
		return {
			success: false,
			error: err.message,
		};
	}
}

// RARITIES //
export async function getRarityById(args: { rarityId: string }) {
	const result = await db.entities.rarities.query.allRarities(args).go();
	return result.data[0];
}

export async function getAllRarities() {
	const result = await db.entities.rarities.query.allRarities({}).go();
	return result.data.sort((a, b) => b.defaultCount - a.defaultCount);
}

export async function createRarity(
	rarity: CreateEntityItem<Rarity>
): Promise<Result<EntityItem<Rarity>>> {
	try {
		const result = await db.entities.rarities.create(rarity).go();
		return { success: true, data: result.data };
	} catch (err) {
		if (!(err instanceof ElectroError)) return { success: false, error: `${err}` };

		if (err.code === 4001)
			// aws error, rarity already exists
			return {
				success: false,
				error: 'Rarity already exists',
			};

		// default
		return {
			success: false,
			error: err.message,
		};
	}
}

export async function updateRarity(args: UpdateEntityItem<Rarity> & { rarityId: string }) {
	const { rarityId, ...rest } = args;
	const result = await db.entities.rarities.update({ rarityId: args.rarityId }).set(rest).go();
	return result.data;
}

export async function deleteRarityById(id: string): Promise<Result<EntityItem<Rarity>>> {
	const allDesigns = await getAllCardDesigns();
	const designsWithRarity = allDesigns.some((design) =>
		design.rarityDetails?.some((r) => r.rarityId === id)
	);
	if (designsWithRarity) {
		return {
			success: false,
			error: 'Cannot delete rarity with existing designs',
		};
	}

	const result = await db.entities.rarities.delete({ rarityId: id }).go();
	return { success: true, data: result.data };
}
