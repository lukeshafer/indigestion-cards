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

export async function createTrade(trade: CreateTrade) {
	const result = await trades.create(trade).go();
	return result;
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

		const newSenderCardCount =
			sender.user.cardCount + trade.requestedCards.length - trade.offeredCards.length;
		const newReceiverCardCount =
			receiver.user.cardCount + trade.offeredCards.length - trade.requestedCards.length;

		await service.transaction
			.write(({ cardInstances, users, trades }) => [
				users
					.update({ userId: sender.user.userId })
					.set({ cardCount: newSenderCardCount })
					.commit(),
				users
					.update({ userId: receiver.user.userId })
					.set({ cardCount: newReceiverCardCount })
					.commit(),
				...offeredCardsMoveToReceiver.map((card) =>
					cardInstances
						.update({ instanceId: card.instanceId, designId: card.designId })
						.set({ username: card.username, userId: card.userId })
						.commit()
				),
				...requestedCardsMoveToSender.map((card) =>
					cardInstances
						.update({ instanceId: card.instanceId, designId: card.designId })
						.set({ username: card.username, userId: card.userId })
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
