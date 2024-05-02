import { SiteHandler } from '@core/lib/api';
import { getTwitchChatters } from '@core/lib/twitch';

export const handler = SiteHandler({ authorizationType: 'admin' }, async () => {
	const chatters = await getTwitchChatters().catch(() => []);

	return {
		statusCode: 200,
		body: JSON.stringify(chatters),
		headers: {
			'Content-Type': 'application/json',
		},
	};
});
