import { createResource } from 'solid-js';
import { API } from '@/constants';

export const [chatters, { refetch: refetchChatters }] = createResource<Chatter[]>(() => {
	console.log('fetching chatters')
	return fetch(API.TWITCH_CHATTERS)
		.then<unknown>((response) => response.json())
		.catch(() => ({}))
		.then<Chatter[]>((data) => (isChatters(data) ? data : []));
});

interface Chatter {
	user_id: string;
	user_login: string;
	user_name: string;
}
function isChatters(data: unknown): data is Chatter[] {
	return (
		Array.isArray(data) &&
		data.every(
			(item) =>
				typeof item === 'object' &&
				item !== null &&
				'user_id' in item &&
				'user_login' in item &&
				'user_name' in item &&
				typeof item.user_id === 'string' &&
				typeof item.user_login === 'string' &&
				typeof item.user_name === 'string'
		)
	);
}
