import {
	For,
	Show,
	createEffect,
	createResource,
	createSignal,
	createContext,
	onMount,
	type JSX,
	onCleanup,
	useContext,
} from 'solid-js';
import { createStore, produce } from 'solid-js/store';
import { createAutoAnimate } from '@formkit/auto-animate/solid';

import type { Pack } from '@lil-indigestion-cards/core/db/packs';
import { API, routes, ASSETS, SHIT_PACK_RARITY_ID } from '@/constants';
import Card from '@/components/cards/Card';
import { setTotalPackCount } from '@/lib/client/state';
import { Checkbox } from '../form/Form';
import TiltCardEffect from '../cards/TiltCardEffect';
import CardPreview from '../cards/CardPreview';
import { isChatters } from '@/lib/client/chatters';

type PackEntityWithStatus = Pack & {
	cardDetails: Pack['cardDetails'] &
		{
			stamps?: string[];
		}[];
};

type OpenPacksState = {
	isTesting: boolean | undefined;
	isHidden: boolean;

	packs: PackEntityWithStatus[];
	activePack: PackEntityWithStatus | null;
	packsRemaining: number;
	setActivePack(pack: PackEntityWithStatus): void;
	removeNewStampStamp(instanceId: string): void;
	removePack(): void;
	setNextPack(): void;

	cardScale: number;
	setCardScale(scale: number): void;

	previewedCardId: string | null;
	setPreviewedCardId(id: string): void;

	flipCard(instanceId: string): void;

	draggingIndex: number | null;
	setDraggingIndex(index: number | null): void;

	hoveringIndex: number | null;
	setHoveringIndex(index: number | null): void;

	draggingY: number | null;
	getIsOnline(username?: string): boolean;
	moveOnlineToTop(): void;

	listHeight: number;
	listHeightString: string;
	setListHeight(height: number): void;
};

export const OpenPacksContext = createContext<OpenPacksState>();

export default function OpenPacks(props: {
	packs: PackEntityWithStatus[];
	startMargin?: number;
	startCardScale?: number;
	canTest?: boolean;
	children?: JSX.Element;
}) {
	const [setAutoAnimate] = createAutoAnimate();

	const [chatters, { refetch: refetchChatters }] = createResource(async () => {
		const res = await fetch(API.TWITCH_CHATTERS);
		const data = await res.json().catch(() => ({}));
		return isChatters(data) ? data : [];
	});

	const [state, setState] = createStore<OpenPacksState>({
		// eslint-disable-next-line solid/reactivity
		isTesting: props.canTest ? false : undefined,
		isHidden: true,

		// eslint-disable-next-line solid/reactivity
		packs: props.packs,
		activePack: null as PackEntityWithStatus | null,
		get packsRemaining() {
			return this.packs.length;
		},
		setActivePack(pack) {
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
		},
		removeNewStampStamp(instanceId) {
			const index = state.activePack?.cardDetails.findIndex(
				(card) => card.instanceId === instanceId
			);
			if (!index) return;
			setState(
				'activePack',
				'cardDetails',
				index,
				'stamps',
				(stamps) => stamps?.filter((s) => s !== 'new-stamp')
			);
		},
		removePack() {
			setState(
				'packs',
				produce((draft) => {
					const index = draft.findIndex((p) => p.packId === state.activePack?.packId);
					draft.splice(index, 1);
				})
			);
			setTotalPackCount((val) => val - 1);
		},
		setNextPack() {
			setState('activePack', { ...state.packs[0] } ?? null);
		},

		// eslint-disable-next-line solid/reactivity
		cardScale: Math.max(props.startCardScale ?? 1, 0.25),
		setCardScale(scale) {
			setState('cardScale', scale);
		},

		previewedCardId: null as string | null,
		setPreviewedCardId(id) {
			setState('previewedCardId', id);
		},

		flipCard(instanceId) {
			const index = state.activePack?.cardDetails.findIndex(
				(card) => card.instanceId === instanceId
			);
			if (index === undefined) return;
			setState('activePack', 'cardDetails', index, 'opened', true);

			if (
				state.activePack?.cardDetails.every(
					(card) => card.opened && card.rarityId === SHIT_PACK_RARITY_ID
				)
			)
				setTimeout(
					() =>
						setState('activePack', 'cardDetails', index, 'stamps', [
							'shit-pack',
							'new-stamp',
						]),
					500
				);
		},

		draggingIndex: null as number | null,
		setDraggingIndex(index: number | null) {
			setState('draggingIndex', index);
		},
		draggingY: null as number | null,

		hoveringIndex: null as number | null,
		setHoveringIndex(index: number | null) {
			setState('hoveringIndex', index);
		},

		getIsOnline(username) {
			return (
				chatters()?.some(
					(chatter) => chatter.user_name.toLowerCase() === username?.toLowerCase()
				) ?? false
			);
		},
		moveOnlineToTop() {
			setState(
				'packs',
				produce((draft) => {
					draft.sort((a, b) => {
						const aStatus = state.getIsOnline(a.username);
						const bStatus = state.getIsOnline(b.username);
						if (aStatus && !bStatus) return -1;
						if (!aStatus && bStatus) return 1;
						return 0;
					});
				})
			);
		},

		// eslint-disable-next-line solid/reactivity
		listHeight: props.startMargin ?? 200,
		get listHeightString() {
			return `${this.listHeight}px`;
		},
		setListHeight(height) {
			setState('listHeight', height);
		},
	});

	onMount(() => {
		const activePackId = window.localStorage.getItem('activePackId');
		const activePackFromStorage = state.packs.find((pack) => pack.packId === activePackId);
		if (activePackFromStorage) {
			state.setActivePack(activePackFromStorage);
		}

		const packOrder = window.localStorage.getItem('packOrder');
		let parsedOrder: string[] = [];
		try {
			parsedOrder = JSON.parse(packOrder || '[]');
		} catch {
			parsedOrder = [];
		}
		const storedSorted = parsedOrder.slice().sort();
		const sorted = state.packs.map((pack) => pack.packId).sort();
		if (JSON.stringify(storedSorted) === JSON.stringify(sorted)) {
			setState(
				'packs',
				parsedOrder.map((packId) => state.packs.find((p) => p.packId === packId)!)
			);
		} else {
			window.localStorage.removeItem('packOrder');
		}

		const interval = setInterval(refetchChatters, 10000);
		onCleanup(() => clearInterval(interval));

		setState('isHidden', false);
	});

	createEffect(() => {
		if (state.activePack?.cardDetails.every((card) => card.opened)) state.removePack();
	});

	createEffect(() => {
		window.localStorage.setItem('activePackId', state.activePack?.packId || '');
	});

	createEffect(() => {
		window.localStorage.setItem(
			'packOrder',
			JSON.stringify(state.packs.map((pack) => pack.packId))
		);
	});

	return (
		<OpenPacksContext.Provider value={state}>
			<div class="flex min-h-[80vh] flex-col">
				<div class="flex">
					<section
						class="scrollbar-narrow col-start-1 min-w-[15rem] max-w-[20rem] overflow-y-scroll bg-gray-200 px-4 py-3 dark:bg-gray-800"
						id="pack-list"
						style={{ height: state.listHeightString }}>
						<button onClick={() => state.moveOnlineToTop()}>
							<h2 class="font-heading mb-2 text-xl font-bold uppercase text-gray-700 hover:underline dark:text-gray-200">
								Coming up...
							</h2>
						</button>
						<ul
							classList={{
								'opacity-0': state.isHidden,
							}}
							class="packs relative flex w-full flex-col"
							ref={setAutoAnimate}
							onMouseMove={(e) => {
								if (state.draggingIndex === null) return;
								const mouseY = e.y - e.currentTarget.offsetTop;
								setState('draggingY', mouseY);
							}}
							onMouseUp={() => {
								const draggingIndex = state.draggingIndex;
								const hoveringIndex = state.hoveringIndex;

								if (draggingIndex !== null && hoveringIndex !== null) {
									const modifiedHoveringIndex =
										hoveringIndex > draggingIndex
											? hoveringIndex - 1
											: hoveringIndex;

									setState(
										'packs',
										produce((draft) => {
											// move the dragging index to the hovering index
											const draggingPack = draft.splice(draggingIndex, 1)[0];
											draft.splice(modifiedHoveringIndex, 0, draggingPack);
										})
									);
								}

								setState('draggingIndex', null);
							}}>
							<For each={state.packs}>
								{(pack, index) => <PackToOpenItem index={index()} pack={pack} />}
							</For>
							<div
								class="font-display -mx-2 mr-2 h-[1.75em] w-fit min-w-[calc(100%+1rem)] gap-2 whitespace-nowrap px-1 pt-1 text-left italic "
								classList={{
									'bg-gray-300/50':
										state.hoveringIndex === state.packs.length &&
										state.draggingIndex !== null,
								}}
								onMouseMove={() => setState('hoveringIndex', state.packs.length)}
							/>
						</ul>
					</section>
					<div class="flex-1">{props.children}</div>
				</div>
				<div class="flex h-1 items-end gap-4">
					<ListHeightAdjuster />
					<CardScaleAdjuster />
				</div>
				{state.isTesting ? <p class="text-lg">Test mode enabled</p> : null}
				<PackShowcase pack={state.activePack} />
				{props.canTest ? (
					<>
						<Checkbox
							name="testmode"
							label="Enable test mode (opening packs doesn't save)"
							setValue={(value) => setState('isTesting', value && props.canTest)}
						/>
					</>
				) : null}
			</div>
		</OpenPacksContext.Provider>
	);
}

function ListHeightAdjuster() {
	const state = useContext(OpenPacksContext);

	const handleMouseDown = (e: MouseEvent) => {
		e.preventDefault();
		let prevY = e.clientY / 1;
		const handleMouseMove = (e: MouseEvent) => {
			state?.setListHeight(Math.max(state.listHeight + (e.clientY / 1 - prevY), 0));
			prevY = e.clientY / 1;
		};
		const handleMouseUp = () => {
			window.removeEventListener('mousemove', handleMouseMove);
			window.removeEventListener('mouseup', handleMouseUp);
			// set the margin in a cookie
			document.cookie = `openPacksMargin=${state?.listHeight ?? ''}; path=/`;
		};
		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('mouseup', handleMouseUp);
	};

	return (
		<button
			class="font-heading relative z-10 h-min w-full max-w-[15rem] translate-y-1/2 bg-transparent pb-1 text-center text-2xl font-bold opacity-0 transition-opacity hover:cursor-ns-resize hover:opacity-50"
			onMouseDown={handleMouseDown}>
			=
		</button>
	);
}

function CardScaleAdjuster() {
	const state = useContext(OpenPacksContext);

	createEffect(() => {
		document.cookie = `openPacksScale=${state?.cardScale}; path=/`;
	});

	return (
		<div class="flex h-min w-full items-center justify-start gap-x-2 opacity-0 transition-opacity hover:opacity-100">
			<label class="font-heading font-bold text-gray-700">Card Scale</label>
			<input
				type="range"
				min="0.25"
				max="2"
				step="0.001"
				value={state?.cardScale}
				class="w-1/2"
				onInput={(e) =>
					state?.setCardScale(parseFloat((e.target as HTMLInputElement).value))
				}
			/>
		</div>
	);
}

function PackToOpenItem(props: { index: number; pack: PackEntityWithStatus }) {
	const state = useContext(OpenPacksContext);

	let timeout: number | NodeJS.Timeout;
	let wasDragging = false;
	const isActive = () => props.pack.packId === state?.activePack?.packId;
	const isDragging = () => state?.draggingIndex === props.index;
	const isOnline = () => state?.getIsOnline(props.pack.username);

	return (
		<li
			onMouseMove={() => {
				if (!isDragging()) {
					state?.setHoveringIndex(props.index);
				}
			}}>
			<Show when={state?.hoveringIndex === props.index && state?.draggingIndex !== null}>
				<div class="font-display -mx-2 mr-2 h-[1.75em] w-fit min-w-[calc(100%+1rem)] gap-2 whitespace-nowrap bg-gray-300/50 px-1 pt-1 text-left italic dark:bg-gray-500/50" />
			</Show>
			<button
				title={isOnline() ? 'Online' : 'Offline'}
				class="font-display -mx-2 mr-2 w-fit min-w-[calc(100%+1rem)] gap-2 whitespace-nowrap px-1 pt-1 text-left italic text-gray-600 hover:bg-gray-300 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-200"
				classList={{
					'bg-gray-300 text-gray-800 dark:bg-gray-700 dark:text-gray-200': isActive(),
					'opacity-75': !isOnline() && !isActive(),
					'absolute top-0 opacity-50': isDragging(),
				}}
				style={{
					'transform-origin': 'center left',
					transform: isDragging() ? `translateY(${state?.draggingY}px)` : '',
				}}
				onMouseDown={() => {
					timeout = setTimeout(() => {
						state?.setDraggingIndex(props.index);
						wasDragging = true;
					}, 100);
				}}
				onClick={() => {
					clearTimeout(timeout);
					if (!isDragging() && wasDragging) {
						wasDragging = false;
						return;
					}
					state?.setActivePack(props.pack);
				}}>
				<span
					class="mb-1 mr-2 inline-block h-2 w-2 rounded-full"
					classList={{
						'bg-brand-main': isOnline(),
						'': !isOnline(),
					}}></span>
				{props.pack.username}
			</button>
		</li>
	);
}

function PackShowcase(props: { pack: PackEntityWithStatus | null }) {
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
		props.pack?.cardDetails.slice().sort((a, b) => b.totalOfType - a.totalOfType);
	const allCardsOpened = () => props.pack?.cardDetails.every((card) => card.opened);

	return (
		<div class="bg-brand-100 relative flex h-full flex-1 flex-col dark:bg-gray-900">
			<div class="flex items-end justify-between pr-8">
				<h2
					class="font-heading m-6 mb-0 mt-3 text-2xl font-bold uppercase text-gray-700 dark:text-gray-300"
					ref={animateTitle}>
					{props.pack ? 'Opening pack for ' : 'Select a pack to start'}
					<Show when={props.pack?.packId} keyed>
						<a
							href={`${routes.USERS}/${props.pack?.username}`}
							class="font-display text-brand-main block pb-3 pt-1 text-5xl normal-case italic hover:underline"
							style={{ 'view-transition-name': 'open-packs-title' }}>
							{props.pack?.username}
						</a>
					</Show>
				</h2>
				<Show when={allCardsOpened() && state?.packsRemaining}>
					<button
						class="bg-brand-main font-display mb-4 ml-auto block p-4 pb-2 text-3xl italic text-white"
						onClick={() => state?.setNextPack()}>
						Next
					</button>
				</Show>
			</div>
			<ul
				style={{ gap: `${state?.cardScale}rem` }}
				classList={{ blur: !!state?.previewedCardId }}
				class="flex w-full flex-wrap items-center justify-center transition-[filter]"
				ref={animateCardList}>
				<For each={sortedCardDetails()}>
					{(card) => <ShowcaseCard card={card} packId={props.pack!.packId} />}
				</For>
			</ul>
			<Statistics activePack={props.pack}></Statistics>
			<div id="card-preview"></div>
		</div>
	);
}

function ShowcaseCard(props: {
	card: PackEntityWithStatus['cardDetails'][number];
	packId: PackEntityWithStatus['packId'];
}) {
	const state = useContext(OpenPacksContext);

	// eslint-disable-next-line solid/reactivity
	const [flipped, setFlipped] = createSignal(props.card.opened);
	const isPreviewed = () => state?.previewedCardId === props.card.instanceId;

	const flipCard = async () => {
		setFlipped(true);
		state?.flipCard(props.card.instanceId);

		const body = new URLSearchParams({
			instanceId: props.card.instanceId,
			designId: props.card.designId,
			packId: props.packId,
		}).toString();

		const auth_token = localStorage.getItem('auth_token');
		state?.isTesting
			? console.log('Card flipped: ', body)
			: await fetch(API.CARD, {
					method: 'PATCH',
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
						Authorization: auth_token ? `Bearer ${auth_token}` : '',
					},
					body,
			  });
	};

	const previewCard = () => {
		if (!flipped()) return;
		state?.setPreviewedCardId(props.card.instanceId);
		state?.removeNewStampStamp(props.card.instanceId);
	};

	const closePreview = () => {
		state?.setPreviewedCardId('');
	};

	return (
		<li>
			<p class="error-text" />
			<div
				classList={{ flipped: flipped() }}
				style={{ width: (state?.cardScale ?? 0) * 18 + 'rem' }}
				class="perspective preserve-3d card-aspect-ratio relative block w-72 origin-center transition-transform duration-500">
				<button
					onClick={flipCard}
					class="backface-hidden absolute inset-0 h-full w-full cursor-pointer"
					title="Click to reveal">
					<div style={{ scale: 1 }} class="origin-top-left">
						<TiltCardEffect>
							<img
								src={ASSETS.CARDS.CARD_BACK}
								class="w-72"
								style={{ width: `calc(18rem * ${state?.cardScale ?? 0})` }}
							/>
						</TiltCardEffect>
					</div>
				</button>
				<div class="backface-hidden flipped absolute inset-0 h-full w-full">
					<button class="block origin-top-left" onClick={previewCard}>
						{isPreviewed() ? (
							<CardPreview close={closePreview}>
								<Card {...props.card} scale={(state?.cardScale ?? 0) * 1.5} />
							</CardPreview>
						) : (
							<Card {...props.card} scale={state?.cardScale ?? 0} />
						)}
					</button>
				</div>
			</div>
		</li>
	);
}

function Statistics(props: { activePack: PackEntityWithStatus | null }) {
	const state = () => ({
		cardsOpened: props.activePack?.cardDetails.filter((card) => card.opened === true),
		cardsOpenedCount: props.activePack?.cardDetails.filter((card) => card.opened).length || 0,
		totalCardCount: props.activePack?.cardDetails.length,
		packTypeId: props.activePack?.packTypeId,
		packId: props.activePack?.packId,
	});

	const [isShitpackVisible, setIsShitpackVisible] = createSignal(false);

	onMount(() => {
		setIsShitpackVisible(localStorage.getItem('isShitpackVisible') === 'true');
	});

	createEffect(() => {
		localStorage.setItem('isShitpackVisible', isShitpackVisible() ? 'true' : 'false');
	});

	const [resource] = createResource(state, async (state) => {
		if (!state.totalCardCount || !state.packId) {
			return { shitPackOdds: 0 };
		}

		if (state.cardsOpened?.some((card) => card.rarityId.toLowerCase() !== SHIT_PACK_RARITY_ID))
			// can't be a shit pack if any opened cards are not bronze
			return { shitPackOdds: 0 };

		if (state.cardsOpenedCount === state.totalCardCount)
			// returning a timeout to make sure the card is flipped before we see this number (for suspense)
			return new Promise<{ shitPackOdds: number }>((res) =>
				setTimeout(() => res({ shitPackOdds: 1 }), 500)
			);

		const searchParams = new URLSearchParams({
			remainingCardCount: (state.totalCardCount - state.cardsOpenedCount).toString(),
			packTypeId: state.packTypeId || '0',
		});

		const body = await fetch(API.STATS + `?${searchParams.toString()}`).then((res) => {
			return res.text();
		});

		const json = JSON.parse(body);

		return {
			shitPackOdds: Number(json.shitPackOdds) || 0,
		};
	});

	const shitPackOdds = () => resource()?.shitPackOdds || 0;
	const formattedShitPack = () => `${Math.floor(shitPackOdds() * 10000) / 100}%`;
	const hasOneMoreCard = (chance: number) =>
		chance > 0 && chance < 1 && (state().totalCardCount || 0) - 1 === state().cardsOpenedCount;

	return (
		<Show when={state().totalCardCount}>
			<div class="group m-6 flex h-10 items-center gap-2">
				<p
					class="text-xl transition-opacity"
					classList={{
						'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100':
							!isShitpackVisible(),
					}}>
					Shit pack:{' '}
					{resource.loading ? (
						<span class="text-gray-500">Calculating...</span>
					) : (
						<div class="inline-flex items-center gap-2">
							{formattedShitPack()}{' '}
							{hasOneMoreCard(shitPackOdds()) ? (
								<img src={ASSETS.EMOTES.LILINDPB} width="30" />
							) : shitPackOdds() === 1 ? (
								<img src={ASSETS.EMOTES.LILINDBLIF} width="30" />
							) : shitPackOdds() === 0 ? (
								<img src={ASSETS.EMOTES.LILINDDISBLIF} width="30" />
							) : null}
						</div>
					)}
				</p>
				<div class="cursor-pointer opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
					<Checkbox
						value={isShitpackVisible()}
						setValue={setIsShitpackVisible}
						label=""
						name="shit-pack-chances"
					/>
				</div>
			</div>
		</Show>
	);
}
