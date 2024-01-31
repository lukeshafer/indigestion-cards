import {
	trades,
	type CreateTrade,
	type UpdateTrade,
	type Trade,
	type TradeCard,
} from '../db/trades';
import { getUserAndCardInstances } from './user';
import { cardInstances, type CardInstance } from '../db/cardInstances';
import { users, type User } from '../db/users';
import { Service } from 'electrodb';
import { config } from '../db/_utils';
import {
	InputValidationError,
	NotFoundError,
	ServerError,
	UnauthorizedError,
	UserDoesNotOwnCardError,
} from './errors';
import { sendTradeAcceptedEvent } from '../events/trades';
import { LEGACY_CARD_ID } from '../constants';

const UNTRADEABLE_RARITY_IDS = [LEGACY_CARD_ID, 'moments'];

export function checkIsCardTradeable(card: CardInstance): boolean {
	if (UNTRADEABLE_RARITY_IDS.includes(card.rarityId.toLowerCase())) return false;
	if (!card.openedAt) return false;
	return true;
}

export async function createTradeFromApi(params: {
	senderUsername: string;
	receiverUsername: string;
	offeredCards: string[];
	requestedCards: string[];
	message?: string;
}) {
	if (params.senderUsername === params.receiverUsername) {
		throw new InputValidationError('Cannot trade with yourself');
	}

	const senderData = await getUserAndCardInstances({ username: params.senderUsername });
	const receiverData = await getUserAndCardInstances({ username: params.receiverUsername });

	const sender = senderData?.users[0];
	const receiver = receiverData?.users[0];
	if (!sender || !receiver) {
		throw new InputValidationError('Invalid users provided');
	}

	const getCardData = (providedCardIds: string[], userCards: CardInstance[]) => {
		const userCardMap = new Map(userCards.map(card => [card.instanceId, card]));

		const cards: CardInstance[] = [];
		for (const id of providedCardIds) {
			const card = userCardMap.get(id);
			if (card && checkIsCardTradeable(card) && card.openedAt) cards.push(card);
		}

		return cards;
	};

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

	const offeredCards = getCardData(params.offeredCards, senderData.cardInstances);
	const requestedCards = getCardData(params.requestedCards, receiverData.cardInstances);

	if (!offeredCards.length && !requestedCards.length) {
		throw new InputValidationError(
			'Must offer or request at least one valid card. Moment Cards and Legacy Cards cannot be traded.'
		);
	}

	const tradeOptions: CreateTrade = {
		senderUsername: params.senderUsername,
		senderUserId: sender.userId,
		receiverUserId: receiver.userId,
		receiverUsername: params.receiverUsername,
		offeredCards,
		requestedCards,
		messages,
	};

	try {
		console.log({ tradeOptions });
		const trade = await trades.create(tradeOptions).go();
		const user = await users
			.patch({ userId: tradeOptions.receiverUserId })
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
	const result = await trades.query.bySenderId({ senderUserId }).go();
	return result.data;
}

export async function getIncomingTradesByUserId(receiverUserId: string) {
	const result = await trades.query.byReceiverId({ receiverUserId }).go();
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
	const result = await trades.query
		.bySenderId({ tradeId: args.tradeId, senderUserId: args.senderUserId })
		.go();
	return result.data[0];
}

export async function getReceivedTradeById(args: { tradeId: string; receiverUserId: string }) {
	const result = await trades.query
		.byReceiverId({ tradeId: args.tradeId, receiverUserId: args.receiverUserId })
		.go();
	return result.data[0];
}

export async function getTrade(tradeId: string) {
	const result = await trades.query.primary({ tradeId }).go();
	return result.data[0];
}

export async function updateTrade(tradeId: string, updates: UpdateTrade, userId?: string) {
	const set = trades.patch({ tradeId }).set(updates);
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

	const service = new Service({ trades, users }, config);
	const newStatus = checkIsValidStatus({ status, trade, loggedInUserId });

	const result = await service.transaction
		.write(({ users, trades }) => [
			trades
				.patch({ tradeId: trade.tradeId })
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
			users
				.patch({ userId: otherUserId })
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

	const service = new Service({ users, trades }, config);

	const result = await service.transaction
		.write(({ users, trades }) => [
			trades
				.patch({ tradeId: params.tradeId })
				.append({
					messages: [
						{
							...params.message,
							message: params.message.message.slice(0, 140),
						},
					],
				})
				.commit(),
			users
				.patch({ userId: otherUserId })
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

	const sender = await getAndValidateUserAndCardInstances(trade.senderUsername);
	const receiver = await getAndValidateUserAndCardInstances(trade.receiverUsername);

	const service = new Service(
		{
			users,
			cardInstances,
			trades,
		},
		config
	);

	try {
		await service.transaction.write(({ users }) => [
			users.patch({ userId: sender.user.userId }).set({ isTrading: true }).commit(),
			users.patch({ userId: receiver.user.userId }).set({ isTrading: true }).commit(),
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

		await service.transaction
			.write(({ cardInstances, users, trades }) => [
				users
					.patch({ userId: sender.user.userId })
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
				users
					.patch({ userId: receiver.user.userId })
					.add({ cardCount: trade.offeredCards.length - trade.requestedCards.length })
					.commit(),
				...offeredCardsMoveToReceiver.map(card =>
					cardInstances
						.patch({ instanceId: card.instanceId, designId: card.designId })
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
					cardInstances
						.patch({ instanceId: card.instanceId, designId: card.designId })
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
				trades.patch({ tradeId: trade.tradeId }).set({ status: 'completed' }).commit(),
			])
			.go();
	} finally {
		await service.transaction.write(({ users }) => [
			users.patch({ userId: sender.user.userId }).set({ isTrading: false }).commit(),
			users.patch({ userId: receiver.user.userId }).set({ isTrading: false }).commit(),
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

async function getAndValidateUserAndCardInstances(username: string) {
	const userdata = await getUserAndCardInstances({ username });

	const user = userdata?.users[0];
	const cards = userdata?.cardInstances.filter(
		card => !UNTRADEABLE_RARITY_IDS.includes(card.rarityId)
	);

	if (!user || cards === undefined) {
		throw new Error(`User not found: ${username}`);
	}

	if (user.isTrading) {
		console.error('User is currently trading and cannot do another trade.', user);
		throw new Error('User is currently trading and cannot trade.');
	}

	return { user, cards };
}

function stageCardTransactionBetweenUsers({
	previous,
	next,
	tradeId,
}: {
	previous: { cards: CardInstance[]; user: User };
	next: { user: User };
	tradeId: string;
}) {
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

export async function setTradeStatusToFailed(tradeId: string, statusMessage: string) {
	const trade = await getTrade(tradeId);
	if (!trade) throw new NotFoundError('Trade not found');

	if (trade.status !== 'accepted') {
		throw new Error('Cannot set a trade to failed unless accepted.');
	}

	const service = new Service({ trades, users }, config);

	const result = await service.transaction
		.write(({ users, trades }) => [
			trades
				.patch({ tradeId: trade.tradeId })
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
			users
				.patch({ userId: trade.senderUserId })
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
			users
				.patch({ userId: trade.receiverUserId })
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
