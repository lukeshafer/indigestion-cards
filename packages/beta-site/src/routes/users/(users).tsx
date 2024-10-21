import { $_allUsers } from '@site/lib/data.server';
import { cache, createAsync, type RouteSectionProps } from '@solidjs/router';
import { For, type Component } from 'solid-js';

const fetchUsers = cache($_allUsers, 'users');

export const route = {
	preload() {
		return fetchUsers();
	},
};

const UsersPage: Component<RouteSectionProps> = () => {
	const users = createAsync(() => fetchUsers());

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
};

export default UsersPage;
