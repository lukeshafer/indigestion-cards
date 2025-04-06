import { z } from 'astro:schema';
import { authedProcedure } from '../router';
import {
	addMessageToTrade,
	createTradeFromApi,
	getTrade,
	updateTradeStatus,
} from '@core/lib/trades';
import { InputValidationError, ServerError, UnauthorizedError } from '@core/lib/errors';
import { TRPCError } from '@trpc/server';

export const trades = {
	byId: authedProcedure
		.input(z.object({ tradeId: z.string() }))
		.query(async ({ input }) => await getTrade(input.tradeId)),
	create: authedProcedure
		.input(
			z.object({
				receiverUsername: z.string(),
				offeredCards: z.array(z.string()),
				requestedCards: z.array(z.string()),
				offeredPacks: z.array(z.string()),
				requestedPacks: z.array(z.string()),
				message: z.string().optional(),
			})
		)
		.mutation(async ({ input, ctx }) => {
			try {
				const trade = await createTradeFromApi({
					senderUsername: ctx.session.properties.username,
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
					throw new TRPCError({ code: 'BAD_REQUEST', message: error.message });
				} else if (error instanceof UnauthorizedError) {
					throw new TRPCError({ code: 'UNAUTHORIZED', message: error.message });
				} else if (error instanceof ServerError) {
					throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
				} else {
					throw new TRPCError({
						code: 'INTERNAL_SERVER_ERROR',
						message:
							'An unknown error occurred. Please try again or reach out for support!',
					});
				}
			}
		}),
	update: authedProcedure
		.input(
			z.object({
				tradeId: z.string().min(1, 'Trade ID cannot be empty.'),
				status: z.string().optional(),
				message: z.string().optional(),
			})
		)
		.mutation(async ({ input, ctx }) => {
			try {
				if (input.status) {
					await updateTradeStatus({
						tradeId: input.tradeId,
						status: input.status,
						loggedInUserId: ctx.session.properties.userId,
					});
				} else if (input.message) {
					await addMessageToTrade({
						loggedInUserId: ctx.session.properties.userId,
						tradeId: input.tradeId,
						message: {
							message: input.message,
							userId: ctx.session.properties.userId,
							type: 'message',
						},
					});
				}
			} catch (error) {
				console.error(error);
				if (error instanceof InputValidationError) {
					throw new TRPCError({ code: 'BAD_REQUEST', message: error.message });
				} else if (error instanceof UnauthorizedError) {
					throw new TRPCError({ code: 'UNAUTHORIZED', message: error.message });
				} else {
					throw new TRPCError({
						code: 'INTERNAL_SERVER_ERROR',
						message: 'An internal server error occurred while updating the trade.',
					});
				}
			}
		}),
};
