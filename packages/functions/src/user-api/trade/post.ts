import type { CardInstance } from '@lil-indigestion-cards/core/db/cardInstances';
import type { CreateTrade } from '@lil-indigestion-cards/core/db/trades';
import { SiteHandler } from '@lil-indigestion-cards/core/lib/api';
import { createTrade } from '@lil-indigestion-cards/core/lib/trades';
import { getUserAndCardInstances } from '@lil-indigestion-cards/core/lib/user';

export const handler = SiteHandler(
	{
		authorizationType: 'user',
		schema: {
			receiverUsername: 'string',
			offeredCards: 'string[]',
			requestedCards: 'string[]',
			message: 'string?',
		},
	},
	async (_, ctx) => {
		const { params, session } = ctx;

		if (session.username === params.receiverUsername) {
			return {
				statusCode: 400,
				body: JSON.stringify({
					error: 'Cannot trade with yourself',
				}),
			};
		}

		const senderData = await getUserAndCardInstances({ username: session.username });
		const receiverData = await getUserAndCardInstances({ username: params.receiverUsername });

		const sender = senderData?.users[0];
		const receiver = receiverData?.users[0];
		if (!sender || !receiver) {
			throw new Error('Invalid users provided');
		}

		function getCardData(providedCardIds: string[], userCards: CardInstance[]) {
			const userCardMap = new Map(userCards.map((card) => [card.instanceId, card]));

			const cards: CardInstance[] = [];
			for (const id of providedCardIds) {
				const card = userCardMap.get(id);
				if (card && card.openedAt) cards.push(card);
			}

			return cards;
		}

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
				type: 'offer',
				message: params.message,
			});
		}

		const tradeOptions: CreateTrade = {
			senderUsername: session.username,
			senderUserId: sender.userId,
			receiverUserId: receiver.userId,
			receiverUsername: params.receiverUsername,
			offeredCards: getCardData(params.offeredCards, senderData.cardInstances),
			requestedCards: getCardData(params.requestedCards, receiverData.cardInstances),
			messages,
		};

		try {
			console.log({ tradeOptions });
			await createTrade(tradeOptions);
			return {
				statusCode: 200,
				body: 'Trade created.',
			};
		} catch (e) {
			console.error(e);
			return {
				statusCode: 500,
				body: JSON.stringify({
					error: 'Internal server error',
				}),
			};
		}
	}
);
