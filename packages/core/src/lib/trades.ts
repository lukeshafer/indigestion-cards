import { z } from 'zod';
import { trades, type CreateTrade } from '../db/trades';

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
