import { createEffect, createSignal, onMount, onCleanup, Show } from 'solid-js';
import { FaSolidGear } from 'solid-icons/fa';

function clickOutside(el: Element, accessor: () => any) {
	const onClick = (e: MouseEvent) => !el.contains(e.target as Element) && accessor()?.();
	document.body.addEventListener('click', onClick);

	onCleanup(() => document.body.removeEventListener('click', onClick));
}

export default function UserConfig() {
	const [isOpen, setIsOpen] = createSignal(false);
	const [disableAnimations, setDisableAnimations] = createSignal(false);
	onMount(() => {
		setDisableAnimations(localStorage.getItem('disableAnimations') === 'true');
	});

	createEffect(() => {
		document?.body.classList.toggle('disable-animations', disableAnimations());
		localStorage.setItem('disableAnimations', disableAnimations.toString());
	});

	return (
		<div class="relative z-10">
			<button
				class="group flex h-full items-center justify-center"
				onclick={() => setIsOpen((v) => !v)}>
				<FaSolidGear size="25" class="w-8 text-gray-700 fill-gray-700 transition-transform duration-300 group-hover:rotate-[30deg] group-hover:scale-110" />
			</button>

			<Show when={isOpen()}>
				<menu
					class="bg-brand-main absolute right-0 mt-4 w-max"
					use:clickOutside={() => setIsOpen(false)}>
					<h2 class="font-heading py-2 text-center text-xl font-bold uppercase">
						Preferences
					</h2>
					<button
						class="post-button flex gap-4 after:flex after:h-6 after:w-6 after:items-center after:justify-center after:border after:border-white"
						classList={{
							'after:content-["✔"]': disableAnimations(),
							'after:content-[""]': !disableAnimations(),
						}}
						aria-pressed={disableAnimations()}
						onClick={() => setDisableAnimations((v) => !v)}>
						Disable Animations
					</button>
				</menu>
			</Show>
		</div>
	);
}
