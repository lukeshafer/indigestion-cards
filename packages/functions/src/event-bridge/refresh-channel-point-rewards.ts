import { Resource } from 'sst';
import {
	refreshChannelPointRewards,
	addMessageToSiteConfig,
	removeMessageFromSiteConfig,
} from '@core/lib/site-config';
import { getAllChannelPointRewards } from '@core/lib/twitch';
import { setAdminEnvSession } from '@core/lib/session';

export async function handler() {
	setAdminEnvSession(
		'Event: refresh-channel-point-rewards',
		'event_refresh_channel_point_rewards'
	);
	console.log('Refreshing channel point rewards...');
	const refreshTokenError =
		'Twitch Authentication Error. If you are Ryan, please go to "Site Config" and click "Authorize Streamer Permissions" to refresh your token.';
	const rewards = await getAllChannelPointRewards({
		userId: Resource.CardsParams.STREAMER_USER_ID,
	}).catch(async e => {
		console.error('Error getting channel point rewards: ', e);
		await addMessageToSiteConfig({
			type: 'error',
			message: refreshTokenError,
		});
		throw e;
	});
	await refreshChannelPointRewards(rewards);

	await removeMessageFromSiteConfig({ message: refreshTokenError });
	return { statusCode: 200 };
}
