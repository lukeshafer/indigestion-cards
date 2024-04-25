import { For, Show, useContext } from 'solid-js';
import { OpenPacksContext } from './OpenPacksContext';
import { createAutoAnimate } from '@formkit/auto-animate/solid';
import { Statistics } from './Statistics';
import { ShowcaseCard } from './ShowcaseCard';
import { routes } from '@site/constants';

export function PackShowcase() {
	const state = useContext(OpenPacksContext);

	const [animateTitle] = createAutoAnimate((el, action) => {
		let keyframes: Keyframe[] = [];

		if (action === 'add') {
			keyframes = [
				{ transform: 'translateX(-10rem)', opacity: 0 },
				{ transform: 'translateX(0%)', opacity: 1 },
			];
		}
		if (action === 'remove') {
			keyframes = [
				{ transform: 'translateX(0%)', opacity: 1 },
				{ transform: 'translateX(10rem)', opacity: 0 },
			];
		}
		return new KeyframeEffect(el, keyframes, { duration: 500, easing: 'ease-in-out' });
	});

	const [animateCardList] = createAutoAnimate((el, action) => {
		if (!(el instanceof HTMLElement)) return new KeyframeEffect(el, [], {});

		let keyframes: Keyframe[] = [];
		let duration = 1000;
		let easing = 'ease-in-out';

		// get the center of the element's parent
		const parentCenter = {
			x: (el.parentElement?.clientWidth ?? 0) / 2,
			y: (el.parentElement?.clientHeight ?? 0) / 2,
		};

		// get the center of the element relative to its parent
		const elementCenter = {
			x: el.offsetLeft + el.clientWidth / 2,
			y: el.offsetTop + el.clientHeight / 2,
		};

		// get the distance between the two centers for the x and y axis to translate in CSS
		const distance = {
			x: parentCenter.x - elementCenter.x,
			y: parentCenter.y - elementCenter.y,
		};

		if (action === 'add') {
			// start the element off at the parent's center, then translate it to its final position
			keyframes = [
				{ transform: `translate(${distance.x}px, ${distance.y}px)`, opacity: 0 },
				{ transform: `translate(${distance.x}px, ${distance.y}px)`, opacity: 1 },
				{ transform: 'translate(0px, 0px)' },
			];
			easing = 'cubic-bezier(0.33, 1, 0.68, 1)';
		}

		if (action === 'remove') {
			// card should scatter and rotate in a random direction
			const randomRotation = Math.random() * 360;
			const randomX = Math.random() * 1000 - 500;
			const randomY = Math.random() * 1000 - 500;
			keyframes = [
				{ transform: 'translate(0px, 0px)' },
				{
					transform: `translate(${randomX}px, ${randomY}px) rotate(${randomRotation}deg)`,
					opacity: 0,
				},
			];
			easing = 'cubic-bezier(0.33, 1, 0.68, 1)';
			duration = 700;
		}
		return new KeyframeEffect(el, keyframes, { duration, easing });
	});

	const sortedCardDetails = () =>
		state.activePack?.cardDetails.slice().sort((a, b) => b.totalOfType - a.totalOfType);
	const allCardsOpened = () => state.activePack?.cardDetails.every((card) => card.opened);

	return (
		<div class="bg-brand-100 relative flex h-full flex-1 flex-col dark:bg-gray-900">
			<div class="flex items-end justify-between pr-8">
				<h2
					class="font-heading m-6 mb-0 mt-3 text-2xl font-bold uppercase text-gray-700 dark:text-gray-300"
					ref={animateTitle}>
					{state.activePack ? 'Opening pack for ' : 'Select a pack to start'}
					<Show when={state.activePack?.packId} keyed>
						<a
							href={`${routes.USERS}/${state.activePack?.username}`}
							class="font-display text-brand-main block pb-3 pt-1 text-5xl normal-case italic hover:underline"
							style={{ 'view-transition-name': 'open-packs-title' }}>
							{state.activePack?.username}
						</a>
					</Show>
				</h2>
				<Show when={allCardsOpened() && state.packsRemaining}>
					<button
						class="bg-brand-main font-display mb-4 ml-auto block p-4 pb-2 text-3xl italic text-white"
						onClick={() => state.setNextPack()}>
						Next
					</button>
				</Show>
			</div>
			<ul
				style={{ gap: `${state.cardScale}rem` }}
				classList={{ blur: !!state.previewedCardId }}
				class="flex w-full flex-wrap items-center justify-center transition-[filter]"
				ref={animateCardList}>
				<For each={sortedCardDetails()}>
					{(card) => <ShowcaseCard card={card} packId={state.activePack!.packId} />}
				</For>
			</ul>
			<Statistics />
		</div>
	);
}
