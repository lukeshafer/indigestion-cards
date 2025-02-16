import type { Preorder, User } from '@core/types';
import { For, type Component, type ParentComponent } from 'solid-js';
import type { TwitchUser } from '@core/lib/twitch';
import { routes } from '@site/constants';
import {
	createTable,
	Table,
	TBody,
	TCell,
	THead,
	THeading,
	TRow,
	TSearch,
} from '@site/components/Table';
import CardsIcon from '@site/components/icons/CardsIcon';
import PacksIcon from '@site/components/icons/PacksIcon';

type UserPageRecord = {
	user: User;
	twitch?: TwitchUser | null | undefined;
	preorders: Array<Preorder>;
};

export const UsersPage: Component<{
	users: Array<UserPageRecord>;
}> = props => {
	const table = createTable(
		() => ({
			username: 'text',
			cardCount: {
				type: 'number',
				startDescending: true,
			},
			packCount: {
				type: 'number',
				startDescending: true,
			},
		}),
		() =>
			props.users.map(user => ({
				username: user.user.username,
				packCount: user.user.packCount + user.preorders?.length,
				cardCount: user.user.cardCount,
			}))
	);

	table.setFilteredColumn('username');

	return (
		<div class="mx-auto max-w-2xl">
			<div class="ml-auto max-w-40">
				<TSearch
					label="Search users"
					onInput={value => table.setFilterString(value)}></TSearch>
			</div>
			<Table>
				<THead>
					<THeading table={table} name="username" align="left" width="70%">
						Username
					</THeading>
					<THeading table={table} name="cardCount" align="center">
						Cards
					</THeading>
					<THeading table={table} name="packCount" align="center">
						Packs
					</THeading>
				</THead>
				<TBody>
					<For each={table.rows}>
						{row => (
							<TRow>
								<TCell font="title" align="left">
									<a
										style={{
											'view-transition-name': `${row.username}-username`,
										}}
										href={`${routes.USERS}/${row.username}`}
										class="hover:underline focus:underline">
										{row.username}
									</a>
								</TCell>
								<TCell align="center">
									<CardIconTableItem>{row.cardCount}</CardIconTableItem>
								</TCell>
								<TCell align="center">
									<PackIconTableItem>{row.packCount}</PackIconTableItem>
								</TCell>
							</TRow>
						)}
					</For>
				</TBody>
			</Table>
		</div>
	);
};

const CardIconTableItem: ParentComponent = props => (
	<>
		<div
			aria-hidden="true"
			class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 fill-white stroke-white dark:fill-gray-900 dark:stroke-gray-900">
			<CardsIcon class="drop-shadow" size={35} />
		</div>
		<span class="relative rounded-full bg-white/75 p-1 dark:bg-gray-900 dark:font-semibold">
			{props.children}
		</span>
	</>
);
const PackIconTableItem: ParentComponent = props => (
	<>
		<div
			aria-hidden="true"
			class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 fill-white stroke-white dark:fill-gray-900 dark:stroke-gray-900">
			<PacksIcon class="drop-shadow" size={35} />
		</div>
		<span class="relative rounded-full bg-white/75 p-1 dark:bg-gray-900 dark:font-semibold">
			{props.children}
		</span>
	</>
);
