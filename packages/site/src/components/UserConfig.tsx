import { createStore } from 'solid-js/store';
import { type JSX, Show, createEffect, createSignal, onMount } from 'solid-js';

export const [userConfig, setUserConfig] = createStore({
	disableAnimations: false,
});

export default function UserConfig(props: { children?: JSX.Element }) {
	const [isOpen, setIsOpen] = createSignal(false);

	onMount(() => {
		const disableAnimationsStorage =
			window.localStorage.getItem('disableAnimations') === 'true';
		setUserConfig('disableAnimations', disableAnimationsStorage);
		createEffect(() => {
			window.localStorage.setItem('disableAnimations', String(userConfig.disableAnimations));
		});
	});

	return (
		<div class="relative z-10">
			<button
				class="flex h-full items-center justify-center group"
				onclick={() => setIsOpen((open) => !open)}>
				{props.children || 'Open'}
			</button>
			<Show when={isOpen()}>
				<menu class="absolute w-max bg-brand-main mt-4 right-0">
					<h2 class="text-xl font-bold font-heading uppercase text-center py-2">
						Preferences
					</h2>
					<ConfigItem name="disableAnimations" value={userConfig.disableAnimations}>
						Disable Animations
					</ConfigItem>
				</menu>
			</Show>
		</div>
	);
}

function ConfigItem(props: { name: keyof typeof userConfig; value: boolean; children: string }) {
	onMount(() => {
		const storedValue = window.localStorage.getItem(props.name) === 'true';
		setUserConfig(props.name, storedValue);
		createEffect(() => {
			window.localStorage.setItem(props.name, String(userConfig[props.name]));
		});
	});

	return (
		<button
			class="post-button after:w-6 after:h-6  flex gap-4 after:border-white after:border after:flex after:items-center after:justify-center"
			classList={{
				'after:content-["✔"]': userConfig[props.name],
				'after:content-[""]': !userConfig[props.name],
			}}
			aria-pressed={userConfig[props.name]}
			onclick={() => setUserConfig(props.name, (value) => !value)}>
			{props.children}
		</button>
	);
}
