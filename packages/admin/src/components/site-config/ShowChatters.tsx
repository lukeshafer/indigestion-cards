import { createResource } from 'solid-js';
import { API } from '@/constants';
import { isChatters } from '@/lib/client/chatters';

export default function ShowChatters() {
	const [chatters] = createResource(async () => {
		const res = await fetch(API.TWITCH_CHATTERS);
		const data = await res.json().catch(() => ({}));
		return isChatters(data) ? data : [];
	});

	return (
		<div class="bg-gray-200 p-4">
			<h1 class="text-lg font-bold">Chatters</h1>
			<pre class="whitespace-pre-wrap">{JSON.stringify(chatters(), null, 2)}</pre>
		</div>
	);
}
