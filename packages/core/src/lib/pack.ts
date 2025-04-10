import { db, packEventTypes } from '../db';
import type { Pack, CardInstance, PackCardsHidden } from '../db.types';
import type { DBResult } from '../types';
import { checkIfUserExists, createNewUser, getUser } from './user';
import { type CardPool, generateCard, getCardPoolFromType } from './card-pool';
import type { PackDetails, PackDetailsWithoutUser } from './entity-schemas';
import { InputValidationError, PackTypeIsOutOfCardsError } from './errors';
import { EventBridge } from '@aws-sdk/client-eventbridge';
import { EventBus } from 'sst/node/event-bus';
import { getSeasonById } from './season';

export async function getAllPacks(): Promise<Pack[]> {
	const result = await db.entities.Packs.query.allPacks({}).go({ pages: 'all' });
	return result.data;
}

export async function getPacksByUsername(args: { username: string }): Promise<Pack[]> {
	try {
		const result = await db.entities.Packs.query
			.byUsername({ username: args.username })
			.go({ pages: 'all' });
		return result.data;
	} catch {
		return [];
	}
}

export function hidePackCards(pack: Pack): PackCardsHidden {
	return {
		...pack,
		cardDetails: undefined,
	};
}

export async function getPackById(args: { packId: string }): Promise<Pack | null> {
	const result = await db.entities.Packs.get(args).go();
	return result.data;
}

export async function findPackForUser(args: { username: string }) {
	const result = await db.entities.Packs.query.byUsername({ username: args.username }).go();
	if (result.data.length === 0) return null;
	return result.data[0];
}

export async function createPackForNoUser(packDetails: PackDetailsWithoutUser) {
	const cardPool = await getCardPoolFromType(packDetails.packType);

	for (let i = 0; i < packDetails.packCount; i++) {
		await createPack({
			count: packDetails.packType.cardCount,
			cardPool: cardPool,
			event: packDetails.event,
			seasonId: packDetails.packType.seasonId,
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

	let errors: PackTypeIsOutOfCardsError[] = [];
	for (let i = 0; i < packDetails.packCount; i++) {
		await createPack({
			username: packDetails.username,
			userId: packDetails.userId,
			count: packDetails.packType.cardCount,
			cardPool: cardPool,
			event: packDetails.event,
			seasonId: packDetails.packType.seasonId,
			packType: {
				packTypeId: packDetails.packType.packTypeId,
				packTypeName: packDetails.packType.packTypeName,
			},
		}).catch(err => {
			if (err instanceof PackTypeIsOutOfCardsError) errors.push(err);
			else throw err;
		});
	}

	if (errors.length) {
		throw new PackTypeIsOutOfCardsError(errors[0].reason, errors.length);
	}
}

export async function updatePackUser(options: {
	packId: string;
	username: string;
	userId: string;
}) {
	const user =
		(await getUser(options.userId)) ??
		(await createNewUser({
			userId: options.userId,
			username: options.username,
		}));

	const pack = await getPackById({ packId: options.packId });
	if (pack == null) {
		throw new InputValidationError('Pack no longer exists.');
	}

	const oldUser = pack.userId ? await getUser(pack.userId) : null;

	const oldUserList = oldUser ? [oldUser] : [];

	await db.transaction
		.write(({ Packs, CardInstances, Users }) => [
			Packs.patch({ packId: pack.packId })
				.set({ userId: user.userId, username: user.username })
				.commit(),
			...pack.cardDetails.map(card =>
				CardInstances.patch({ instanceId: card.instanceId, designId: card.designId })
					.set({ userId: user.userId, username: user.username })
					.commit()
			),
			Users.patch({ userId: user.userId })
				.set({ packCount: (user.packCount || 0) + 1 })
				.commit(),
			...oldUserList.map(oldUser =>
				Users.patch({ userId: oldUser.userId })
					.set({ packCount: (oldUser.packCount || 1) - 1 })
					.commit()
			),
		])
		.go();
}

export async function deleteFirstPackForUser(args: {
	username: string;
	userId: string;
}): Promise<DBResult<Pack | null>> {
	try {
		const pack = await findPackForUser(args);
		if (!pack) return { success: false, error: 'User has no pack to delete!' };

		const openedCount = pack.cardDetails.filter(card => card.opened).length;
		const user = await getUser(args.userId);
		const result = await db.transaction
			.write(({ Users, CardInstances, Packs }) => [
				Packs.delete({ packId: pack.packId }).commit(),
				...(pack.userId && user
					? [
							Users.patch({ userId: pack.userId })
								// if packCount is null OR 0, set it to 0, otherwise subtract 1
								.set({
									packCount: (user?.packCount || 1) - 1,
									cardCount: user?.cardCount ? user.cardCount - openedCount : 0,
								})
								.commit(),
						]
					: []),
				...(pack.cardDetails?.map(card =>
					CardInstances.delete({
						designId: card.designId,
						instanceId: card.instanceId,
					}).commit()
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
	const pack = await getPackById({ packId: args.packId });
	if (pack == null) {
		throw new InputValidationError('Pack no longer exists.');
	}

	const user = pack.userId ? await getUser(pack.userId) : null;
	const openCount = pack.cardDetails.filter(card => card.opened).length;

	const result = await db.transaction
		.write(({ Users, CardInstances, Packs }) => [
			Packs.delete({ packId: args.packId }).commit(),
			...(pack.userId && user
				? [
						Users.patch({ userId: pack.userId })
							// if packCount is null OR 0, set it to 0, otherwise subtract 1
							.set({
								packCount: (user?.packCount || 1) - 1,
								cardCount: user?.cardCount ? user.cardCount - openCount : 0,
							})
							.commit(),
					]
				: []),
			...(pack.cardDetails?.map(card =>
				CardInstances.delete({
					designId: card.designId,
					instanceId: card.instanceId,
				}).commit()
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
	event?: {
		eventId?: string;
		eventType?: (typeof packEventTypes)[number];
	};
	packType: {
		packTypeId: string;
		packTypeName: string;
	};
}) {
	const packId = generatePackId({ userId: args.userId || '_' });

	const user =
		args.userId && args.username
			? ((await getUser(args.userId)) ??
				(await createNewUser({ userId: args.userId, username: args.username })))
			: null;

	const cards: CardInstance[] = [];
	const cardPool = Object.assign(args.cardPool) as CardPool;
	for (let i = 0; i < args.count; i++) {
		const card = await generateCard({
			userId: user?.userId,
			username: user?.username,
			packId,
			cardPool,
		});
		cardPool.CardInstances.push(card);
		cards.push(card);
	}

	const season = args.seasonId ? await getSeasonById(args.seasonId) : null;

	console.log('Creating pack: ', {
		cards,
		packId,
		...args,
		cardPool: undefined,
	});

	const result = await db.transaction
		.write(({ Users, Packs, CardInstances, Seasons }) => [
			...(user && args.userId && args.username
				? [
						Users.patch({ userId: user.userId })
							.set({ packCount: (user.packCount ?? 0) + 1 })
							.commit(),
					]
				: []),
			...(season
				? [Seasons.patch({ seasonId: season.seasonId }).add({ nextPackNumber: 1 }).commit()]
				: []),
			Packs.create({
				packId,
				packTypeId: args.packType.packTypeId,
				packTypeName: args.packType.packTypeName,
				packNumber: season?.nextPackNumber,
				packNumberPrefix: season?.packNumberPrefix,
				userId: user?.userId,
				username: user?.username,
				seasonId: args.seasonId,
				event: {
					eventType: args.event?.eventType,
					eventId: args.event?.eventId,
				},
				cardDetails: cards.map(card => ({
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
			}).commit(),
			...cards.map(card => CardInstances.create(card).commit()),
		])
		.go();

	console.log(result);
}

export async function batchUpdatePackUsername(args: { oldUsername: string; newUsername: string }) {
	const existingPacks = await db.entities.Packs.query
		.byUsername({ username: args.oldUsername })
		.go();

	return await db.entities.Packs.put(
		existingPacks.data.map(pack => ({
			...pack,
			username:
				pack.username?.toLowerCase() === args.oldUsername.toLowerCase()
					? args.newUsername
					: pack.username,
		}))
	).go();
}

export function generatePackId(opts: { userId: string; prefix?: string }): string {
	return `${opts.prefix || ''}pack-${opts.userId}-${Date.now()}`;
}

export async function setPackIsLocked(opts: { packId: string; isLocked: boolean }): Promise<void> {
	const pack = await getPackById({ packId: opts.packId });
	if (pack == null) {
		throw new InputValidationError('Pack no longer exists.');
	}
	if (!pack.isLocked && pack.cardDetails.some(card => card.opened)) {
		console.error('Partially opened pack cannot be locked.');
		throw new InputValidationError('Partially opened pack cannot be locked.');
	}

	await db.entities.Packs.patch({ packId: opts.packId }).set({ isLocked: opts.isLocked }).go();
}

let eventBridge: EventBridge | null = null;
export async function sendPacksUpdatedEvent(): Promise<void> {
	console.log('Sending packs updated event.');
	if (eventBridge === null) {
		eventBridge = new EventBridge();
	}

	await eventBridge
		.putEvents({
			Entries: [
				{
					Source: 'site',
					DetailType: 'packs.updated',
					Detail: '{}',
					EventBusName: EventBus.eventBus.eventBusName,
				},
			],
		})
		.then(console.log);
	console.log('Sent packs updated event.');
}

type PackEventInput = Omit<PackDetails, 'packCount'>;

export async function sendGivePackEvents(events: Array<PackEventInput>): Promise<void> {
	console.log('Sending create packs event.');
	if (eventBridge === null) {
		eventBridge = new EventBridge();
	}

	await eventBridge
		.putEvents({
			Entries: events.map(d => ({
				EventBusName: EventBus.eventBus.eventBusName,
				Source: 'twitch',
				DetailType: 'give-pack-to-user',
				Detail: JSON.stringify({
					userId: d.userId,
					username: d.username,
					packCount: 1,
					packType: d.packType,
					event: d.event,
				} satisfies PackDetails),
			})),
		})
		.then(console.log);
	console.log('Sent create packs event.');
}
