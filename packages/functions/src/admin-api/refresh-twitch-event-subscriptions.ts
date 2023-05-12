import { Api } from 'sst/node/api';
import {
	subscribeToTwitchEvent,
	getActiveTwitchEventSubscriptions,
} from '@lil-indigestion-cards/core/twitch-helpers';
import { Config } from 'sst/node/config';

export const handler = async () => {
	const activeSubscriptions = await getActiveTwitchEventSubscriptions();

	let hasGiftSubSubscription = false;
	let hasChannelPointSubscription = false;
	activeSubscriptions.forEach((sub) => {
		if (sub.status !== 'enabled') return;
		if (sub.type === 'channel.subscription.gift') hasGiftSubSubscription = true;
		if (sub.type === 'channel.channel_points_custom_reward_redemption.add')
			hasChannelPointSubscription = true;
	});

	const giftSubPromise = hasGiftSubSubscription
		? Promise.resolve(null)
		: subscribeToTwitchEvent({
				type: 'channel.subscription.gift',
				callback: `${Api.twitchApi.url}`,
				condition: {
					broadcaster_user_id: Config.STREAMER_USER_ID,
				},
		  });

	const channelPointSubPromise = hasChannelPointSubscription
		? Promise.resolve(null)
		: subscribeToTwitchEvent({
				type: 'channel.channel_points_custom_reward_redemption.add',
				callback: `${Api.twitchApi.url}`,
				condition: {
					broadcaster_user_id: Config.STREAMER_USER_ID,
				},
		  });

	const results = await Promise.all([giftSubPromise, channelPointSubPromise]);

	return {
		statusCode: 200,
		body: JSON.stringify(results),
	};
};
