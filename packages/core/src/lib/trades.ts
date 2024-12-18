import { db } from '../db';
import { getUserAndCardInstances } from './user';
import {
	InputValidationError,
	NotFoundError,
	ServerError,
	UnauthorizedError,
	UserDoesNotOwnCardError,
	UserDoesNotOwnPackError,
} from './errors';
import { sendTradeAcceptedEvent } from '../events/trades';
import { LEGACY_CARD_ID } from '../constants';
import type {
	CardInstance,
	CreateTrade,
	Pack,
	Trade,
	TradeCard,
	TradePack,
	UpdateTrade,
	User,
} from '../db.types';
import { getPacksByUsername } from './pack';

const UNTRADEABLE_RARITY_IDS = [LEGACY_CARD_ID, 'moments'];

export function checkIsCardTradeable(card: CardInstance): boolean {
	if (UNTRADEABLE_RARITY_IDS.includes(card.rarityId.toLowerCase())) return false;
	if (!card.openedAt) return false;
	return true;
}

export function checkIsPackTradeable(pack: Pack): boolean {
	if (pack.cardDetails.some(card => card.opened)) return false;
	return true;
}

function getValidCardInstancesFromProvidedCardIds(
	providedCardIds: string[],
	userCards: CardInstance[]
): CardInstance[] {
	const userCardMap = new Map(userCards.map(card => [card.instanceId, card]));

	const cards: CardInstance[] = [];
	for (const id of providedCardIds) {
		const card = userCardMap.get(id);
		if (card && checkIsCardTradeable(card) && card.openedAt) cards.push(card);
	}

	return cards;
}

function getValidPacksFromProvidedPackIds(
	providedPackIds: string[],
	userPacks: Array<Pack>
): Array<Pack> {
	const packMap = new Map(userPacks.map(pack => [pack.packId, pack]));
	const packs: Array<Pack> = [];

	for (let packId of providedPackIds) {
		const pack = packMap.get(packId);
		if (pack && checkIsPackTradeable(pack)) {
			packs.push(pack);
		}
	}

	return packs;
}

export async function createTradeFromApi(params: {
	senderUsername: string;
	receiverUsername: string;
	offeredCards: string[];
	requestedCards: string[];
	offeredPacks: string[];
	requestedPacks: string[];
	message?: string;
}) {
	console.log('Creating trade', { params });

	if (params.senderUsername === params.receiverUsername) {
		throw new InputValidationError('Cannot trade with yourself');
	}

	const senderData = await getUserAndCardInstances({ username: params.senderUsername });
	const receiverData = await getUserAndCardInstances({ username: params.receiverUsername });

	const sender = senderData?.Users[0];
	const receiver = receiverData?.Users[0];
	if (!sender || !receiver) {
		throw new InputValidationError('Invalid users provided');
	}

	const senderPacks = await getPacksByUsername({ username: params.senderUsername });
	const receiverPacks = await getPacksByUsername({ username: params.receiverUsername });

	const messages: CreateTrade['messages'] = [
		{
			userId: sender.userId,
			type: 'status-update',
			message: 'pending',
		},
	];
	if (params.message) {
		messages.push({
			userId: sender.userId,
			type: 'message',
			message: params.message.slice(0, 140),
		});
	}

	const offeredCards = getValidCardInstancesFromProvidedCardIds(
		params.offeredCards,
		senderData.CardInstances
	);
	const requestedCards = getValidCardInstancesFromProvidedCardIds(
		params.requestedCards,
		receiverData.CardInstances
	);
	const offeredPacks = getValidPacksFromProvidedPackIds(params.offeredPacks, senderPacks);
	const requestedPacks = getValidPacksFromProvidedPackIds(params.requestedPacks, receiverPacks);

	if (
		!offeredCards.length &&
		!requestedCards.length &&
		!offeredPacks.length &&
		!requestedPacks.length
	) {
		throw new InputValidationError(
			'Must offer or request at least one valid card or pack. Moment Cards and Legacy Cards cannot be traded.'
		);
	}

	const tradeOptions: CreateTrade = {
		senderUsername: params.senderUsername,
		senderUserId: sender.userId,
		receiverUserId: receiver.userId,
		receiverUsername: params.receiverUsername,
		offeredCards,
		requestedCards,
		offeredPacks,
		requestedPacks,
		messages,
	};

	try {
		console.log({ tradeOptions: JSON.stringify(tradeOptions) });
		const trade = await db.entities.Trades.create(tradeOptions).go();
		const user = await db.entities.Users.patch({ userId: tradeOptions.receiverUserId })
			.append({
				tradeNotifications: [
					{
						tradeId: trade.data.tradeId,
						status: 'statusUpdated',
						text: 'New Trade',
					},
				],
			})
			.go();
		console.log(user);
		return trade;
	} catch (e) {
		console.error(e);
		throw new ServerError('Internal server error');
	}
}

export async function getOutgoingTradesByUserId(senderUserId: string) {
	const result = await db.entities.Trades.query.bySenderId({ senderUserId }).go({ pages: 'all' });
	return result.data;
}

export async function getIncomingTradesByUserId(receiverUserId: string) {
	const result = await db.entities.Trades.query
		.byReceiverId({ receiverUserId })
		.go({ pages: 'all' });
	return result.data;
}

export async function getAllTradesForUser(userId: string) {
	const [outgoing, incoming] = await Promise.all([
		getOutgoingTradesByUserId(userId),
		getIncomingTradesByUserId(userId),
	]);
	return { outgoing, incoming };
}

export async function getSentTradeById(args: { tradeId: string; senderUserId: string }) {
	const result = await db.entities.Trades.query
		.bySenderId({ tradeId: args.tradeId, senderUserId: args.senderUserId })
		.go();
	return result.data[0];
}

export async function getReceivedTradeById(args: { tradeId: string; receiverUserId: string }) {
	const result = await db.entities.Trades.query
		.byReceiverId({ tradeId: args.tradeId, receiverUserId: args.receiverUserId })
		.go();
	return result.data[0];
}

export async function getTrade(tradeId: string) {
	const result = await db.entities.Trades.query.primary({ tradeId }).go();
	return result.data[0];
}

export async function updateTrade(tradeId: string, updates: UpdateTrade, userId?: string) {
	const set = db.entities.Trades.patch({ tradeId }).set(updates);
	const status = updates.status;
	const result = status
		? set
				.append({
					messages: [
						{
							type: 'status-update',
							message: status,
							userId: userId ?? '',
						},
					],
				})
				.go()
		: set.go();
	return result;
}

export async function updateTradeStatus({
	tradeId,
	status,
	loggedInUserId,
	statusMessage,
}: {
	tradeId: string;
	status: string;
	loggedInUserId: string;
	statusMessage?: string;
}): Promise<Partial<Trade> | null> {
	const trade = await getTrade(tradeId);
	if (!trade) throw new NotFoundError('Trade not found');

	if (trade.senderUserId !== loggedInUserId && trade.receiverUserId !== loggedInUserId) {
		throw new UnauthorizedError('Unauthorized');
	}

	const otherUserId =
		trade.senderUserId === loggedInUserId ? trade.receiverUserId : trade.senderUserId;

	const newStatus = checkIsValidStatus({ status, trade, loggedInUserId });

	const result = await db.transaction
		.write(({ Users, Trades }) => [
			Trades.patch({ tradeId: trade.tradeId })
				.set({ status: newStatus, statusMessage })
				.append({
					messages: [
						{
							type: 'status-update',
							message: newStatus,
							userId: loggedInUserId,
						},
					],
				})
				.commit(),
			Users.patch({ userId: otherUserId })
				.append({
					tradeNotifications: [
						{
							tradeId: trade.tradeId,
							status: 'statusUpdated',
							text: newStatus,
						},
					],
				})
				.commit(),
		])
		.go();

	if (newStatus === 'accepted') await sendTradeAcceptedEvent({ tradeId: trade.tradeId });

	return result.data[0].item;
}

function checkIsValidStatus({
	status,
	trade,
	loggedInUserId,
}: {
	status: string;
	trade: Trade;
	loggedInUserId: string;
}) {
	switch (status) {
		case 'accepted':
			if (trade.receiverUserId !== loggedInUserId)
				throw new InputValidationError('Only the receiver can accept a trade');
			else if (trade.status !== 'pending')
				throw new InputValidationError('Cannot accept a trade that is not pending');
			break;
		case 'rejected':
			if (trade.receiverUserId !== loggedInUserId)
				throw new InputValidationError('Only the receiver can reject a trade');
			else if (trade.status !== 'pending')
				throw new InputValidationError('Cannot reject a trade that is not pending');
			break;
		case 'canceled':
			if (trade.senderUserId !== loggedInUserId)
				throw new InputValidationError('Only the sender can cancel a trade');
			else if (trade.status !== 'pending')
				throw new InputValidationError('Cannot cancel a trade that is not pending');
			break;
		default:
			throw new InputValidationError('Invalid status');
	}
	return status;
}

export async function addMessageToTrade(params: {
	tradeId: string;
	message: Trade['messages'][number];
	loggedInUserId: string;
}) {
	const trade = await getTrade(params.tradeId);
	if (!trade) throw new NotFoundError('Trade not found');

	if (
		trade.senderUserId !== params.loggedInUserId &&
		trade.receiverUserId !== params.loggedInUserId
	) {
		throw new UnauthorizedError('Unauthorized');
	}

	const otherUserId =
		trade.senderUserId === params.loggedInUserId ? trade.receiverUserId : trade.senderUserId;

	const result = await db.transaction
		.write(({ Users, Trades }) => [
			Trades.patch({ tradeId: params.tradeId })
				.append({
					messages: [
						{
							...params.message,
							message: params.message.message.slice(0, 140),
						},
					],
				})
				.commit(),
			Users.patch({ userId: otherUserId })
				.append({
					tradeNotifications: [
						{
							tradeId: trade.tradeId,
							status: 'newMessage',
						},
					],
				})
				.commit(),
		])
		.go();

	return result.data[0].item;
}

export async function processTrade(trade: Trade) {
	if (trade.status !== 'accepted') {
		console.log('Trade not accepted, should not process.', { trade });
		throw new Error('Trade not accepted, should not process.');
	}

	const sender = await getAndValidateUserCardInstancesAndPacks(trade.senderUsername);
	const receiver = await getAndValidateUserCardInstancesAndPacks(trade.receiverUsername);

	try {
		await db.transaction.write(({ Users }) => [
			Users.patch({ userId: sender.user.userId }).set({ isTrading: true }).commit(),
			Users.patch({ userId: receiver.user.userId }).set({ isTrading: true }).commit(),
		]);

		const offeredCardsMoveToReceiver = trade.offeredCards.map(
			stageCardTransactionBetweenUsers({
				previous: sender,
				next: receiver,
				tradeId: trade.tradeId,
			})
		) satisfies CardInstance[];

		const requestedCardsMoveToSender = trade.requestedCards.map(
			stageCardTransactionBetweenUsers({
				previous: receiver,
				next: sender,
				tradeId: trade.tradeId,
			})
		) satisfies CardInstance[];

		const offeredPacksMoveToReceiver =
			trade.offeredPacks?.map(
				stagePackTransactionBetweenUsers({
					previous: sender,
					next: receiver,
					tradeId: trade.tradeId,
				})
			) || [];

		const requestedPacksMoveToSender =
			trade.requestedPacks?.map(
				stagePackTransactionBetweenUsers({
					previous: receiver,
					next: sender,
					tradeId: trade.tradeId,
				})
			) || [];

		await db.transaction
			.write(({ CardInstances, Users, Trades, Packs }) => [
				Users.patch({ userId: sender.user.userId })
					.set({
						pinnedCard: trade.offeredCards.some(
							card => card.instanceId === sender.user.pinnedCard?.instanceId
						)
							? {
									instanceId: '',
									designId: '',
									imgUrl: '',
									cardName: '',
									frameUrl: '',
									rarityId: '',
									rarityName: '',
									cardNumber: 0,
									rarityColor: '',
									totalOfType: 0,
									cardDescription: '',
								}
							: sender.user.pinnedCard,
					})
					.add({ cardCount: trade.requestedCards.length - trade.offeredCards.length })
					.append({
						tradeNotifications: [
							{
								status: 'statusUpdated',
								tradeId: trade.tradeId,
								text: `${receiver.user.username} accepted your trade.`,
							},
						],
					})
					.commit(),
				Users.patch({ userId: receiver.user.userId })
					.set({
						pinnedCard: trade.requestedCards.some(
							card => card.instanceId === receiver.user.pinnedCard?.instanceId
						)
							? {
									instanceId: '',
									designId: '',
									imgUrl: '',
									cardName: '',
									frameUrl: '',
									rarityId: '',
									rarityName: '',
									cardNumber: 0,
									rarityColor: '',
									totalOfType: 0,
									cardDescription: '',
								}
							: receiver.user.pinnedCard,
					})
					.add({ cardCount: trade.offeredCards.length - trade.requestedCards.length })
					.commit(),
				...offeredCardsMoveToReceiver.map(card =>
					CardInstances.patch({ instanceId: card.instanceId, designId: card.designId })
						.set({ username: card.username, userId: card.userId })
						.append({
							tradeHistory: [
								{
									version: 2,
									tradeId: trade.tradeId,
									status: 'completed',
									completedAt: Date.now(),
									...formatToAndFromUsers({ card, trade }),
								},
							],
						})
						.commit()
				),
				...requestedCardsMoveToSender.map(card =>
					CardInstances.patch({ instanceId: card.instanceId, designId: card.designId })
						.set({ username: card.username, userId: card.userId })
						.append({
							tradeHistory: [
								{
									version: 2,
									tradeId: trade.tradeId,
									status: 'completed',
									completedAt: Date.now(),
									...formatToAndFromUsers({ card, trade }),
								},
							],
						})
						.commit()
				),
				...offeredPacksMoveToReceiver.flatMap(({ pack, cards }) => [
					Packs.patch({ packId: pack.packId })
						.set({ username: pack.username, userId: pack.userId, isLocked: false })
						.commit(),
					...cards.map(card =>
						CardInstances.patch({
							instanceId: card.instanceId,
							designId: card.designId,
						})
							.set({
								username: card.username,
								userId: card.userId,
								minterUsername: card.username,
								minterId: card.userId,
							})
							.commit()
					),
				]),
				...requestedPacksMoveToSender.flatMap(({ pack, cards }) => [
					Packs.patch({ packId: pack.packId })
						.set({ username: pack.username, userId: pack.userId, isLocked: false })
						.commit(),
					...cards.map(card =>
						CardInstances.patch({
							instanceId: card.instanceId,
							designId: card.designId,
						})
							.set({
								username: card.username,
								userId: card.userId,
								minterUsername: card.username,
								minterId: card.userId,
							})
							.commit()
					),
				]),
				Trades.patch({ tradeId: trade.tradeId }).set({ status: 'completed' }).commit(),
			])
			.go();
	} finally {
		await db.transaction.write(({ Users }) => [
			Users.patch({ userId: sender.user.userId }).set({ isTrading: false }).commit(),
			Users.patch({ userId: receiver.user.userId }).set({ isTrading: false }).commit(),
		]);
	}
}

function formatToAndFromUsers(args: { card: CardInstance; trade: Trade }): {
	fromUserId: string;
	fromUsername: string;
	toUserId: string;
	toUsername: string;
} {
	if (args.card.userId === args.trade.receiverUserId) {
		return {
			toUserId: args.trade.receiverUserId,
			toUsername: args.trade.receiverUsername,
			fromUserId: args.trade.senderUserId,
			fromUsername: args.trade.senderUsername,
		};
	} else if (args.card.userId === args.trade.senderUserId) {
		return {
			toUserId: args.trade.senderUserId,
			toUsername: args.trade.senderUsername,
			fromUserId: args.trade.receiverUserId,
			fromUsername: args.trade.receiverUsername,
		};
	} else throw new Error('Card cannot be traded between these two users.');
}

async function getAndValidateUserCardInstancesAndPacks(username: string) {
	const userdata = await getUserAndCardInstances({ username });
	const packs = await getPacksByUsername({ username });

	const user = userdata?.Users[0];
	const cards = userdata?.CardInstances.filter(
		card => !UNTRADEABLE_RARITY_IDS.includes(card.rarityId)
	);

	if (!user || cards === undefined) {
		throw new Error(`User not found: ${username}`);
	}

	if (user.isTrading) {
		console.error('User is currently trading and cannot do another trade.', user);
		throw new Error('User is currently trading and cannot trade.');
	}

	return { user, cards, packs };
}

function stageCardTransactionBetweenUsers({
	previous,
	next,
	tradeId,
}: {
	previous: { cards: CardInstance[]; user: User };
	next: { user: User };
	tradeId: string;
}): (card: TradeCard) => CardInstance {
	const previousCards = new Map(previous.cards.map(card => [card.instanceId, card]));

	return (cardToMove: TradeCard) => {
		const card = previousCards.get(cardToMove.instanceId);
		if (!card || !card.openedAt) {
			if (card) console.error('Card is not open and cannot be traded');
			console.error(`User does not own card ${cardToMove.instanceId}`, {
				instanceId: cardToMove.instanceId,
				previousCards: [...previousCards],
				prevOwner: previous.user,
			});
			throw new UserDoesNotOwnCardError(
				`User ${previous.user.username} does not own card ${cardToMove.instanceId}`,
				{ username: previous.user.username, card: cardToMove, tradeId }
			);
		}

		return {
			...card,
			username: next.user.username,
			userId: next.user.userId,
		};
	};
}

type StagedPackTrade = {
	pack: Pack;
	cards: Array<CardInstance>;
};

function stagePackTransactionBetweenUsers({
	previous,
	next,
	tradeId,
}: {
	previous: { packs: Array<Pack>; user: User; cards: Array<CardInstance> };
	next: { user: User };
	tradeId: string;
}): (pack: TradePack) => StagedPackTrade {
	const previousPacks = new Map(previous.packs.map(pack => [pack.packId, pack]));
	const previousCards = new Map(previous.cards.map(card => [card.instanceId, card]));

	return (packToMove: TradePack) => {
		const pack = previousPacks.get(packToMove.packId);
		if (!pack || !checkIsPackTradeable(pack)) {
			if (pack) console.error('Pack has been at least partially opened and cannot be traded');
			console.error(`User does not own pack ${packToMove.packId}`, {
				packId: packToMove.packId,
				previousPacks: [...previousPacks],
				prevOwner: previous.user,
			});
			throw new UserDoesNotOwnPackError(
				`User ${previous.user.username} does not own pack ${packToMove.packId}`,
				{ username: previous.user.username, pack: packToMove, tradeId }
			);
		}

		const cards = pack.cardDetails.map(cardToMove => {
			const card = previousCards.get(cardToMove.instanceId);
			if (!card) {
				console.error(
					`Card ${cardToMove.instanceId} is no longer in pack ${pack.packId}. This should not happen.`,
					{
						packId: packToMove.packId,
						previousPacks: [...previousPacks],
						previousCards: [...previousCards],
						prevOwner: previous.user,
						tradeId,
					}
				);

				throw new UserDoesNotOwnCardError(
					`Requested card is no longer in pack ${pack.packId}`,
					{ username: previous.user.username, card: cardToMove, tradeId }
				);
			}

			return {
				...card,
				username: next.user.username,
				userId: next.user.userId,
			};
		});

		return {
			pack: {
				...pack,
				username: next.user.username,
				userId: next.user.userId,
			},
			cards,
		};
	};
}

export async function setTradeStatusToFailed(tradeId: string, statusMessage: string) {
	const trade = await getTrade(tradeId);
	if (!trade) throw new NotFoundError('Trade not found');

	if (trade.status !== 'accepted') {
		throw new Error('Cannot set a trade to failed unless accepted.');
	}

	const result = await db.transaction
		.write(({ Users, Trades }) => [
			Trades.patch({ tradeId: trade.tradeId })
				.set({ status: 'failed', statusMessage })
				.append({
					messages: [
						{
							type: 'status-update',
							message: 'failed',
							userId: 'AUTOMATED',
						},
					],
				})
				.commit(),
			Users.patch({ userId: trade.senderUserId })
				.append({
					tradeNotifications: [
						{
							tradeId: trade.tradeId,
							status: 'statusUpdated',
							text: 'failed',
						},
					],
				})
				.commit(),
			Users.patch({ userId: trade.receiverUserId })
				.append({
					tradeNotifications: [
						{
							tradeId: trade.tradeId,
							status: 'statusUpdated',
							text: 'failed',
						},
					],
				})
				.commit(),
		])
		.go();

	return result.data[0].item;
}
