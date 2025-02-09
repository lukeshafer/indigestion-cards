import { InputValidationError, ServerError, UnauthorizedError } from '@core/lib/errors';
import { addMessageToTrade, createTradeFromApi, updateTradeStatus } from '@core/lib/trades';
import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro:schema';

export const updateTrade = defineAction({
	input: z.object({
		tradeId: z.string().min(1, 'Trade ID cannot be empty.'),
		status: z.string().optional(),
		message: z.string().optional(),
	}),
	async handler({ tradeId, status, message }, context) {
		let user = context.locals.user;
		if (!user) {
			throw new ActionError({ code: 'UNAUTHORIZED' });
		}

		try {
			if (status) {
				await updateTradeStatus({
					tradeId,
					status,
					loggedInUserId: user.properties.userId,
				});
			} else if (message) {
				await addMessageToTrade({
					loggedInUserId: user.properties.userId,
					tradeId,
					message: {
						message,
						userId: user.properties.userId,
						type: 'message',
					},
				});
			}
		} catch (error) {
			console.error(error);
			if (error instanceof InputValidationError) {
				throw new ActionError({ code: 'BAD_REQUEST', message: error.message });
			} else if (error instanceof UnauthorizedError) {
				throw new ActionError({ code: 'UNAUTHORIZED', message: error.message });
			} else {
				throw new ActionError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'An internal server error occurred while updating the trade.',
				});
			}
		}
	},
});

export const createTrade = defineAction({
	input: z.object({
		receiverUsername: z.string(),
		offeredCards: z.array(z.string()),
		requestedCards: z.array(z.string()),
		offeredPacks: z.array(z.string()),
		requestedPacks: z.array(z.string()),
		message: z.string().optional(),
	}),
	async handler(input, context) {
		let user = context.locals.user;
		if (!user) {
			throw new ActionError({ code: 'UNAUTHORIZED' });
		}

		try {
			const trade = await createTradeFromApi({
				senderUsername: user.properties.username,
				receiverUsername: input.receiverUsername,
				offeredCards: input.offeredCards,
				requestedCards: input.requestedCards,
				offeredPacks: input.offeredPacks,
				requestedPacks: input.requestedPacks,
				message: input.message,
			});

			return { tradeId: trade.data.tradeId };
		} catch (error) {
			console.error(error);
			if (error instanceof InputValidationError) {
				throw new ActionError({ code: 'BAD_REQUEST', message: error.message });
			} else if (error instanceof UnauthorizedError) {
				throw new ActionError({ code: 'UNAUTHORIZED', message: error.message });
			} else if (error instanceof ServerError) {
				throw new ActionError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
			} else {
				throw new ActionError({
					code: 'INTERNAL_SERVER_ERROR',
					message:
						'An unknown error occurred. Please try again or reach out for support!',
				});
			}
		}
	},
});
