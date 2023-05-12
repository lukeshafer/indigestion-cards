import { getAllChannelPointRewards } from '@lil-indigestion-cards/core/twitch-helpers';
import { ApiHandler } from 'sst/node/api';
import { useSession } from 'sst/node/future/auth';
import { Config } from 'sst/node/config';

export const handler = ApiHandler(async () => {
	const session = useSession();
	if (session.type !== 'admin')
		return {
			statusCode: 401,
			body: 'Unauthorized',
		};

	const rewards = await getAllChannelPointRewards({ userId: Config.STREAMER_USER_ID });

	return {
		statusCode: 200,
		body: JSON.stringify(rewards),
	};
});
