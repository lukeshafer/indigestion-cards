import type { TwitchUser } from '@core/lib/twitch';
import { authApi, LOGOS, publicApi, routes } from '@site/constants';
import { trpc } from '@site/lib/client/trpc';
import { createWSClient } from '@site/lib/ws-client';
import {
	createEffect,
	createMemo,
	createResource,
	createSignal,
	For,
	onCleanup,
	onMount,
	Show,
	Suspense,
	type Component,
	type ParentComponent,
} from 'solid-js';
import { Form, TextInput } from './Form';
import ButtonCount from './ButtonCount';
import SearchIcon from './icons/SearchIcon';
import CloseIcon from './icons/CloseIcon';
import UserIcon from './icons/UserIcon';
import TradeIcon from './icons/TradeIcon';
import SparkleIcon from './icons/SparkleIcon';
import MoonIcon from './icons/MoonIcon';
import LogoutIcon from './icons/LogoutIcon';

export const Header: Component<{
	logo?: keyof typeof LOGOS;
	disableAnimations: boolean;
	loggedInUsername?: string;
	twitchData?: TwitchUser;
	isAdmin?: boolean;
	currentPage: string;
}> = props => {
	return (
		<header class="border-b border-b-gray-300 bg-white dark:border-b-gray-800 dark:bg-gray-950">
			<div class="max-w-main relative mx-auto flex items-center gap-4 px-4 py-2 text-white md:py-4">
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
						<HeaderLink
							href={routes.OPEN_PACKS}
							title="Open Packs"
							currentPage={props.currentPage}>
							Open Packs
							<HeaderPackCount />
						</HeaderLink>
					</Show>
					<HeaderLink href={routes.CARDS} title="Cards" currentPage={props.currentPage}>
						Cards
					</HeaderLink>
					<HeaderLink href={routes.USERS} title="Users" currentPage={props.currentPage}>
						Users
					</HeaderLink>
					<Show when={props.loggedInUsername}>
						<HeaderLink
							href={routes.TRADES}
							title="Trades"
							currentPage={props.currentPage}>
							<TradeNotificationCount username={props.loggedInUsername!} />
							My Trades
						</HeaderLink>
					</Show>
				</nav>
				<UserSearch />
				<UserConfig disableAnimations={props.disableAnimations} user={props.twitchData} />
			</div>
		</header>
	);
};

const HeaderLink: ParentComponent<{
	href: string;
	title: string;
	currentPage: string;
}> = props => {
	const url = createMemo(() => new URL(props.href, 'https://example.com/'));

	return (
		<a
			href={url().pathname + url().search}
			title={props.title}
			style={{ 'view-transition-name': `page-header-nav-${props.href}` }}
			class="relative rounded px-2 py-1 transition-colors"
			classList={{
				'text-brand-main bg-brand-100 dark:bg-brand-dark dark:hover:bg-brand-900 dark:hover:text-brand-main hover:bg-brand-200 hover:text-brand-dark font-bold dark:text-white':
					props.currentPage.startsWith(props.href),
				'text-gray-700 hover:bg-gray-200 hover:text-black dark:font-medium dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-white':
					!props.currentPage.startsWith(props.href),
			}}>
			{props.children ?? props.title}
		</a>
	);
};

const HeaderPackCount: Component = () => {
	const [packCount, { refetch: refreshPackCount }] = createResource(
		() => trpc.packs.packCount.query(),
		{ ssrLoadFrom: 'initial', initialValue: 0 }
	);

	onMount(() => {
		queueMicrotask(refreshPackCount);

		const wsClient = createWSClient({
			onmessage: {
				REFRESH_PACKS: () => {
					console.log('Refreshing pack count...');
					refreshPackCount();
				},
			},
		});
		if (wsClient) onCleanup(() => wsClient.close());
	});

	return (
		<Suspense>
			<ButtonCount>{packCount.latest}</ButtonCount>
		</Suspense>
	);
};

const TradeNotificationCount: Component<{ username: string }> = props => {
	const [count, { refetch }] = createResource(
		() => props.username,
		async username => {
			const user = await trpc.users.byUsername.query({ username });
			return (
				user?.tradeNotifications?.reduce(
					(acc, notif) => acc.add(notif.tradeId),
					new Set<string>()
				).size || 0
			);
		},
		{ ssrLoadFrom: 'initial', initialValue: 0 }
	);

	onMount(() => {
		queueMicrotask(refetch);
	});

	return (
		<Suspense>
			<Show when={count()}>
				{count => <ButtonCount>{count() < 100 ? String(count()) : '99+'}</ButtonCount>}
			</Show>
		</Suspense>
	);
};

const UserSearch: Component = () => {
	const [isVisible, setIsVisible] = createSignal(false);
	return (
		<div
			class="relative w-fit max-w-40 md:w-auto md:max-w-full"
			style={{
				'view-transition-name': 'user-search-bar',
			}}>
			<button
				title="Search"
				name="open-search"
				onClick={() => setIsVisible(v => !v)}
				class="bottom-0 left-1 top-0 z-10 fill-gray-900 sm:hidden dark:fill-gray-50"
				style={{
					position: isVisible() ? 'absolute' : 'static',
				}}>
				{isVisible() ? <CloseIcon size="1.4rem" /> : <SearchIcon size="1.4rem" />}
			</button>
			<div
				style={{ '--display': isVisible() ? 'block' : 'none' }}
				class="[display:--display] sm:block">
				<UserDataList />
				<Form action={publicApi.SEARCH} method="get">
					<TextInput
						class="pl-8 sm:pl-1"
						list="usernames"
						name="username"
						label="Search Users"
						inputOnly
						autocomplete="off"
					/>
					<button
						type="submit"
						class="absolute right-0 top-0 h-full bg-white fill-gray-800 px-1 text-gray-500 dark:bg-black dark:fill-gray-300">
						<span class="sr-only">Search</span>
						<SearchIcon size="1.4rem" />
					</button>
				</Form>
			</div>
		</div>
	);
};

const UserDataList: Component = () => {
	const [usernames, setUsernames] = createSignal<Array<string>>([]);

	onMount(() => {
		trpc.users.allUsernames.query().then(setUsernames);
	});

	return (
		<datalist id="usernames">
			<For each={usernames()}>{username => <option value={username} />}</For>
		</datalist>
	);
};

const UserConfig: Component<{
	disableAnimations?: boolean;
	user?: TwitchUser | undefined;
}> = props => {
	const [isOpen, setIsOpen] = createSignal(false);
	const [disableAnimations, setDisableAnimations] = createSignal(
		// eslint-disable-next-line solid/reactivity
		props.disableAnimations ?? false
	);
	const [colorTheme, setColorTheme] = createSignal<'light' | 'dark'>('light');

	onMount(() => {
		setDisableAnimations(localStorage.getItem('disableAnimations') === 'true');

		let theme = localStorage.getItem('theme');
		if (theme === 'dark' || theme === 'light') {
			setColorTheme(theme);
		} else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
			setColorTheme('dark');
		} else {
			setColorTheme('light');
		}
	});

	createEffect(() => {
		document?.body.classList.toggle('disable-animations', disableAnimations());
		localStorage.setItem('disableAnimations', disableAnimations().toString());

		const expires = new Date(new Date().setFullYear(new Date().getFullYear() + 1));
		document.cookie = `disable-animations=${disableAnimations()}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
	});

	createEffect(() => {
		document.documentElement.classList.toggle('dark', colorTheme() === 'dark');
		localStorage.setItem('theme', colorTheme());

		const expires = new Date(new Date().setFullYear(new Date().getFullYear() + 1));
		document.cookie = `theme=${colorTheme()}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;

		const colors = {
			light: '#ffffff',
			dark: '#030712',
		};

		document
			.querySelector('meta[name="theme-color"]')
			?.setAttribute('content', colors[colorTheme()]);
	});

	return (
		<div class="relative z-10">
			<UserConfigButton
				user={props.user}
				onClick={() => setIsOpen(v => !v)}
				open={isOpen()}
			/>
			<Show when={isOpen()}>
				<UserConfigMenu close={() => setIsOpen(false)}>
					<Show when={props.user} fallback={<LoginLink />}>
						{user => <UserNameLink user={user()} />}
					</Show>
					<ul class="flex w-max flex-col items-start gap-2">
						<Show when={props.user}>
							{user => (
								<>
									<UserConfigItemLink
										title="Your Profile"
										href={`${routes.USERS}/${user().login.toLowerCase()}`}>
										<UserConfigItemLayoutWrapper>
											<UserIcon size="24" />
											<span>Your Profile</span>
										</UserConfigItemLayoutWrapper>
									</UserConfigItemLink>

									<UserConfigItemLink
										title="Your Trades"
										href={`${routes.TRADES}`}>
										<UserConfigItemLayoutWrapper>
											<TradeIcon size="24" />
											<span>Your Trades</span>
										</UserConfigItemLayoutWrapper>
									</UserConfigItemLink>
								</>
							)}
						</Show>
						<UserConfigCheckbox
							checked={disableAnimations()}
							onClick={() => setDisableAnimations(v => !v)}>
							<UserConfigItemLayoutWrapper>
								<SparkleIcon size="24" />
								Disable Animations
							</UserConfigItemLayoutWrapper>
						</UserConfigCheckbox>
						<UserConfigCheckbox
							checked={colorTheme() === 'dark'}
							onClick={() => setColorTheme(v => (v === 'dark' ? 'light' : 'dark'))}>
							<UserConfigItemLayoutWrapper>
								<MoonIcon size="20" />
								Dark Mode
							</UserConfigItemLayoutWrapper>
						</UserConfigCheckbox>
						<Show when={props.user}>
							<LogoutButton />
						</Show>
					</ul>
				</UserConfigMenu>
			</Show>
		</div>
	);
};

const UserConfigButton: Component<{
	onClick?: () => void;
	user?: TwitchUser;
	open?: boolean;
}> = props => {
	return (
		<button
			class="group flex h-full items-center justify-center transition-transform duration-300 hover:brightness-90"
			onClick={() => props.onClick?.()}>
			<Show
				when={props.user}
				fallback={
					<UserIcon
						size="25"
						class="w-8 fill-gray-700 text-gray-700 dark:fill-gray-300 dark:text-gray-300"
					/>
				}>
				{user => (
					<img
						width="40"
						src={user().profile_image_url}
						class="col-start-1 row-span-full rounded-full"
					/>
				)}
			</Show>
		</button>
	);
};

const UserConfigMenu: ParentComponent<{ close: () => void }> = props => {
	return (
		<menu
			class="absolute right-0 mt-4 flex w-max flex-col items-start gap-3 rounded bg-gray-100 px-4 py-2 text-gray-800 shadow-lg shadow-black/25 dark:bg-gray-900 dark:text-gray-100"
			ref={el => {
				const handleClick = (e: MouseEvent) => {
					if (!(e.target instanceof Node) || !el.contains(e.target)) {
						e.stopPropagation();
						props.close();
					}
				};
				document.body.addEventListener('click', handleClick);

				onCleanup(() => document.body.removeEventListener('click', handleClick));
			}}>
			{props.children}
		</menu>
	);
};

const UserNameLink: Component<{
	user: TwitchUser;
}> = props => (
	<a
		class="font-display flex w-full items-center gap-3 py-1 text-center font-bold italic text-gray-900 hover:underline dark:text-gray-50"
		href={`${routes.USERS}/${props.user.login.toLowerCase()}`}>
		<img
			height="32"
			width="32"
			src={props.user.profile_image_url}
			class="col-start-1 row-span-full rounded-full"
		/>
		<span class="pt-1">{props.user.display_name}</span>
	</a>
);

const LoginLink: Component = () => (
	<a
		class="font-display pt-2 text-center font-bold underline"
		href={authApi.LOGIN}
		data-astro-reload>
		Login with Twitch
	</a>
);

const LogoutButton: Component = () => (
	<form
		method="post"
		action="/api/auth/logout"
		class="mt-2 grid w-full grid-cols-[24px_auto] items-center gap-x-3 border-t border-gray-500/25 pt-2">
		<LogoutIcon size="24" />
		<UserConfigItemButton>Logout</UserConfigItemButton>
	</form>
);

const UserConfigItemButton: ParentComponent = props => (
	<button class="flex gap-4 font-medium hover:underline">{props.children}</button>
);
const UserConfigItemLink: ParentComponent<{ href: string; title?: string }> = props => (
	<li class="w-full">
		<a class="flex gap-4 font-medium hover:underline" {...props}>
			{props.children}
		</a>
	</li>
);

const UserConfigCheckbox: ParentComponent<{
	checked: boolean;
	onClick: () => void;
}> = props => (
	<li>
		<button
			class="flex items-center gap-4 font-medium after:flex after:h-4 after:w-4 after:items-center after:justify-center after:border after:border-gray-600 hover:underline dark:after:border-gray-200"
			classList={{
				'after:content-["✔"]': props.checked,
				'after:content-[""]': !props.checked,
			}}
			aria-pressed={props.checked}
			onClick={() => {
				props.onClick();
			}}>
			{props.children}
		</button>
	</li>
);

const UserConfigItemLayoutWrapper: ParentComponent = props => (
	<div class="grid grid-cols-[24px_auto] items-center gap-x-3">{props.children}</div>
);
