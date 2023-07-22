import {
	refreshChannelPointRewards,
	addMessageToSiteConfig,
	removeMessageFromSiteConfig,
} from '@lil-indigestion-cards/core/site-config';
import { getAllChannelPointRewards } from '@lil-indigestion-cards/core/twitch-helpers';
import { setAdminEnvSession } from '@lil-indigestion-cards/core/user';
import { Config } from 'sst/node/config';

export async function handler() {
	setAdminEnvSession(
		'Event: refresh-channel-point-rewards',
		'event_refresh_channel_point_rewards'
	);
	console.log('Refreshing channel point rewards...');
	const refreshTokenError =
		'Twitch Authentication Error. If you are Ryan, please go to "Site Config" and click "Authorize Streamer Permissions" to refresh your token.';
	const rewards = await getAllChannelPointRewards({ userId: Config.STREAMER_USER_ID }).catch(
		async (e) => {
			console.error('Error getting channel point rewards: ', e);
			await addMessageToSiteConfig({
				type: 'error',
				message: refreshTokenError,
			});
			throw e;
		}
	);
	await refreshChannelPointRewards(
		rewards.filter((reward) => reward.is_enabled && !reward.is_paused)
	);

	await removeMessageFromSiteConfig({ message: refreshTokenError });
	return { statusCode: 200 };
}
