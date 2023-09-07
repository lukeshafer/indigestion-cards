import { UnmatchedImageType, db } from './db';
import type { EntityItem, CreateEntityItem, UpdateEntityItem } from 'electrodb';
import { ElectroError } from 'electrodb';
import { createNewUser, getUser } from './user';
import { CardPool } from './pack';
import { FULL_ART_ID, LEGACY_CARD_ID } from './constants';

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

export type CardInstanceEntity = EntityItem<Card>;
export type CardDesignEntity = EntityItem<CardDesign>;
export type RarityEntity = EntityItem<Rarity>;
export type SeasonEntity = EntityItem<Season>;
export type PackTypeEntity = EntityItem<PackType>;
export type PackEntity = EntityItem<Pack>;

function generateCard(info: {
	userId?: string;
	username?: string;
	packId: string | undefined;
	cardPool: CardPool;
}) {
	console.log('Generating card: ', { ...info, cardPool: [] });
	// Steps:
	// 1. Take all the designs and instances, and generate a list of remaining possible cards that can be generated
	const { cardDesigns } = info.cardPool;

	if (cardDesigns.length === 0) {
		throw new Error('No designs found');
	}

	const possibleCardsList = getRemainingPossibleCardsFromCardPool(info.cardPool);

	if (possibleCardsList.length === 0) {
		throw new Error('No possible cards found');
	}

	const {
		designId: assignedDesignId,
		rarityId: assignedRarityId,
		cardNumber: assignedCardNumber,
	} = possibleCardsList[Math.floor(Math.random() * possibleCardsList.length)];
	const design = cardDesigns.find((design) => design.designId === assignedDesignId)!;
	const rarity = design.rarityDetails?.find((rarity) => rarity.rarityId === assignedRarityId);

	if (!rarity) throw new Error('No rarity found');

	const totalOfType = rarity?.count;
	const instanceId = `${design.seasonId}-${design.designId}-${assignedRarityId}-${assignedCardNumber}`;

	const cardDetails = {
		seasonId: design.seasonId,
		seasonName: design.seasonName,
		designId: design.designId,
		rarityId: assignedRarityId,
		rarityName: rarity.rarityName,
		rarityColor: rarity.rarityColor,
		frameUrl: rarity.frameUrl,
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
		cardNumber: assignedCardNumber,
		totalOfType,
	} satisfies CardInstanceEntity;

	console.log('Generated card', {
		seasonId: design.seasonId,
		seasonName: design.seasonName,
		designId: design.designId,
		cardName: design.cardName,
		rarityId: assignedRarityId,
		rarityName: rarity.rarityName,
		instanceId,
		username: info.username,
		userId: info.userId,
		packId: info.packId,
	});

	return cardDetails;
}

export function getRemainingPossibleCardsFromCardPool(cardPool: CardPool) {
	const { cardDesigns, cardInstances: existingInstances } = cardPool;

	if (cardDesigns.length === 0) {
		throw new Error('No designs found');
	}

	const possibleCardsList = [];
	for (const design of cardDesigns) {
		if (!design.rarityDetails) continue;
		for (const rarity of design.rarityDetails) {
			for (let i = 0; i < rarity.count; i++) {
				possibleCardsList.push({
					designId: design.designId,
					rarityId: rarity.rarityId,
					cardNumber: i + 1,
					totalOfType: rarity.count,
				});
			}
		}
	}

	for (const card of existingInstances) {
		// remove the card from the list of possible cards
		const index = possibleCardsList.findIndex(
			(possibleCard) =>
				possibleCard.designId === card.designId &&
				possibleCard.rarityId === card.rarityId &&
				possibleCard.cardNumber === card.cardNumber
		);
		if (index !== -1) {
			possibleCardsList.splice(index, 1);
		}
	}

	return possibleCardsList;
}

export async function deleteCardInstanceById(args: { designId: string; instanceId: string }) {
	const {
		data: [card],
	} = await db.entities.cardInstances.query.byId(args).go();
	if (!card) throw new Error('Card not found');
	const user = card.userId ? await getUser(card.userId) : null;

	if (user) {
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

	const result = await db.entities.cardInstances.delete(args).go();
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

export async function findPackForUser(args: { username: string }) {
	const result = await db.entities.packs.query.byUsername({ username: args.username }).go();
	if (result.data.length === 0) return null;
	return result.data[0];
}

export async function deleteFirstPackForUser(args: {
	username: string;
	userId: string;
}): Promise<Result<EntityItem<Pack> | null>> {
	try {
		const pack = await findPackForUser(args);
		if (!pack) return { success: false, error: 'User has no pack to delete!' };

		const openedCount = pack.cardDetails.filter((card) => card.opened).length;
		const user = await getUser(args.userId);
		const result = await db.transaction
			.write(({ users, cardInstances, packs }) => [
				packs.delete({ packId: pack.packId }).commit(),
				...(pack.userId && user
					? [
						users
							.patch({ userId: pack.userId })
							// if packCount is null OR 0, set it to 0, otherwise subtract 1
							.set({
								packCount: (user?.packCount || 1) - 1,
								cardCount: user?.cardCount ? user.cardCount - openedCount : 0,
							})
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
	const openCount = pack.cardDetails.filter((card) => card.opened).length;

	const result = await db.transaction
		.write(({ users, cardInstances, packs }) => [
			packs.delete({ packId: args.packId }).commit(),
			...(pack.userId && user
				? [
					users
						.patch({ userId: pack.userId })
						// if packCount is null OR 0, set it to 0, otherwise subtract 1
						.set({
							packCount: (user?.packCount || 1) - 1,
							cardCount: user?.cardCount ? user.cardCount - openCount : 0,
						})
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
	userId?: string;
	username?: string;
	count: number;
	cardPool: CardPool;
	seasonId?: string;
	packType: {
		packTypeId: string;
		packTypeName: string;
	};
}) {
	const packId = `pack-${args.userId}-${Date.now()}`;

	const user =
		args.userId && args.username
			? (await getUser(args.userId)) ??
			(await createNewUser({ userId: args.userId, username: args.username }))
			: null;

	const cards: EntityItem<Card>[] = [];
	const cardPool = Object.assign(args.cardPool) as CardPool;
	for (let i = 0; i < args.count; i++) {
		const card = generateCard({
			userId: user?.userId,
			username: user?.username,
			packId,
			cardPool,
		});
		cardPool.cardInstances.push(card);
		cards.push(card);
	}

	console.log('Creating pack: ', {
		cards,
		packId,
		...args,
		cardPool: undefined,
	});

	await db.transaction
		.write(({ users, packs, cardInstances }) => [
			...(user && args.userId && args.username
				? [
					users
						.patch({ userId: user.userId })
						.set({ packCount: (user.packCount ?? 0) + 1 })
						.commit(),
				]
				: []),
			packs
				.create({
					packId,
					packTypeId: args.packType.packTypeId,
					packTypeName: args.packType.packTypeName,
					userId: user?.userId,
					username: user?.username,
					seasonId: args.seasonId,
					cardDetails: cards.map((card) => ({
						instanceId: card.instanceId,
						designId: card.designId,
						cardName: card.cardName,
						cardDescription: card.cardDescription,
						imgUrl: card.imgUrl,
						rarityId: card.rarityId,
						rarityName: card.rarityName,
						rarityColor: card.rarityColor,
						frameUrl: card.frameUrl,
						totalOfType: card.totalOfType,
						cardNumber: card.cardNumber,
					})),
				})
				.commit(),
			...cards.map((card) => cardInstances.create(card).commit()),
		])
		.go();
}

interface RarityForComparison {
	rarityId: string;
	count: number;
}
function checkIsRarityBetter(a: RarityForComparison, b: RarityForComparison) {
	if (a.count < b.count) return true;
	if (a.count > b.count) return false;

	if (a.rarityId === FULL_ART_ID) return true;
	if (b.rarityId === FULL_ART_ID) return false;

	if (a.rarityId === LEGACY_CARD_ID) return true;
	if (b.rarityId === LEGACY_CARD_ID) return false;

	return false;
}

export async function openCardFromPack(args: {
	designId: string;
	instanceId: string;
	packId: string;
}) {
	const {
		cardDesigns: [design],
		cardInstances,
	} = await getCardDesignAndInstancesById({ designId: args.designId });
	const instance = cardInstances.find((c) => c.instanceId === args.instanceId);
	if (!instance) {
		throw new Error('Card not found');
	}
	if (instance.openedAt || !instance.packId) {
		console.log("Card already opened or doesn't belong to a pack");
		const pack = await db.entities.packs.query.byPackId({ packId: args.packId }).go();
		console.log({ pack });
		if (!pack.data || pack.data.length === 0) {
			return {
				success: false,
				error: 'Card already opened',
			};
		}

		const cardInPack = pack.data[0].cardDetails?.find((c) => c.instanceId === args.instanceId);
		if (!cardInPack) {
			return {
				success: false,
				error: 'Card not found',
			};
		}

		if (cardInPack.opened) {
			return {
				success: false,
				error: 'Card already opened',
			};
		}

		const newCardDetails = pack.data[0].cardDetails?.map((c) =>
			c.instanceId !== args.instanceId ? c : { ...c, opened: true }
		);

		const deletePack = newCardDetails.every((c) => c.opened);

		const userId = instance.userId;
		const user = userId ? await getUser(userId) : null;

		const updateRarity = checkIsRarityBetter(
			{ rarityId: instance.rarityId, count: instance.totalOfType },
			{
				rarityId: design.bestRarityFound?.rarityId ?? 'not found',
				count: design.bestRarityFound?.count ?? 99999999,
			}
		);

		await db.transaction
			.write(({ packs, users, cardDesigns }) => [
				deletePack
					? packs.delete({ packId: args.packId }).commit()
					: packs
						.patch({ packId: args.packId })
						.set({ cardDetails: newCardDetails })
						.commit(),
				...(user
					? [
						users
							.patch({ userId: user.userId })
							.set({
								cardCount: (user.cardCount ?? 0) + 1,
								packCount: deletePack
									? (user.packCount ?? 1) - 1
									: user.packCount,
							})
							.commit(),
					]
					: []),
				...(updateRarity
					? [
						cardDesigns
							.patch({ designId: args.designId })
							.set({
								bestRarityFound: {
									rarityId: instance.rarityId,
									rarityName: instance.rarityName,
									count: instance.totalOfType,
									frameUrl: instance.frameUrl,
									rarityColor: instance.rarityColor,
								},
							})
							.commit(),
					]
					: []),
			])
			.go();

		return {
			success: true,
			card: instance,
		};
	}

	const userId = instance.userId;
	if (!userId) throw new Error('Pack must include a user to be opened');

	const packId = instance.packId;
	const pack = await getPackById({ packId: packId });
	const user = await getUser(userId);
	if (!user) throw new Error('User not found');

	const newCardDetails = pack.cardDetails?.map((c) =>
		c.instanceId !== args.instanceId ? c : { ...c, opened: true }
	);
	const deletePack = newCardDetails.every((c) => c.opened);
	const isShitPack = deletePack ? newCardDetails.every((c) => c.totalOfType >= 50) : false;

	const updateRarity = checkIsRarityBetter(
		{ rarityId: instance.rarityId, count: instance.totalOfType },
		{
			rarityId: design.bestRarityFound?.rarityId ?? 'not found',
			count: design.bestRarityFound?.count ?? 99999999,
		}
	);

	const result = await db.transaction
		.write(({ cardInstances, cardDesigns, users, packs }) => [
			cardInstances
				.patch(args)
				.set({
					openedAt: new Date().toISOString(),
					packId: undefined,
					stamps: isShitPack
						? [...(instance.stamps || []), 'shit-pack']
						: instance.stamps,
				})
				.commit(),
			users
				.patch({ userId })
				.set({
					cardCount: (user.cardCount ?? 0) + 1,
					packCount: deletePack ? (user.packCount ?? 1) - 1 : user.packCount,
				})
				.commit(),
			deletePack
				? packs.delete({ packId: packId }).commit()
				: packs.patch({ packId: packId }).set({ cardDetails: newCardDetails }).commit(),
			...(updateRarity
				? [
					cardDesigns
						.patch({ designId: args.designId })
						.set({
							bestRarityFound: {
								rarityId: instance.rarityId,
								rarityName: instance.rarityName,
								count: instance.totalOfType,
								frameUrl: instance.frameUrl,
								rarityColor: instance.rarityColor,
							},
						})
						.commit(),
				]
				: []),
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
	const seasons = await getAllSeasons();
	const results = await Promise.all(
		seasons.map((season) =>
			db.entities.cardDesigns.query.bySeasonId({ seasonId: season.seasonId }).go()
		)
	);
	return results.flatMap((result) => result.data);
}

export async function getCardDesignById(args: { designId: string; userId: string }) {
	const result = await db.entities.cardDesigns.query.byDesignId(args).go();
	const design = result.data[0];
	return design;
}

export async function getCardDesignAndInstancesById(args: { designId: string }) {
	const result = await db.collections.designAndCards(args).go({ pages: 'all' });
	return result.data;
}

export async function deleteCardDesignById(args: { designId: string }) {
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

export async function updateCardDesign(args: UpdateEntityItem<CardDesign> & { designId: string }) {
	const { designId, ...rest } = args;
	const result = await db.entities.cardDesigns.update({ designId }).set(rest).go();
	return { success: true, data: result.data };
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
	const result = await db.entities.season.query.allSeasons({}).go({ pages: 'all' });
	return result.data;
}

export async function getSeasonById(id: string) {
	const result = await db.entities.season.query.bySeasonId({ seasonId: id }).go();
	return result.data[0];
}

export async function getSeasonAndDesignsBySeasonId(id: string) {
	const result = await db.collections.seasonAndDesigns({ seasonId: id }).go({ pages: 'all' });
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

export async function updateSeason(
	season: UpdateEntityItem<Season> & { seasonId: string }
): Promise<Result<EntityItem<Season>>> {
	const { seasonId, seasonName, seasonDescription } = season;
	try {
		const result = await db.entities.season
			.update({ seasonId })
			.set({ seasonName, seasonDescription })
			.go();
		return {
			success: true,
			// @ts-ignore
			data: result.data,
		};
	} catch (err) {
		if (!(err instanceof ElectroError)) return { success: false, error: `${err}` };

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
	const designsWithRarity = allDesigns.some(
		(design) => design.rarityDetails?.some((r) => r.rarityId === id)
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

// CARD INSTANCES //

export async function getCardInstanceById(args: { instanceId: string; designId: string }) {
	const result = await db.entities.cardInstances.query.byId(args).go();
	return result.data[0];
}
