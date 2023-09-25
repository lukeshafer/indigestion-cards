import { createResource } from "solid-js";
import { API } from "@/constants";

export default function ShowChatters() {
	const [chatters, { refetch }] = createResource(async () => {
		const response = await fetch(API.TWITCH_CHATTERS);
		return response.text();
	})

	return (
		<div class="p-4 bg-gray-200">
			<h1 class="font-bold text-lg">Chatters</h1>
				<pre class="whitespace-pre-wrap">{JSON.stringify(chatters(), null, 2)}</pre>
		</div>
	);
}
