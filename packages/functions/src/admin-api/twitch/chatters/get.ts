import { ProtectedApiHandler } from '@lib/api';
import { getTwitchChatters } from '@lib/twitch';

export const handler = ProtectedApiHandler(async () => {
	const chatters = await getTwitchChatters();

	return {
		statusCode: 200,
		body: JSON.stringify(chatters),
		headers: {
			'Content-Type': 'application/json',
		},
	};
});
