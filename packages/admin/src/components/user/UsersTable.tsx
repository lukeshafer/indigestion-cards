import Table from '@admin/components/table/Table';
import type { User, Preorder } from '@core/types';
import { routes } from '@admin/constants';
import CardsIcon from '../icons/CardsIcon';
import PacksIcon from '../icons/PacksIcon';
import { createMemo } from 'solid-js';

export default function UsersTable(props: { users: User[]; preorders?: Preorder[] }) {
	const users = createMemo(() =>
		props.users.map((user) => ({
			...user,
			preorders: props.preorders?.filter((preorder) => preorder.userId === user.userId) ?? [],
		}))
	);

	return (
		<Table
			search={{
				label: 'Search by username',
				column: 'username',
			}}
			id="user-table"
			columns={[
				{
					name: 'username',
					label: 'Username',
					width: '65%',
					align: 'left',
					font: 'title',
				},
				{
					name: 'cardCount',
					label: 'Cards',
					type: 'number',
					startDescending: true,
				},
				{
					name: 'packCount',
					label: 'Packs',
					type: 'number',
					startDescending: true,
				},
			]}
			rows={users().map((user) => ({
				username: {
					element: (
						<a
							style={{ 'view-transition-name': `${user.username}-username` }}
							href={`${routes.USERS}/${user.username}`}
							class="hover:underline focus:underline">
							{user.username}
						</a>
					),
					value: user.username,
				},
				cardCount: {
					element: (
						<>
							<div
								aria-hidden="true"
								class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 fill-white stroke-white dark:fill-gray-900 dark:stroke-gray-900">
								<CardsIcon class="drop-shadow" size={35} />
							</div>
							<span class="relative rounded-full bg-white/75 p-1 dark:bg-gray-900 dark:font-semibold">
								{user.cardCount}
							</span>
						</>
					),
					value: user.cardCount,
				},
				packCount: {
					element: (
						<>
							<div
								aria-hidden="true"
								class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 fill-white stroke-white dark:fill-gray-900 dark:stroke-gray-900">
								<PacksIcon class="drop-shadow" size={30} />
							</div>
							<span class="relative rounded-full bg-white/75 p-1 dark:bg-gray-900 dark:font-semibold">
								{user.packCount + user.preorders.length}
							</span>
						</>
					),
					value: user.packCount,
				},
			}))}
		/>
	);
}
