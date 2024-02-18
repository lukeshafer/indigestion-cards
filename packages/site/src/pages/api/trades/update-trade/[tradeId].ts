import { createApiRoute } from '@/lib/action';
import { InputValidationError } from '@lil-indigestion-cards/core/lib/errors';
import { addMessageToTrade, updateTradeStatus } from '@lil-indigestion-cards/core/lib/trades';

export const POST = createApiRoute(
	{
		schema: {
			status: 'string?',
			message: 'string?',
		},
		authorizationType: 'user',
	},
	async ({ status, message }, ctx) => {
		const tradeId = ctx.params.tradeId!;
		const loggedInUserId = ctx.locals.user!.properties.userId;
		if (status)
			try {
				await updateTradeStatus({
					tradeId,
					status,
					loggedInUserId,
				});
			} catch (error) {
				console.error(error);
				const params = new URLSearchParams(ctx.request.headers.get('referer') || undefined);
				params.set('type', 'error');
				if (error instanceof InputValidationError) {
					params.set('alert', error.message);
				} else {
					params.set(
						'alert',
						'An internal server error occurred while updating the trade.'
					);
				}

				return ctx.redirect(`/trades/${ctx.params.tradeId!}?${params.toString()}`);
			}
		if (message) {
			await addMessageToTrade({
				loggedInUserId,
				tradeId,
				message: {
					message,
					userId: loggedInUserId,
					type: 'message',
				},
			});
		}

		return ctx.redirect(`/trades/${ctx.params.tradeId!}?alert=Updated`);
	}
);
