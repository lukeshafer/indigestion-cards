import { Api, ApiHandler } from 'sst/node/api';
import { EventBus } from 'sst/node/event-bus';
import { EventBridge } from '@aws-sdk/client-eventbridge';
import {
	subscribeToTwitchEvent,
	getActiveTwitchEventSubscriptions,
	TwitchEvent,
	SUBSCRIPTION_TYPE,
	type SubscriptionType,
	deleteTwitchEventSubscription,
} from '@lil-indigestion-cards/core/twitch-helpers';
import { Config } from 'sst/node/config';
import { setAdminEnvSession } from '@lil-indigestion-cards/core/user';
import { useSession } from 'sst/node/future/auth';

export const handler = ApiHandler(async () => {
	const session = useSession();
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
				callback: `${Api.twitchApi.url}`,
				condition: {
					broadcaster_user_id: Config.STREAMER_USER_ID,
				},
			},
		},
		[SUBSCRIPTION_TYPE.REDEEM_REWARD]: {
			exists: false,
			details: {
				type: SUBSCRIPTION_TYPE.REDEEM_REWARD,
				callback: `${Api.twitchApi.url}`,
				condition: {
					broadcaster_user_id: Config.STREAMER_USER_ID,
				},
			},
		},
		[SUBSCRIPTION_TYPE.ADD_REWARD]: {
			exists: false,
			details: {
				type: SUBSCRIPTION_TYPE.ADD_REWARD,
				callback: `${Api.twitchApi.url}`,
				condition: {
					broadcaster_user_id: Config.STREAMER_USER_ID,
				},
			},
		},
		[SUBSCRIPTION_TYPE.UPDATE_REWARD]: {
			exists: false,
			details: {
				type: SUBSCRIPTION_TYPE.UPDATE_REWARD,
				callback: `${Api.twitchApi.url}`,
				condition: {
					broadcaster_user_id: Config.STREAMER_USER_ID,
				},
			},
		},
		[SUBSCRIPTION_TYPE.REMOVE_REWARD]: {
			exists: false,
			details: {
				type: SUBSCRIPTION_TYPE.REMOVE_REWARD,
				callback: `${Api.twitchApi.url}`,
				condition: {
					broadcaster_user_id: Config.STREAMER_USER_ID,
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
		if (details && sub.transport.callback === Api.twitchApi.url) details.exists = true;
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
				EventBusName: EventBus.eventBus.eventBusName,
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
