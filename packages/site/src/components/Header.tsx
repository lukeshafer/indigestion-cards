import HeaderLink from './HeaderLink';
import UserConfig from './UserConfig';
import UserSearch from './UserSearch';
import { ASSETS, routes } from '@/constants';
import { Show, useContext } from 'solid-js';
import TradeNotificationCount from './TradeNotificationCount';
import TotalPackCount from './TotalPackCount';
import { ClientContext } from '@/client/context';
import { getSiteConfig, getTwitchUser } from '@/client/data';

const logos = {
	default: ASSETS.LOGO,
	tongle: ASSETS.TONGLE,
} satisfies Record<string, string>;

export default function Header(props: { logo?: keyof typeof logos }) {
	const siteConfig = getSiteConfig();
	const ctx = useContext(ClientContext);
	const username = ctx?.session?.properties.username;
	const twitchData = username ? getTwitchUser(username) : null;
	const canSeeTradesLink = () =>
		(ctx?.session?.type === 'user' || ctx?.session?.type === 'admin') &&
		siteConfig.data?.tradingIsEnabled;

	return (
		<div class="border-b border-b-gray-300 bg-white dark:border-b-gray-800 dark:bg-gray-950">
			<header class="max-w-main relative mx-auto flex items-center gap-4 px-4 py-2 text-white md:py-4">
				<nav class="scrollbar-hidden flex flex-1 items-center gap-2 overflow-x-scroll text-black md:gap-4">
					<a
						href="/"
						title="Home"
						class="mr-4 flex w-fit min-w-[2rem] items-center gap-4">
						<img
							src={logos[props.logo || 'default']}
							alt="logo"
							class={`block w-12 ${
								props.logo === 'default' || props.logo === undefined
									? 'dark:invert'
									: ''
							}`}
							width="192"
						/>
						<div class="font-display hidden flex-1 flex-col pt-1 sm:flex">
							<span class="text-brand-main mt-1 text-2xl lowercase italic">
								Indigestion
							</span>
							<span class="-mt-2 text-lg lowercase text-gray-700 dark:text-gray-200">
								Cards
							</span>
						</div>
					</a>
					<Show when={ctx?.session?.type === 'admin'}>
						<HeaderLink href={routes.ADMIN.OPEN_PACKS} title="Open Packs">
							Open Packs
							<TotalPackCount count={0} />
						</HeaderLink>
					</Show>
					<HeaderLink href={routes.CARDS} title="Cards">
						Cards
					</HeaderLink>
					<HeaderLink href={routes.USERS} title="Users">
						Users
					</HeaderLink>
					<Show when={canSeeTradesLink()}>
						<HeaderLink href={routes.TRADES} title="Trades">
							<TradeNotificationCount username={ctx?.session?.properties.username!} />
							My Trades
						</HeaderLink>
					</Show>
				</nav>
				<UserSearch />
				<UserConfig disableAnimations={ctx?.disableAnimations} user={twitchData?.data} />
			</header>
		</div>
	);
}
