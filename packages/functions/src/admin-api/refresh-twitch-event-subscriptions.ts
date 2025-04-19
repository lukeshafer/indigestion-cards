import { ApiHandler, useCookie } from 'sstv2/node/api';
import { EventBridge } from '@aws-sdk/client-eventbridge';
import {
	subscribeToTwitchEvent,
	getActiveTwitchEventSubscriptions,
	SUBSCRIPTION_TYPE,
	deleteTwitchEventSubscription,
	type SubscriptionType,
	type TwitchEvent,
} from '@core/lib/twitch';
import { setAdminEnvSession } from '@core/lib/session';
import { Resource } from 'sst';
import { COOKIE, useSession } from '@core/lib/auth';

export const handler = ApiHandler(async () => {
	const session = await useSession({
    access: useCookie(COOKIE.ACCESS),
    refresh: useCookie(COOKIE.REFRESH),
  });
	if (session.type !== 'admin')
		return {
			statusCode: 401,
			body: 'Unauthorized',
		};
	setAdminEnvSession(session.properties.username, session.properties.userId);

	const activeSubscriptions = await getActiveTwitchEventSubscriptions();

	console.log('Active Subscriptions: ', JSON.stringify(activeSubscriptions, null, 2));

	const subDetails: Record<SubscriptionType, TwitchSubscriptionDetails | undefined> = {
		[SUBSCRIPTION_TYPE.GIFT_SUB]: {
			exists: false,
			details: {
				type: SUBSCRIPTION_TYPE.GIFT_SUB,
				callback: `${Resource.TwitchAPI.url}`,
				condition: {
					broadcaster_user_id: Resource.CardsParams.STREAMER_USER_ID,
				},
			},
		},
		[SUBSCRIPTION_TYPE.REDEEM_REWARD]: {
			exists: false,
			details: {
				type: SUBSCRIPTION_TYPE.REDEEM_REWARD,
				callback: `${Resource.TwitchAPI.url}`,
				condition: {
					broadcaster_user_id: Resource.CardsParams.STREAMER_USER_ID,
				},
			},
		},
		[SUBSCRIPTION_TYPE.ADD_REWARD]: {
			exists: false,
			details: {
				type: SUBSCRIPTION_TYPE.ADD_REWARD,
				callback: `${Resource.TwitchAPI.url}`,
				condition: {
					broadcaster_user_id: Resource.CardsParams.STREAMER_USER_ID,
				},
			},
		},
		[SUBSCRIPTION_TYPE.UPDATE_REWARD]: {
			exists: false,
			details: {
				type: SUBSCRIPTION_TYPE.UPDATE_REWARD,
				callback: `${Resource.TwitchAPI.url}`,
				condition: {
					broadcaster_user_id: Resource.CardsParams.STREAMER_USER_ID,
				},
			},
		},
		[SUBSCRIPTION_TYPE.REMOVE_REWARD]: {
			exists: false,
			details: {
				type: SUBSCRIPTION_TYPE.REMOVE_REWARD,
				callback: `${Resource.TwitchAPI.url}`,
				condition: {
					broadcaster_user_id: Resource.CardsParams.STREAMER_USER_ID,
				},
			},
		},
	};

	activeSubscriptions.forEach(async (sub) => {
		if (sub.status !== 'enabled') {
			await deleteTwitchEventSubscription(sub.id);
			return;
		}
		const details = subDetails[sub.type];
		if (details && sub.transport.callback === Resource.TwitchAPI.url) details.exists = true;
	});

	const promises = Object.entries(subDetails).map(([, details]) => {
		if (!details || details.exists) return Promise.resolve(null);
		return subscribeToTwitchEvent(details.details);
	});

	const results = await Promise.all(promises);

	const eventBridge = new EventBridge();
	await eventBridge.putEvents({
		Entries: [
			{
				Source: 'site',
				DetailType: 'refresh-channel-point-rewards',
				Detail: JSON.stringify({}),
				EventBusName: Resource.EventBus.name,
			},
		],
	});

	return {
		statusCode: 200,
		body: JSON.stringify(results),
	};
});

interface TwitchSubscriptionDetails {
	exists: boolean;
	details: TwitchEvent;
}
