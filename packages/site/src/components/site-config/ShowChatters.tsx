import { createResource } from "solid-js";
import { API } from "@/constants";
import { isChatters } from '@/lib/client/chatters';

export default function ShowChatters() {
	const [chatters, { refetch: refetchChatters }] = createResource(async () => {
		const res = await fetch(API.TWITCH_CHATTERS);
		const data = await res.json().catch(() => ({}));
		return isChatters(data) ? data : [];
	});

	return (
		<div class="p-4 bg-gray-200">
			<h1 class="font-bold text-lg">Chatters</h1>
				<pre class="whitespace-pre-wrap">{JSON.stringify(chatters(), null, 2)}</pre>
		</div>
	);
}
