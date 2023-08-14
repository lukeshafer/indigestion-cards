import type { PackEntity } from '@lil-indigestion-cards/core/pack';
import { For, Show, createEffect, createRenderEffect, createSignal } from 'solid-js';
import { api, routes } from '@/constants';
import Card from '@/components/cards/Card';
import { createStore, produce } from 'solid-js/store';
import { setTotalPackCount } from '@/lib/client/state';
import { createAutoAnimate } from '@formkit/auto-animate/solid';
import { Checkbox } from '../form/Form';
import TiltCardEffect from '../cards/TiltCardEffect';
import CardPreview from '../cards/CardPreview';

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
		previewedCard: undefined as Parameters<typeof Card>[0] | undefined,
		isPreviewing: false,
	});

	createEffect(() => {
		if (state.activePack?.cardDetails.every((card) => card.opened)) removePack();
	});

	const setActivePack = (pack: PackEntity) => {
		setState('activePack', { ...pack });
		if (pack.packId === state.packs[0].packId) return;

		setState(
			'packs',
			produce((draft) => {
				const index = draft.findIndex((p) => p.packId === pack.packId);
				draft.splice(index, 1);
				draft.unshift(pack);
			})
		);
	};

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

		if (state.activePack?.cardDetails.every((card) => card.opened && card.totalOfType >= 50))
			setTimeout(
				() =>
					// @ts-expect-error
					setState('activePack', 'cardDetails', index, 'stamps', [
						'shit-pack',
						'new-stamp',
					]),
				500
			);
	};

	return (
		<>
			<CardPreview
				card={state.previewedCard}
				isOpen={state.isPreviewing}
				setIsOpen={(val) => setState('isPreviewing', val)}
			/>
			<div class="flex items-end">
				<MarginAdjuster startMargin={props.startMargin} />
				<CardScaleAdjuster
					scale={state.cardScale}
					setScale={(newScale: number) => setState('cardScale', newScale)}
				/>
			</div>
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
					<h2 class="font-heading mb-2 text-2xl font-bold uppercase text-gray-700">
						Coming up...
					</h2>
					<ul class="packs flex h-[50vh] w-full flex-col pb-2" ref={setAutoAnimate}>
						<For each={state.packs}>
							{(pack, index) => (
								<PackToOpenItem
									index={index()}
									pack={pack}
									activePackId={state.activePack?.packId || ''}
									setAsActive={() => setActivePack(pack)}
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
					previewCard={(card) => {
						setState('previewedCard', card);
						setState('isPreviewing', true);
					}}
				/>
			</div>
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
			class="font-heading w-full bg-transparent text-center text-3xl font-bold opacity-0 transition-opacity hover:cursor-ns-resize hover:opacity-75"
			onMouseDown={handleMouseDown}
			style={{ 'margin-top': `${margin()}px` }}>
			=
		</button>
	);
}

function CardScaleAdjuster(props: { scale: number; setScale: (scale: number) => void }) {
	createEffect(() => {
		document.cookie = `openPacksScale=${props.scale}; path=/`;
	});

	return (
		<div class="flex w-full items-center justify-center gap-x-2 opacity-0 transition-opacity hover:opacity-100">
			<label class="font-heading font-bold text-gray-700">Card Scale</label>
			<input
				type="range"
				min="0.25"
				max="2"
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
				class="font-display -mx-2 w-full p-1 pt-2 text-left text-lg italic text-gray-600 hover:bg-gray-300 hover:text-gray-800"
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
	previewCard: (card: PackEntity['cardDetails'][number]) => void;
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

	return (
		<div class="bg-brand-100 flex h-full flex-col">
			<div class="flex items-end justify-between pr-8">
				<h2
					class="font-heading m-6 mb-0 text-3xl font-bold uppercase text-gray-700"
					ref={animateTitle}>
					{props.pack ? 'Opening pack for ' : 'Select a pack to start'}
					<Show when={props.pack?.packId} keyed>
						<a
							href={`${routes.USERS}/${props.pack?.username}`}
							class="font-display text-brand-main block py-4 text-5xl normal-case italic hover:underline"
							style={{ 'view-transition-name': 'open-packs-title' }}>
							{props.pack?.username}
						</a>
					</Show>
				</h2>
				<Show when={allCardsOpened() && props.packsRemaining}>
					<button
						class="bg-brand-main font-display mb-4 ml-auto block p-4 pb-2 text-3xl italic text-white"
						onClick={props.setNextPack}>
						Next
					</button>
				</Show>
			</div>
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
							previewCard={() => props.previewCard(card)}
						/>
					)}
				</For>
			</ul>
		</div>
	);
}

function ShowcaseCard(props: {
	card: PackEntity['cardDetails'][number];
	packId: PackEntity['packId'];
	setFlipped: () => void;
	isTesting: boolean;
	scale: number;
	previewCard: () => void;
}) {
	const [flipped, setFlipped] = createSignal(props.card.opened);

	const flipCard = async () => {
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

	const previewCard = () => {
		if (!flipped()) return;
		props.previewCard();
	};

	return (
		<li>
			<p class="error-text"></p>
			<div
				classList={{ flipped: flipped() }}
				style={{ width: props.scale * 18 + 'rem' }}
				class="perspective preserve-3d card-aspect-ratio relative block w-72 origin-center transition-transform duration-500">
				<button
					onClick={flipCard}
					class="backface-hidden absolute inset-0 h-full w-full cursor-pointer"
					title="Click to reveal">
					<div style={{ scale: props.scale }} class="origin-top-left">
						<TiltCardEffect>
							<img src="/card-back.png" class="w-72" />
						</TiltCardEffect>
					</div>
				</button>
				<div class="backface-hidden flipped absolute inset-0 h-full w-full">
					<button
						style={{ scale: props.scale }}
						class="origin-top-left"
						onClick={previewCard}>
						<Card {...props.card} />
					</button>
				</div>
			</div>
		</li>
	);
}
