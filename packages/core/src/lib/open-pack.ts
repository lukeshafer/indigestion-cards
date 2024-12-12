import { FULL_ART_ID, LEGACY_CARD_ID } from '../constants';
import { getCardDesignAndInstancesById } from './design';
import { getPackById } from './pack';
import { getUser } from './user';
import { db } from '../db';
import { checkIsShitPack } from './shared';

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
		CardDesigns: [design],
		CardInstances: instances,
	} = await getCardDesignAndInstancesById({ designId: args.designId });
	const instance = instances.find(c => c.instanceId === args.instanceId);

	if (!instance) {
		console.log('Found instances');
		console.log(JSON.stringify(instances, null, 2));
		console.log(`Card instance '${args.instanceId}' does not exist`);
		throw new Error('Card not found');
	}

	if (instance.openedAt || !instance.packId) {
		console.log("Card already opened or doesn't belong to a pack");
		const pack = await getPackById({ packId: args.packId });
		console.log({ pack });
		if (!pack) {
			return {
				success: false,
				error: 'Card already opened',
			};
		}

		const cardInPack = pack.cardDetails?.find(c => c.instanceId === args.instanceId);
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

		const newCardDetails = pack.cardDetails?.map(c =>
			c.instanceId !== args.instanceId ? c : { ...c, opened: true }
		);

		const deletePack = newCardDetails.every(c => c.opened);

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
			.write(({ Packs, Users, CardDesigns }) => [
				deletePack
					? Packs.delete({ packId: args.packId }).commit()
					: Packs.patch({ packId: args.packId })
							.set({ cardDetails: newCardDetails })
							.commit(),
				...(user
					? [
							Users.patch({ userId: user.userId })
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
							CardDesigns.patch({ designId: args.designId })
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

	if (pack.isLocked) {
		throw new Error('Pack is locked and cannot be modified.');
	}

	const newCardDetails = pack.cardDetails?.map(c =>
		c.instanceId !== args.instanceId ? c : { ...c, opened: true }
	);
	const deletePack = newCardDetails.every(c => c.opened);
	const isShitPack = deletePack === true && checkIsShitPack(newCardDetails) === true;

	const updateRarity = checkIsRarityBetter(
		{ rarityId: instance.rarityId, count: instance.totalOfType },
		{
			rarityId: design.bestRarityFound?.rarityId ?? 'not found',
			count: design.bestRarityFound?.count ?? 99999999,
		}
	);

	const result = await db.transaction
		.write(({ CardInstances, CardDesigns, Users, Packs }) => [
			CardInstances.patch(args)
				.set({
					openedAt: new Date().toISOString(),
					packId: undefined,
					stamps: isShitPack
						? [...(instance.stamps || []), 'shit-pack']
						: instance.stamps,
				})
				.commit(),
			Users.patch({ userId })
				.set({
					cardCount: (user.cardCount ?? 0) + 1,
					packCount: deletePack ? (user.packCount ?? 1) - 1 : user.packCount,
				})
				.commit(),
			deletePack
				? Packs.delete({ packId: packId }).commit()
				: Packs.patch({ packId: packId }).set({ cardDetails: newCardDetails }).commit(),
			...(updateRarity
				? [
						CardDesigns.patch({ designId: args.designId })
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
