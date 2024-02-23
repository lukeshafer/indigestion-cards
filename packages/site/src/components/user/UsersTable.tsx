import type { User } from '@lil-indigestion-cards/core/db/users';
import Table from '../table/Table';
import type { Preorder } from '@lil-indigestion-cards/core/db/preorders';
import { For, createSignal } from 'solid-js';
import { transitionname } from '@/lib/client/utils';
import { routes } from '@/constants';
import CardsIcon from '../icons/CardsIcon';
import PacksIcon from '../icons/PacksIcon';
// @ts-ignore
() => void transitionname;

export default function UsersTable(props: { users: User[]; preorders?: Preorder[] }) {
	const users = () =>
		props.users?.map(user => ({
			...user,
			preorders: props.preorders?.filter(p => p.userId === user.userId) ?? [],
		}));

	const [search, setSearch] = createSignal('');

	return (
		<>
			<Table.Search label="Search users" setSearchText={setSearch} />
			<Table.Table searchColumn="username" searchText={search()}>
				<Table.Head>
					<Table.Column name="username" width="65%" align="left">
						Username
					</Table.Column>
					<Table.Column name="cardCount" type="number" startDescending>
						Cards
					</Table.Column>
					<Table.Column name="packCount" type="number" startDescending>
						Packs
					</Table.Column>
				</Table.Head>
				<Table.Body>
					<For each={users()}>
						{user => (
							<Table.Row>
								<Table.Cell
									column="username"
									align="left"
									font="title"
									value={user.username}>
									<a
										use:transitionname={`${user.username}-username`}
										href={`${routes.USERS}/${user.username}`}
										class="hover:underline focus:underline">
										{user.username}
									</a>
								</Table.Cell>
								<Table.Cell column="cardCount" value={user.cardCount}>
									<div
										aria-hidden="true"
										class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 fill-white stroke-white dark:fill-gray-900 dark:stroke-gray-900">
										<CardsIcon class="drop-shadow" size={35} />
									</div>
									<span class="relative rounded-full bg-white/75 p-1 dark:bg-gray-900 dark:font-semibold">
										{user.cardCount}
									</span>
								</Table.Cell>
								<Table.Cell
									column="packCount"
									value={user.packCount + user.preorders.length}>
									<div
										aria-hidden="true"
										class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 fill-white stroke-white dark:fill-gray-900 dark:stroke-gray-900">
										<PacksIcon class="drop-shadow" size={35} />
									</div>
									<span class="relative rounded-full bg-white/75 p-1 dark:bg-gray-900 dark:font-semibold">
										{user.packCount + user.preorders.length}
									</span>
								</Table.Cell>
							</Table.Row>
						)}
					</For>
				</Table.Body>
			</Table.Table>
		</>
	);
}
