import { loadAllUsers } from '@site/data';
import { createAsync } from '@solidjs/router';
import { For } from 'solid-js';

export default function Home() {
	const users = createAsync(() => loadAllUsers());

	return (
		<ul>
			<For each={users()}>
				{user => (
					<div>
						<a href={`/users/${user.username}`}>{user.username}</a>
					</div>
				)}
			</For>
		</ul>
	);
}
