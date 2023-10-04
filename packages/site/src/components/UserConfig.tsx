import { createEffect, createSignal, onMount, onCleanup, Show } from 'solid-js';
import { BsPersonFill } from 'solid-icons/bs';
import type { TwitchUser } from '@lil-indigestion-cards/core/twitch-helpers';

function clickOutside(el: Element, accessor: () => any) {
	const onClick = (e: MouseEvent) => {
		if (!el.contains(e.target as Element)) {
			e.stopPropagation();
			accessor()?.();
		}
	};
	document.body.addEventListener('click', onClick);

	onCleanup(() => document.body.removeEventListener('click', onClick));
}

export default function UserConfig(props: {
	disableAnimations?: boolean;
	user?: TwitchUser | undefined;
	login: string;
}) {
	const [isOpen, setIsOpen] = createSignal(false);
	const [disableAnimations, setDisableAnimations] = createSignal(
		props.disableAnimations ?? false
	);
	onMount(() => {
		setDisableAnimations(localStorage.getItem('disableAnimations') === 'true');
	});

	createEffect(() => {
		document?.body.classList.toggle('disable-animations', disableAnimations());
		localStorage.setItem('disableAnimations', disableAnimations().toString());
		document.cookie = `disable-animations=${disableAnimations()}; path=/; max-age=31536000`;

		if (disableAnimations()) {
			document.body.dataset['astro-reload'] = 'true';
		}
	});

	return (
		<div class="relative z-10">
			<UserConfigButton
				user={props.user}
				onClick={() => setIsOpen((v) => !v)}
				open={isOpen()}
			/>
			<Show when={isOpen()}>
				<menu
					class="bg-brand-100 dark:bg-brand-dark absolute right-0 mt-4 flex w-max flex-col items-end gap-3 rounded-md px-4 py-2 text-gray-800 dark:text-gray-100 shadow-md shadow-black/20"
					use:clickOutside={() => setIsOpen(false)}>
					{props.user ? (
						<a
							class="font-display pt-2 text-center font-bold italic text-gray-900 dark:text-gray-50 hover:underline"
							href={`/user/${props.user.login.toLowerCase()}`}>
							{props.user.display_name}
						</a>
					) : (
						<a
							class="font-display pt-2 text-center font-bold underline"
							href="/login"
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
								setDisableAnimations((v) => !v);
							}}>
							Disable Animations
						</button>
						{props.user ? (
							<a
								class="flex gap-4 font-medium hover:underline"
								onClick={() => {
									// change page manually to avoid using cached data from prefetch
									window.location.href = `/api/auth/logout`;
								}}
								data-astro-reload
								href="/api/auth/logout">
								Logout
							</a>
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
			onClick={(e) => props.onClick?.()}>
			{props.user ? (
				<img
					width="40"
					src={props.user.profile_image_url}
					class="col-start-1 row-span-full rounded-full"
				/>
			) : (
				<BsPersonFill size="25" class="w-8 fill-gray-700 text-gray-700 " />
			)}
		</button>
	);
}
