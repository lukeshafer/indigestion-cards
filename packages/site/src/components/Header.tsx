import type { TwitchUser } from '@core/lib/twitch';
import { LOGOS, routes } from '@site/constants';
import { Show, type Component, type JSXElement } from 'solid-js';
import ButtonCount from './ButtonCount';
import TradeNotificationCount from './TradeNotificationCount';
import UserSearch from './UserSearch';
import UserConfig from './UserConfig';

export const Header: Component<{
	logo?: keyof typeof LOGOS;
	disableAnimations: boolean;
	canSeeTradesLink: boolean;
	loggedInUsername?: string;
	twitchData?: TwitchUser;
	packCount?: number;
	isAdmin: boolean;
}> = props => {
	return (
		<div class="border-b border-b-gray-300 bg-white dark:border-b-gray-800 dark:bg-gray-950">
			<header class="max-w-main relative mx-auto flex items-center gap-4 px-4 py-2 text-white md:py-4">
				<nav class="scrollbar-hidden flex flex-1 items-center gap-2 overflow-x-scroll text-black md:gap-4">
					<a
						href="/"
						title="Home"
						class="mr-4 flex w-fit min-w-[2rem] items-center gap-4">
						<img
							src={LOGOS[props.logo || 'default']}
							alt="logo"
							class={`block w-12 ${props.logo === 'default' ? 'dark:invert' : ''}`}
							width="192"
						/>
						<div class="font-display hidden flex-1 flex-col pt-1 sm:flex">
							<span class="text-brand-main shadow-brand-main/0 mt-1 text-2xl lowercase italic contrast-100 drop-shadow-[0_0px_5px_#EF6EDA00] transition-all duration-1000 ease-in-out hover:contrast-200 hover:drop-shadow-[0_0px_5px_#EF6EDA88]">
								Indigestion
							</span>
							<span class="-mt-2 text-lg lowercase text-gray-700 contrast-100 transition-all duration-500 hover:contrast-200 dark:text-gray-200">
								Cards
							</span>
						</div>
					</a>
					<Show when={props.isAdmin}>
						<HeaderLink href={routes.OPEN_PACKS} title="Open Packs">
							Open Packs
							<Show when={props.packCount}>
								{count => <ButtonCount>{count()}</ButtonCount>}
							</Show>
						</HeaderLink>
					</Show>
					<HeaderLink href={routes.CARDS} title="Cards">
						Cards
					</HeaderLink>
					<HeaderLink href={routes.USERS} title="Users">
						Users
					</HeaderLink>
					<Show when={props.canSeeTradesLink && props.loggedInUsername}>
						{username => (
							<HeaderLink href={routes.TRADES} title="Trades">
								<TradeNotificationCount username={username()} />
								My Trades
							</HeaderLink>
						)}
					</Show>
				</nav>
				<UserSearch />
				<UserConfig disableAnimations={props.disableAnimations} user={props.twitchData} />
			</header>
		</div>
	);
};

const HeaderLink: Component<{
	href: string;
	title: string;
	children?: JSXElement;
}> = props => {
	let currentPage = location.href;
	return (
		<a
			href={props.href}
			title={props.title}
			style={{
				'view-transition-name': `page-header-nav-${props.href}`,
			}}
			class="relative rounded px-2 py-1 transition-colors"
			classList={{
				'text-brand-main bg-brand-100 dark:bg-brand-dark dark:hover:bg-brand-900 dark:hover:text-brand-main hover:bg-brand-200 hover:text-brand-dark font-bold dark:text-white':
					currentPage.startsWith(props.href),
				'text-gray-700 hover:bg-gray-200 hover:text-black dark:font-medium dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-white':
					!currentPage.startsWith(props.href),
			}}>
			{props.children}
		</a>
	);
};
