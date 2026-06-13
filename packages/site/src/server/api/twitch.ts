import { adminProcedure } from '../router';
import { getTwitchChatters } from '@core/lib/twitch';

export const twitch = {
	chatters: adminProcedure.query(async () => {
		const chatters = await getTwitchChatters().catch(() => []);
		return chatters;
	}),
};
