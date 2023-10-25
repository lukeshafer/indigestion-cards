import { Api } from 'sst/node/api';
import {
	getActiveTwitchEventSubscriptions,
	deleteTwitchEventSubscription,
} from '@lib/twitch';

export async function handler() {
	const activeSubscriptions = await getActiveTwitchEventSubscriptions();
	console.log('Deleting subscriptions:', JSON.stringify(activeSubscriptions, null, 2));

	const promiseList = activeSubscriptions.map(
		async (subscription) =>
			subscription.transport.callback.includes(Api.twitchApi.url)
				? deleteTwitchEventSubscription(subscription.id)
				: null // Don't delete subscriptions from other environments
	);

	await Promise.all(promiseList);
	return {
		statusCode: 200,
		body: 'OK',
	};
}
