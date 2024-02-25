import { PageHeader, PageTitle } from '@/components/text';
import UsersTable from '@/components/user/UsersTable';
import { trpc } from '@/trpc/client';
import type { Preorder } from '@lil-indigestion-cards/core/db/preorders';
import type { User } from '@lil-indigestion-cards/core/db/users';
import { createQuery } from '@tanstack/solid-query';
import { Show } from 'solid-js';
import type { RouteOptions, RouteComponent } from '@/data/router';

type RouteData = {
	users: Array<User>;
	preorders: Array<Preorder>;
};

export const route = {
	path: '/user',
	load: (_, ssrData) => {
		const users = createQuery(() => ({
			queryKey: ['users'],
			queryFn: () => trpc.users.all.query(),
			initialData: ssrData?.users,
		}));

		const preorders = createQuery(() => ({
			queryKey: ['preorders'],
			queryFn: () => trpc.preorders.all.query(),
			initialData: ssrData?.preorders,
		}));

		return {
			get users() {
				return users.data;
			},
			get preorders() {
				return preorders.data;
			},
		};
	},
} satisfies RouteOptions<RouteData>;

export default (function UsersPage(props) {
	return (
		<>
			<PageHeader>
				<PageTitle>Users</PageTitle>
			</PageHeader>
			<div class="mx-auto max-w-2xl">
				<Show when={props.data?.users}>
					{users => <UsersTable users={users()} preorders={props.data?.preorders} />}
				</Show>
			</div>
		</>
	);
} satisfies RouteComponent<RouteData>);
