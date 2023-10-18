import Table from '@/components/table/Table';
import type { UserEntity } from '@lil-indigestion-cards/core/user';
import { TbCards } from 'solid-icons/tb';
import { FaSolidGift } from 'solid-icons/fa';
import { routes } from '@/constants';

export default function UsersTable(props: { users: UserEntity[] }) {
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
			rows={props.users.map((user) => ({
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
							<TbCards
								aria-hidden="true"
								size={50}
								class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 fill-white stroke-white dark:fill-gray-900 dark:stroke-gray-900"
							/>
							<span class="relative rounded-full bg-white p-1 dark:bg-gray-900 dark:font-semibold">
								{user.cardCount}
							</span>
						</>
					),
					value: user.cardCount,
				},
				packCount: {
					element: (
						<>
							<FaSolidGift
								aria-hidden="true"
								size={40}
								class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 fill-white stroke-white dark:fill-gray-900 dark:stroke-gray-900"
							/>
							<span class="relative rounded-full bg-white p-1 dark:bg-gray-900 dark:font-semibold">
								{user.packCount}
							</span>
						</>
					),
					value: user.packCount,
				},
			}))}
		/>
	);
}
