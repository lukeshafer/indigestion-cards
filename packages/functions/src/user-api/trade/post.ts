import { SiteHandler } from '@lil-indigestion-cards/core/lib/api';
import { parseCardListString, createTrade } from '@lil-indigestion-cards/core/lib/trades';
import { getUser } from '@lil-indigestion-cards/core/lib/user';

export const handler = SiteHandler(
	{
		authorizationType: 'user',
		schema: {
			senderUserId: 'string',
			receiverUserId: 'string',
			offeredCards: 'string',
			requestedCards: 'string',
			message: 'string',
		},
	},
	async (_, ctx) => {
		const {
			senderUserId,
			receiverUserId,
			offeredCards: offeredCardsString,
			requestedCards: requestedCardsString,
			message,
		} = ctx.params;

		const sender = await getUser(senderUserId);
		const receiver = await getUser(receiverUserId);

		if (!sender || !receiver) {
			throw new Error('Invalid users provided');
		}

		const offeredCards = parseCardListString(offeredCardsString);
		const requestedCards = parseCardListString(requestedCardsString);

		try {
			await createTrade({
				senderUserId,
				senderUsername: sender.username,
				receiverUserId,
				receiverUsername: receiver.username,
				offeredCards,
				requestedCards,
				messages: [message],
			})

			return {
				statusCode: 200,
				body: "Trade created."
			}
		} catch (e) {
			console.error(e);
			return {
				statusCode: 500,
				body: JSON.stringify({
					error: 'Internal server error',
				}),
			}
		}
	}
);
