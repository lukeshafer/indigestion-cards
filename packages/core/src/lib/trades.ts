import { z } from 'zod';
import { trades, type CreateTrade, type UpdateTrade } from '../db/trades';

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

const cardsSchema = z.object({
	instanceId: z.string(),
	designId: z.string(),
	cardName: z.string(),
	cardDescription: z.string(),
	imgUrl: z.string(),
	rarityId: z.string(),
	rarityName: z.string(),
	rarityColor: z.string(),
	frameUrl: z.string(),
	cardNumber: z.number(),
	totalOfType: z.number(),
});

export function parseCardListString(cardsString: string) {
	let cards: unknown;
	try {
		cards = JSON.parse(cardsString);
	} catch (e) {
		console.error(e);
		throw new Error('Invalid JSON');
	}

	const cardsListSchema = z.array(cardsSchema);
	return cardsListSchema.parse(cards);
}
