import { SiteHandler } from '@lib/api';
import { getTwitchChatters } from '@lib/twitch';

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
