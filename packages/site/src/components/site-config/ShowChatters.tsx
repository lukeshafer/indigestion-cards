import { createResource } from "solid-js";
import { API } from "@/constants";
import { chatters } from "@/lib/client/resources";

export default function ShowChatters() {
	return (
		<div class="p-4 bg-gray-200">
			<h1 class="font-bold text-lg">Chatters</h1>
				<pre class="whitespace-pre-wrap">{JSON.stringify(chatters(), null, 2)}</pre>
		</div>
	);
}
