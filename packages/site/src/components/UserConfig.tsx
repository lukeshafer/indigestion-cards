import {
	createEffect,
	createSignal,
	onMount,
	onCleanup,
	Show,
	type Component,
	type ParentComponent,
} from 'solid-js';
import type { TwitchUser } from '@core/lib/twitch';
import UserIcon from './icons/UserIcon';
import { authApi, routes } from '@site/constants';
import SparkleIcon from './icons/SparkleIcon';
import MoonIcon from './icons/MoonIcon';
import TradeIcon from './icons/TradeIcon';
import LogoutIcon from './icons/LogoutIcon';

export default function UserConfig(props: {
	disableAnimations?: boolean;
	user?: TwitchUser | undefined;
}) {
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
}

function UserConfigButton(props: { onClick?: () => void; user?: TwitchUser; open?: boolean }) {
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
}

const UserConfigMenu: ParentComponent<{ close: () => void }> = props => {
	return (
		<menu
			class="bg-gray-100 absolute right-0 mt-4 flex w-max flex-col items-start gap-3 rounded px-4 py-2 text-gray-800 shadow-lg shadow-black/25 dark:bg-gray-900 dark:text-gray-100"
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
		class="font-display flex items-center gap-3 py-1 text-center font-bold italic text-gray-900 hover:underline dark:text-gray-50 w-full"
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
