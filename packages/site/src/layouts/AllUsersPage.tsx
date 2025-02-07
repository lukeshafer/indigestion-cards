import type { Preorder, User } from '@core/types';
import {
	createSignal,
	For,
	Match,
	Show,
	Switch,
	type Component,
	type ParentComponent,
} from 'solid-js';
import { CardEls, FULL_ART_BACKGROUND_CSS, cardUtils } from '@site/components/Card';
import type { TwitchUser } from '@core/lib/twitch';
import { routes } from '@site/constants';
import { createTable, Table, TBody, TCell, THead, THeading, TRow, TSearch } from '@site/components/Table';
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
	const [view, setView] = createSignal<'table' | 'icon'>('table');

	return (
		<>
			<Switch>
				<Match when={view() === 'table'}>
          {
            //<button onClick={() => setView('icon')}>Switch to icon view</button>
          }
					<UsersTable users={props.users} />
				</Match>
				<Match when={view() === 'icon'}>
          {
            //<button onClick={() => setView('table')}>Switch to table view</button>
          }
					<UsersIconList users={props.users} />
				</Match>
			</Switch>
		</>
	);
};

const UsersTable: Component<{
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

const UsersIconList: Component<{
	users: Array<UserPageRecord>;
}> = props => (
	<ul class="flex w-full flex-wrap justify-center gap-4">
		<For each={props.users}>
			{(userData, index) => (
				<li class="w-fit">
					<UsersIconListItem {...userData} lazy={index() > 8} />
				</li>
			)}
		</For>
	</ul>
);

const UsersIconListItem: Component<{
	user: User;
	twitch?: TwitchUser | null | undefined;
	preorders: Array<Preorder>;
	lazy: boolean;
}> = props => {
	const packCount = () => props.user.packCount + props.preorders.length;

	return (
		<a
			class="groupuser relative grid items-end border border-gray-900"
			data-user
			href={`${routes.USERS}/${props.user.username}`}>
			<div class="flex w-full justify-center">
				<Show when={props.user.pinnedCard} fallback={<EmptyPinnedCard />}>
					{pinnedCard => (
						<PinnedCard
							card={pinnedCard()}
							username={props.user.username}
							lazy={props.lazy}
						/>
					)}
				</Show>
			</div>
			<div class="absolute bottom-0 left-0 right-0 flex min-h-20 items-center gap-4 bg-gray-900 px-2 py-5 transition-transform">
				<img
					loading={props.lazy ? 'lazy' : undefined}
					alt={`${props.user.username}'s profile picture`}
					src={props.twitch?.profile_image_url}
					style={{ 'view-transition-name': `profile-pic-${props.user.username}` }}
					width="60"
					height="60"
					class="absolute -top-0 h-fit -translate-y-2/3 rounded-full"
				/>
				<div>
					<h2 class="font-display relative w-fit pt-1 italic transition-all">
						{props.user.username}
						<div class="absolute bottom-1 w-0 border-t-2 border-t-[inherit] transition-all group-[user]:group-hover:w-full"></div>
					</h2>
					<p class="text-sm">{props.user.cardCount} cards</p>
					<Show when={packCount() > 0}>
						<p class="text-sm">
							{packCount()} unopened {packCount() > 1 ? 'packs' : 'pack'}
						</p>
					</Show>
				</div>
			</div>
		</a>
	);
};

const ICON_CARD_SCALE = 1;

const EmptyPinnedCard: Component = () => (
	<CardEls.Card
		scale={ICON_CARD_SCALE}
		lazy={false}
		alt=""
		imgSrc=""
		viewTransitionName={undefined}
		background={undefined}>
		<div class="flex h-full w-full items-center justify-center font-bold opacity-50">
			No card pinned
		</div>
	</CardEls.Card>
);

const PinnedCard: Component<{
	card: NonNullable<User['pinnedCard']>;
	username: string;
	lazy: boolean;
}> = props => {
	return (
		<div class="group relative">
			<CardEls.Card
				scale={ICON_CARD_SCALE}
				lazy={props.lazy}
				alt={props.card.cardName}
				imgSrc={cardUtils.getCardImageUrl(props.card)}
				viewTransitionName={`card-${props.card.instanceId}`}
				background={
					cardUtils.checkIsFullArt(props.card.rarityId)
						? FULL_ART_BACKGROUND_CSS
						: props.card.rarityColor
				}>
				<Show when={cardUtils.checkIfCanShowCardText(props.card.rarityId)}>
					<CardEls.CardName>{props.card.cardName}</CardEls.CardName>
					<CardEls.CardDescription>{props.card.cardName}</CardEls.CardDescription>
				</Show>
				<Show when={!cardUtils.checkIsLegacyCard(props.card.rarityId)}>
					<CardEls.CardNumber
						color={cardUtils.checkIsFullArt(props.card.rarityId) ? 'white' : 'black'}>
						{cardUtils.formatCardNumber(props.card)}
					</CardEls.CardNumber>
				</Show>
				<Show when={cardUtils.checkIsShitPack(props.card.stamps)}>
					<CardEls.ShitStamp src={cardUtils.getShitStampPath(props.card.rarityId)} />
				</Show>
			</CardEls.Card>
			<CardEls.ShineMouseEffect />
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
