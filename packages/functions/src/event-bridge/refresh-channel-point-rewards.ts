import { refreshChannelPointRewards } from '@lil-indigestion-cards/core/site-config';
import { getAllChannelPointRewards } from '@lil-indigestion-cards/core/twitch-helpers';
import { Config } from 'sst/node/config';

export async function handler() {
	const rewards = await getAllChannelPointRewards({ userId: Config.STREAMER_USER_ID });
	await refreshChannelPointRewards(rewards.filter((reward) => reward.is_enabled && !reward.is_paused));
	return { statusCode: 200 };
}
