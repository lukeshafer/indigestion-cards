import { createApiRoute } from '@site/lib/action';
import { InputValidationError, ServerError } from '@core/lib/errors';
import { createTradeFromApi } from '@core/lib/trades';

export const POST = createApiRoute(
	{
		authorizationType: 'user',
		schema: {
			receiverUsername: 'string',
			offeredCards: 'string[]',
			requestedCards: 'string[]',
			offeredPacks: 'string[]',
			requestedPacks: 'string[]',
			message: 'string?',
		},
		validationErrorResponse: (ctx, errors) => {
			const params = new URLSearchParams(ctx.request.headers.get('referer') || undefined);
			params.set('alert', errors.join(', '));
			params.set('type', 'error');
			return ctx.redirect(`/trades/new?${params.toString()}`);
		},
	},
	async (
		{ receiverUsername, offeredCards, requestedCards, offeredPacks, requestedPacks, message },
		ctx
	) => {
		try {
			const username = ctx.locals.user?.properties.username!;
			const trade = await createTradeFromApi({
				senderUsername: username,
				receiverUsername,
				offeredCards,
				requestedCards,
				offeredPacks,
				requestedPacks,
				message,
			});

			return ctx.redirect(`/trades/${trade.data.tradeId}?alert=Trade Created`);
		} catch (error) {
			console.error(error);
			const params = new URLSearchParams(ctx.request.headers.get('referer') || undefined);
			params.set('type', 'error');
			if (error instanceof InputValidationError) {
				params.set('alert', error.message);
			} else if (error instanceof ServerError) {
				params.set('alert', 'An internal server error occurred while creating the trade.');
			} else {
				params.set(
					'alert',
					'An unknown error occurred. Please try again or reach out for support!'
				);
			}
			return ctx.redirect(`/trades/new?${params.toString()}`);
		}
	}
);
