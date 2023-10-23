import { ProtectedApiHandler } from '@lil-indigestion-cards/core/lib/api';
import { getTwitchChatters } from '@lil-indigestion-cards/core/lib/twitch';

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
