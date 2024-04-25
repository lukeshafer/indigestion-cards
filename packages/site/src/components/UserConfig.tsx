import { createEffect, createSignal, onMount, onCleanup, Show } from 'solid-js';
import type { TwitchUser } from '@core/lib/twitch';
import UserIcon from './icons/UserIcon';
import { authApi } from '@site/constants';

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

		if (disableAnimations()) {
			document.body.dataset['astro-reload'] = 'true';
		}
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
				<menu
					class="bg-brand-100 dark:bg-brand-dark absolute right-0 mt-4 flex w-max flex-col items-end gap-3 rounded-md px-4 py-2 text-gray-800 shadow-md shadow-black/20 dark:text-gray-100"
					ref={el => {
						const onClick = (e: MouseEvent) => {
							if (!(e.target instanceof Node) || !el.contains(e.target)) {
								e.stopPropagation();
								setIsOpen(false);
							}
						};
						document.body.addEventListener('click', onClick);

						onCleanup(() => document.body.removeEventListener('click', onClick));
					}}>
					{props.user ? (
						<a
							class="font-display pt-2 text-center font-bold italic text-gray-900 hover:underline dark:text-gray-50"
							href={`/user/${props.user.login.toLowerCase()}`}>
							{props.user.display_name}
						</a>
					) : (
						<a
							class="font-display pt-2 text-center font-bold underline"
							href={authApi.LOGIN}
							data-astro-reload>
							Login with Twitch
						</a>
					)}
					<ul class="flex w-max flex-col items-end gap-1">
						<button
							class="flex items-center gap-4 font-medium before:flex before:h-4 before:w-4 before:items-center before:justify-center before:border before:border-gray-600 dark:before:border-gray-200"
							classList={{
								'before:content-["✔"]': disableAnimations(),
								'before:content-[""]': !disableAnimations(),
							}}
							aria-pressed={disableAnimations()}
							onClick={() => {
								setDisableAnimations(v => !v);
							}}>
							Disable Animations
						</button>
						<button
							class="flex items-center gap-4 font-medium before:flex before:h-4 before:w-4 before:items-center before:justify-center before:border before:border-gray-600 dark:before:border-gray-200"
							classList={{
								'before:content-["✔"]': colorTheme() === 'dark',
								'before:content-[""]': colorTheme() === 'light',
							}}
							aria-pressed={colorTheme() === 'dark'}
							onClick={() => {
								setColorTheme(v => (v === 'dark' ? 'light' : 'dark'));
							}}>
							Dark Mode
						</button>
						{props.user ? (
							<form method="post" action="/api/auth/logout">
								<button class="flex gap-4 font-medium hover:underline">
									Logout
								</button>
							</form>
						) : null}
					</ul>
				</menu>
			</Show>
		</div>
	);
}

function UserConfigButton(props: { onClick?: () => void; user?: TwitchUser; open?: boolean }) {
	return (
		<button
			class="group flex h-full items-center justify-center transition-transform duration-300 hover:brightness-90"
			onClick={() => props.onClick?.()}>
			{props.user ? (
				<img
					width="40"
					src={props.user.profile_image_url}
					class="col-start-1 row-span-full rounded-full"
				/>
			) : (
				<UserIcon
					size="25"
					class="w-8 fill-gray-700 text-gray-700 dark:fill-gray-300 dark:text-gray-300"
				/>
			)}
		</button>
	);
}
