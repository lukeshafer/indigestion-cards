import Table from '@/components/table/Table';
import type { UserEntity } from '@lil-indigestion-cards/core/user';
import { TbCards } from 'solid-icons/tb';
import { FaSolidGift } from 'solid-icons/fa';
import { routes } from '@/constants';

export default function UsersTable(props: { users: UserEntity[] }) {
	return (
		<Table
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
				},
				{
					name: 'packCount',
					label: 'Packs',
					type: 'number',
				},
			]}
			rows={props.users.map((user) => ({
				username: (
					<a
						href={`${routes.USERS}/${user.username}`}
						class="hover:underline focus:underline">
						{user.username}
					</a>
				),
				cardCount: (
					<>
						<TbCards
							aria-hidden="true"
							fill="white"
							stroke="white"
							size={50}
							class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
						/>
						<span class="relative rounded-full bg-white p-1">{user.cardCount}</span>
					</>
				),
				packCount: (
					<>
						<FaSolidGift
							aria-hidden="true"
							fill="white"
							stroke="white"
							size={40}
							class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
						/>
						<span class="relative rounded-full bg-white p-1">{user.packCount}</span>
					</>
				),
			}))}
		/>
	);
}
