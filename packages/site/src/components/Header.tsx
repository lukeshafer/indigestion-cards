import HeaderLink from './HeaderLink';
import UserConfig from '@/components/UserConfig';
import UserSearch from '@/components/UserSearch';
import { LOGOS, routes } from '@/constants';
import { Show } from 'solid-js';
import TradeNotificationCount from './TradeNotificationCount';
import TotalPackCount from './pack/TotalPackCount';
import { useConfig } from '@/lib/client/context';
import type { SiteConfig } from '@lil-indigestion-cards/core/db/siteConfig';
import type { TwitchUser } from '@lil-indigestion-cards/core/lib/twitch';

export default function Header(props: {
	logo?: keyof typeof LOGOS;
	siteConfig: SiteConfig;
	twitchData?: TwitchUser;
}) {
	const globalConfig = useConfig();
	const username = () => globalConfig.session?.properties.username;
	const logo = () => props.logo || 'default';

	return (
		<div class="border-b border-b-gray-300 bg-white dark:border-b-gray-800 dark:bg-gray-950">
			<header class="max-w-main relative mx-auto flex items-center gap-4 px-4 py-2 text-white md:py-4">
				<nav class="scrollbar-hidden flex flex-1 items-center gap-2 overflow-x-scroll text-black md:gap-4">
					<a
						href="/"
						title="Home"
						class="mr-4 flex w-fit min-w-[2rem] items-center gap-4">
						<img
							src={LOGOS[logo()]}
							alt="logo"
							class={`block w-12 ${logo() === 'default' ? 'dark:invert' : ''}`}
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
          <Show when={globalConfig.session?.type === 'admin'}>
						<HeaderLink href={routes.ADMIN.OPEN_PACKS} title="Open Packs">
							Open Packs
							<TotalPackCount />
						</HeaderLink>
          </Show>
					<HeaderLink href={routes.CARDS} title="Cards">
						Cards
					</HeaderLink>
					<HeaderLink href={routes.USERS} title="Users">
						Users
					</HeaderLink>
					<Show
						when={
							(globalConfig.session?.type === 'user' ||
								globalConfig.session?.type === 'admin') &&
							props.siteConfig.tradingIsEnabled &&
							username()
						}>
						{username => (
							<HeaderLink href={routes.TRADES} title="Trades">
								<TradeNotificationCount username={username()} />
								My Trades
							</HeaderLink>
						)}
					</Show>
				</nav>
				<UserSearch />
				<UserConfig
					disableAnimations={globalConfig.disableAnimations}
					user={props.twitchData}
				/>
			</header>
		</div>
	);
}
