import { createApiRoute } from '@/lib/action';
import { InputValidationError, ServerError } from '@lil-indigestion-cards/core/lib/errors';
import { createTradeFromApi } from '@lil-indigestion-cards/core/lib/trades';

export const POST = createApiRoute(
	{
		authorizationType: 'user',
		schema: {
			receiverUsername: 'string',
			offeredCards: 'string[]',
			requestedCards: 'string[]',
			message: 'string?',
		},
		validationErrorResponse: (ctx, errors) => {
			const params = new URLSearchParams(ctx.request.headers.get('referer') || undefined);
			params.set('alert', errors.join(', '));
			params.set('type', 'error');
			return ctx.redirect(`/trades/new?${params.toString()}`);
		},
	},
	async ({ receiverUsername, offeredCards, requestedCards, message }, ctx) => {
		try {
			const username = ctx.locals.user?.properties.username!;
			const trade = await createTradeFromApi({
				senderUsername: username,
				receiverUsername,
				offeredCards,
				requestedCards,
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
