import type { PackEntity } from '@lil-indigestion-cards/core/pack';
import { For, Show, createEffect, createRenderEffect, createSignal } from 'solid-js';
import { api } from '@/constants';
import Card from '@/components/cards/Card';
import { createStore, produce } from 'solid-js/store';
import { setTotalPackCount } from '@/lib/client/state';
import { createAutoAnimate } from '@formkit/auto-animate/solid';
import { Checkbox } from '../form/Form';

export default function OpenPacks(props: {
	packs: PackEntity[];
	startMargin?: number;
	startCardScale?: number;
	canTest?: boolean;
}) {
	const [setAutoAnimate] = createAutoAnimate();

	const [state, setState] = createStore({
		packs: props.packs,
		activePack: null as PackEntity | null,
		isTesting: props.canTest ? false : undefined,
		cardScale: Math.max(props.startCardScale ?? 1, 0.25),
	});

	createEffect(() => {
		if (state.activePack?.cardDetails.every((card) => card.opened)) removePack();
	});

	const removePack = () => {
		setState(
			'packs',
			produce((draft) => {
				const index = draft.findIndex((p) => p.packId === state.activePack?.packId);
				draft.splice(index, 1);
			})
		);
		setTotalPackCount((val) => val - 1);
	};

	const packsRemaining = () => state.packs.length;

	const setNextPack = () => setState('activePack', { ...state.packs[0] } ?? null);

	const flipCard = (instanceId: string) => {
		const index = state.activePack?.cardDetails.findIndex(
			(card) => card.instanceId === instanceId
		);
		if (index === undefined) return;
		setState('activePack', 'cardDetails', index, 'opened', true);
	};

	return (
		<>
			<MarginAdjuster startMargin={props.startMargin} />
			{props.canTest ? (
				<>
					<Checkbox
						name="testmode"
						label="Enable test mode (opening packs doesn't save)"
						setValue={(value) => setState('isTesting', value && props.canTest)}
					/>
					{state.isTesting ? <p class="text-lg">Test mode enabled</p> : null}
				</>
			) : null}
			<div class="grid grid-cols-[auto_1fr] grid-rows-[minmax(80vh,auto)] ">
				<section
					class="col-start-1 h-full overflow-y-scroll bg-gray-200 p-6"
					id="pack-list">
					<h2 class="font-heading mb-8 text-4xl font-bold uppercase text-gray-700">
						Coming up...
					</h2>
					<ul class="packs flex w-full flex-col gap-2 pb-2" ref={setAutoAnimate}>
						<For each={state.packs}>
							{(pack, index) => (
								<PackToOpenItem
									index={index()}
									pack={pack}
									activePackId={state.activePack?.packId || ''}
									setAsActive={() => setState('activePack', { ...pack })}
								/>
							)}
						</For>
					</ul>
				</section>
				<PackShowcase
					pack={state.activePack}
					removePack={removePack}
					flipCard={flipCard}
					setNextPack={setNextPack}
					packsRemaining={packsRemaining()}
					cardScale={state.cardScale}
					isTesting={(state.isTesting && props.canTest) || false}
				/>
			</div>
			<CardScaleAdjuster
				scale={state.cardScale}
				setScale={(newScale: number) => setState('cardScale', newScale)}
			/>
		</>
	);
}

function MarginAdjuster(props: { startMargin?: number }) {
	const [margin, setMargin] = createSignal(props.startMargin ?? 200);

	const handleMouseDown = (e: MouseEvent) => {
		e.preventDefault();
		let prevY = e.clientY / 1;
		const handleMouseMove = (e: MouseEvent) => {
			setMargin((prev) => prev + (e.clientY / 1 - prevY));
			prevY = e.clientY / 1;
		};
		const handleMouseUp = () => {
			window.removeEventListener('mousemove', handleMouseMove);
			window.removeEventListener('mouseup', handleMouseUp);
			// set the margin in a cookie
			document.cookie = `openPacksMargin=${margin()}; path=/`;
		};
		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('mouseup', handleMouseUp);
	};

	return (
		<button
			class="font-heading w-full bg-transparent text-center text-3xl font-bold opacity-0 transition-opacity hover:opacity-75"
			onMouseDown={handleMouseDown}
			style={{ 'margin-top': `${margin()}px` }}>
			=
		</button>
	);
}

function CardScaleAdjuster(props: { scale: number; setScale: (scale: number) => void }) {
	createEffect(() => {
		console.log("scale", props.scale)
		document.cookie = `openPacksScale=${props.scale}; path=/`;
	})

	return (
		<div class="flex items-center gap-x-2 justify-center opacity-0 hover:opacity-100 transition-opacity">
			<label class="font-heading font-bold text-gray-700">Card Scale</label>
			<input
				type="range"
				min="0.25"
				max="4"
				step="0.001"
				value={props.scale}
				class="w-1/2"
				onInput={(e) => props.setScale(parseFloat((e.target as HTMLInputElement).value))}
			/>
		</div>
	);
}

function PackToOpenItem(props: {
	index: number;
	pack: PackEntity;
	activePackId: string;
	setAsActive: () => void;
}) {
	const isActive = () => props.pack.packId === props.activePackId;

	return (
		<li class="pack-list-item">
			<button
				class="font-display -mx-2 w-full p-2 text-left text-2xl italic text-gray-600 hover:bg-gray-300 hover:text-gray-800"
				classList={{
					'bg-gray-300 text-gray-800': isActive(),
				}}
				onClick={props.setAsActive}>
				{props.pack.username}
			</button>
		</li>
	);
}

function PackShowcase(props: {
	pack: PackEntity | null;
	removePack: () => void;
	flipCard: (instanceId: string) => void;
	setNextPack: () => void;
	packsRemaining: number;
	isTesting: boolean;
	cardScale: number;
}) {
	const [animateTitle] = createAutoAnimate((el, action, oldCoords, newCoords) => {
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
		props.pack?.cardDetails.slice().sort((a, b) => b.totalOfType - a.totalOfType);
	const allCardsOpened = () => props.pack?.cardDetails.every((card) => card.opened);

	const [username, setUsername] = createSignal(props.pack?.username);
	createEffect(() => {
		setUsername(props.pack?.username);
	});

	return (
		<div class="bg-brand-100 flex h-full flex-col">
			<h2
				class="font-heading m-6 mb-8 text-4xl font-bold uppercase text-gray-700"
				ref={animateTitle}>
				{props.pack ? 'Opening pack for ' : 'Select a pack to start'}
				<Show when={props.pack?.packId} keyed>
					<span
						class="font-display text-brand-main block py-4 text-6xl normal-case italic"
						style={{ 'view-transition-name': 'open-packs-title' }}>
						{props.pack?.username}
					</span>
				</Show>
			</h2>
			<ul
				style={{ gap: `${props.cardScale}rem` }}
				class="flex w-full flex-wrap items-center justify-center"
				ref={animateCardList}>
				<For each={sortedCardDetails()}>
					{(card) => (
						<ShowcaseCard
							card={card}
							packId={props.pack!.packId}
							setFlipped={() => props.flipCard(card.instanceId)}
							isTesting={props.isTesting}
							scale={props.cardScale}
						/>
					)}
				</For>
			</ul>
			<Show when={allCardsOpened() && props.packsRemaining}>
				<button
					class="bg-brand-main font-display ml-auto mt-8 block p-8 text-7xl italic text-white"
					onClick={props.setNextPack}>
					Next
				</button>
			</Show>
		</div>
	);
}

function ShowcaseCard(props: {
	card: PackEntity['cardDetails'][number];
	packId: PackEntity['packId'];
	setFlipped: () => void;
	isTesting: boolean;
	scale: number;
}) {
	const [flipped, setFlipped] = createSignal(props.card.opened);

	const handleClick = async () => {
		setFlipped(true);
		props.setFlipped();

		const body = new URLSearchParams({
			instanceId: props.card.instanceId,
			designId: props.card.designId,
			packId: props.packId,
		}).toString();

		props.isTesting
			? console.log('Card flipped: ', body)
			: await fetch(api.CARD, {
				method: 'PATCH',
				body,
			});
	};

	return (
		<li>
			<p class="error-text"></p>
			<div
				classList={{ flipped: flipped() }}
				style={{ width: props.scale * 18 + 'rem' }}
				class="perspective preserve-3d card-aspect-ratio relative block w-72 origin-center transition-transform duration-500">
				<button
					onClick={handleClick}
					class="backface-hidden absolute inset-0 h-full w-full cursor-pointer"
					title="Click to reveal">
					<img src="/card-back.png" class="w-full" />
				</button>
				<div class="backface-hidden flipped absolute inset-0 h-full w-full">
					<div style={{ scale: props.scale }} class="origin-top-left">
						<Card {...props.card} />
					</div>
				</div>
			</div>
		</li>
	);
}
