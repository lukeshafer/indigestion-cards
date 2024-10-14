import { loadAllUsers } from '@site/data';
import { createAsync } from '@solidjs/router';
import { For } from 'solid-js';

export default function Home() {
	const users = createAsync(() => loadAllUsers());

	return (
		<ul>
			<For each={users()}>{card => <p>{card.username}</p>}</For>
		</ul>
	);
}
