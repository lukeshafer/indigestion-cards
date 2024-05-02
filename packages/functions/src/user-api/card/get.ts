import { SiteHandler, validateSearchParams } from '@core/lib/api';
import { getUserAndOpenedCardInstances } from '@core/lib/user';

export const handler = SiteHandler({ authorizationType: 'user' }, async (event) => {
	const result = validateSearchParams(new URLSearchParams(event.rawQueryString), {
		username: 'string',
	});

	if (!result.success) {
		return {
			statusCode: 400,
			body: JSON.stringify(result.errors),
		};
	}
	const params = result.value;

	try {
		const cards = await getUserAndOpenedCardInstances({ username: params.username });
		return {
			statusCode: 200,
			body: JSON.stringify(cards?.CardInstances ?? []),
		};
	} catch (e) {
		console.error(e);
		return {
			statusCode: 500,
			body: JSON.stringify(e),
		};
	}
});
