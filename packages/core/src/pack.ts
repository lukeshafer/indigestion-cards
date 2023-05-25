import { z } from 'zod';
import { db } from './db';
import { checkIfUserExists, createNewUser, getUser, getUserByUserName } from './user';
import { EntityItem } from 'electrodb';
import { Card, CardDesign, getPackById } from './card';
import { createPack } from './card';

export const packSchema = z.object({
	userId: z.string(),
	username: z.string(),
	packCount: z.number(),
	packType: z.object({
		packTypeId: z.string(),
		packTypeName: z.string(),
		packTypeCategory: z.enum(['season', 'custom']),
		cardCount: z.number(),
		designs: z
			.array(
				z.object({
					designId: z.string(),
					cardName: z.string(),
					imgUrl: z.string(),
				})
			)
			.optional(),
		seasonId: z.string().optional(),
		seasonName: z.string().optional(),
	}),
});
export const packSchemaWithoutUser = packSchema.omit({ userId: true, username: true });

export type PackDetails = z.infer<typeof packSchema>;
export type PackDetailsWithoutUser = z.infer<typeof packSchemaWithoutUser>;

export async function createPackForNoUser(packDetails: PackDetailsWithoutUser) {
	const cardPool = await getCardPoolFromType(packDetails.packType);

	for (let i = 0; i < packDetails.packCount; i++) {
		await createPack({
			count: packDetails.packType.cardCount,
			cardPool: cardPool,
			packType: {
				packTypeId: packDetails.packType.packTypeId,
				packTypeName: packDetails.packType.packTypeName,
			},
		});
	}
}

export async function givePackToUser(packDetails: PackDetails) {
	if (!(await checkIfUserExists(packDetails.userId))) {
		await createNewUser({
			userId: packDetails.userId,
			username: packDetails.username,
		});
	}

	const cardPool = await getCardPoolFromType(packDetails.packType);

	for (let i = 0; i < packDetails.packCount; i++) {
		await createPack({
			username: packDetails.username,
			userId: packDetails.userId,
			count: packDetails.packType.cardCount,
			cardPool: cardPool,
			packType: {
				packTypeId: packDetails.packType.packTypeId,
				packTypeName: packDetails.packType.packTypeName,
			},
		});
	}
}

export type CardPool = {
	cardDesigns: EntityItem<CardDesign>[];
	cardInstances: EntityItem<Card>[];
};

export async function getCardPoolFromType(packType: PackDetails['packType']): Promise<CardPool> {
	if (packType.packTypeCategory === 'season') {
		const seasonId = packType.seasonId;
		if (!seasonId) throw new Error('SeasonId is required for season packs');
		const cardPool = await db.collections.seasonAndDesigns({ seasonId }).go();
		return cardPool.data;
	}
	if (packType.packTypeCategory === 'custom') {
		if (!packType.designs) throw new Error('Designs are required for custom packs');
		const cardPool = await Promise.all(
			packType.designs.map(async (design) => {
				const results = await db.collections
					.designAndCards({ designId: design.designId })
					.go();
				return results.data;
			})
		).then((res) =>
			res.reduce(
				(accum, design) => ({
					cardDesigns: [...accum.cardDesigns, ...design.cardDesigns],
					cardInstances: [...accum.cardInstances, ...design.cardInstances],
				}),
				{
					cardDesigns: [],
					cardInstances: [],
				}
			)
		);
		return cardPool;
	}

	throw new Error('Invalid packTypeCategory');
}

export async function updatePackUser(options: {
	packId: string;
	username: string;
	userId: string;
}) {
	const user =
		(await getUser(options.userId)) ??
		(await createNewUser({ userId: options.userId, username: options.username }));

	const pack = await getPackById({ packId: options.packId });

	const oldUser = pack.userId ? await getUser(pack.userId) : null;

	const oldUserList = oldUser ? [oldUser] : [];

	const result = await db.transaction
		.write(({ packs, cardInstances, users }) => [
			packs
				.update({ packId: pack.packId })
				.set({ userId: user.userId, username: user.username })
				.commit(),
			...pack.cardDetails.map((card) =>
				cardInstances
					.update({ instanceId: card.instanceId, designId: card.designId })
					.set({ userId: user.userId, username: user.username })
					.commit()
			),
			users
				.update({ userId: user.userId })
				.set({ packCount: (user.packCount || 0) + 1 })
				.commit(),
			...oldUserList.map((oldUser) =>
				users
					.update({ userId: oldUser.userId })
					.set({ packCount: (oldUser.packCount || 1) - 1 })
					.commit()
			),
		])
		.go();
}
