import {
	trades,
	type CreateTrade,
	type UpdateTrade,
	type Trade,
	type TradeCard,
} from '../db/trades';
import { getUserAndCardInstances, setUserIsTrading } from './user';
import { cardInstances, type CardInstance } from '../db/cardInstances';
import { users, type User } from '../db/users';
import { Service } from 'electrodb';
import { config } from '../db/_utils';
import { InputValidationError, NotFoundError, ServerError, UnauthorizedError } from './errors';
import { sendTradeAcceptedEvent } from '../events/trades';

export async function createTrade(trade: CreateTrade) {
	const result = await trades.create(trade).go();
	return result;
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
		const userCardMap = new Map(userCards.map((card) => [card.instanceId, card]));

		const cards: CardInstance[] = [];
		for (const id of providedCardIds) {
			const card = userCardMap.get(id);
			if (card && card.openedAt) cards.push(card);
		}

		return cards;
	};

	const tradeOptions: CreateTrade = {
		senderUsername: params.senderUsername,
		senderUserId: sender.userId,
		receiverUserId: receiver.userId,
		receiverUsername: params.receiverUsername,
		offeredCards: getCardData(params.offeredCards, senderData.cardInstances),
		requestedCards: getCardData(params.requestedCards, receiverData.cardInstances),
		messages: params.message
			? [
				{
					userId: sender.userId,
					type: 'offer',
					message: params.message,
				},
			]
			: [],
	};

	try {
		console.log({ tradeOptions });
		return createTrade(tradeOptions);
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

export async function updateTrade(tradeId: string, updates: UpdateTrade) {
	const result = await trades.update({ tradeId }).set(updates).go();
	return result;
}

export async function updateTradeStatus(params: {
	tradeId: string;
	status: string;
	loggedInUserId: string;
}): Promise<Partial<Trade>> {
	const trade = await getTrade(params.tradeId);
	if (!trade) throw new NotFoundError('Trade not found');

	if (
		trade.senderUserId !== params.loggedInUserId &&
		trade.receiverUserId !== params.loggedInUserId
	) {
		throw new UnauthorizedError('Unauthorized');
	}

	switch (params.status) {
		case 'accepted':
			if (trade.receiverUserId !== params.loggedInUserId)
				throw new InputValidationError('Only the receiver can accept a trade');
			else if (trade.status !== 'pending')
				throw new InputValidationError('Cannot accept a trade that is not pending');

			return updateTrade(trade.tradeId, { status: 'accepted' }).then(async (res) => {
				await sendTradeAcceptedEvent({ tradeId: trade.tradeId });
				return res.data;
			});
		case 'rejected':
			if (trade.receiverUserId !== params.loggedInUserId)
				throw new InputValidationError('Only the receiver can reject a trade');
			else if (trade.status !== 'pending')
				throw new InputValidationError('Cannot reject a trade that is not pending');

			return updateTrade(trade.tradeId, { status: 'rejected' }).then((res) => res.data);
		case 'canceled':
			if (trade.senderUserId !== params.loggedInUserId)
				throw new InputValidationError('Only the sender can cancel a trade');
			else if (trade.status !== 'pending')
				throw new InputValidationError('Cannot cancel a trade that is not pending');

			return updateTrade(trade.tradeId, { status: 'canceled' }).then((res) => res.data);
		default:
			throw new InputValidationError('Invalid status');
	}
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
		await Promise.all([
			setUserIsTrading({ userId: sender.user.userId, isTrading: true }),
			setUserIsTrading({ userId: receiver.user.userId, isTrading: true }),
		]);

		const offeredCardsMoveToReceiver = trade.offeredCards.map(
			moveCardsBetweenUsers({
				previous: sender,
				next: receiver,
			})
		) satisfies CardInstance[];

		const requestedCardsMoveToSender = trade.requestedCards.map(
			moveCardsBetweenUsers({
				previous: receiver,
				next: sender,
			})
		) satisfies CardInstance[];

		await service.transaction
			.write(({ cardInstances, users, trades }) => [
				users
					.update({ userId: sender.user.userId })
					.add({ cardCount: trade.requestedCards.length - trade.offeredCards.length })
					.commit(),
				users
					.patch({ userId: receiver.user.userId })
					.add({ cardCount: trade.offeredCards.length - trade.requestedCards.length })
					.commit(),
				...offeredCardsMoveToReceiver.map((card) =>
					cardInstances
						.update({ instanceId: card.instanceId, designId: card.designId })
						.set({ username: card.username, userId: card.userId })
						.append({
							tradeHistory: [
								{
									tradeId: trade.tradeId,
									senderUserId: sender.user.userId,
									receiverUserId: receiver.user.userId,
									senderUsername: sender.user.username,
									receiverUsername: receiver.user.username,
									status: 'completed',
									completedAt: Date.now(),
								},
							],
						})
						.commit()
				),
				...requestedCardsMoveToSender.map((card) =>
					cardInstances
						.update({ instanceId: card.instanceId, designId: card.designId })
						.set({ username: card.username, userId: card.userId })
						.append({
							tradeHistory: [
								{
									tradeId: trade.tradeId,
									senderUserId: sender.user.userId,
									receiverUserId: receiver.user.userId,
									senderUsername: sender.user.username,
									receiverUsername: receiver.user.username,
									status: 'completed',
									completedAt: Date.now(),
								},
							],
						})
						.commit()
				),
				trades.update({ tradeId: trade.tradeId }).set({ status: 'completed' }).commit(),
			])
			.go();
	} finally {
		await Promise.all([
			setUserIsTrading({ userId: sender.user.userId, isTrading: false }),
			setUserIsTrading({ userId: receiver.user.userId, isTrading: false }),
		]);
	}
}

async function getAndValidateUserAndCardInstances(username: string) {
	const userdata = await getUserAndCardInstances({ username });

	const user = userdata?.users[0];
	const cards = userdata?.cardInstances;

	if (!user || cards === undefined) {
		throw new Error(`User not found: ${username}`);
	}

	if (user.isTrading) {
		console.error('User is currently trading and cannot do another trade.', user);
		throw new Error('User is currently trading and cannot trade.');
	}

	return { user, cards };
}

function moveCardsBetweenUsers({
	previous,
	next,
}: {
	previous: { cards: CardInstance[]; user: User };
	next: { user: User };
}) {
	const previousCards = new Map(previous.cards.map((card) => [card.instanceId, card]));

	return (cardToMove: TradeCard) => {
		const card = previousCards.get(cardToMove.instanceId);
		if (!card || !card.openedAt) {
			if (card) console.error('Card is not open and cannot be traded');
			console.error(`User does not own card ${cardToMove.instanceId}`, {
				instanceId: cardToMove.instanceId,
				previousCards: [...previousCards],
				prevOwner: previous.user,
			});
			throw new Error(
				`User ${previous.user.username} does not own card ${cardToMove.instanceId}`
			);
		}

		return {
			...card,
			username: next.user.username,
			userId: next.user.userId,
		};
	};
}
