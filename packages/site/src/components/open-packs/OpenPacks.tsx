import {
	For,
	Show,
	createEffect,
	createRenderEffect,
	createResource,
	createSignal,
	onMount,
	type Accessor,
	type Setter,
	type JSX,
	createReaction,
} from 'solid-js';
import { createStore, produce } from 'solid-js/store';
import { createAutoAnimate } from '@formkit/auto-animate/solid';

import type { PackEntity } from '@lil-indigestion-cards/core/pack';
import { API, routes, ASSETS } from '@/constants';
import Card from '@/components/cards/Card';
import { setTotalPackCount } from '@/lib/client/state';
import { Checkbox } from '../form/Form';
import TiltCardEffect from '../cards/TiltCardEffect';
import CardPreview from '../cards/CardPreview';
import { isChatters } from '@/lib/client/chatters';

type PackEntityWithStatus = PackEntity & {
	cardDetails: PackEntity['cardDetails'] &
		{
			stamps?: string[];
		}[];
};

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

	const [state, setState] = createStore({
		packs: props.packs,
		activePack: null as PackEntityWithStatus | null,
		isTesting: props.canTest ? false : undefined,
		cardScale: Math.max(props.startCardScale ?? 1, 0.25),
		previewedCardId: null as string | null,
	});

	const [listHeight, setListHeight] = createSignal(props.startMargin ?? 200);

	const getOnlineStatus = (username?: string) =>
		chatters()?.some(
			(chatter) => chatter.user_name.toLowerCase() === username?.toLowerCase()
		) ?? false;

	onMount(() => setInterval(refetchChatters, 10000));

	createEffect(() => {
		if (state.activePack?.cardDetails.every((card) => card.opened)) removePack();
	});

	const moveOnlineToTop = () => {
		setState(
			'packs',
			produce((draft) => {
				draft.sort((a, b) => {
					const aStatus = getOnlineStatus(a.username);
					const bStatus = getOnlineStatus(b.username);
					if (aStatus && !bStatus) return -1;
					if (!aStatus && bStatus) return 1;
					return 0;
				});
			})
		);
	};

	const setActivePack = (pack: PackEntityWithStatus) => {
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
					setState('activePack', 'cardDetails', index, 'stamps', [
						'shit-pack',
						'new-stamp',
					]),
				500
			);
	};

	const listHeightString = () => `${listHeight()}px`;

	return (
		<div class="flex min-h-[80vh] flex-col">
			<div class="flex">
				<section
					class="col-start-1 w-[15rem] overflow-y-scroll bg-gray-200 px-4 py-3"
					id="pack-list"
					style={{ height: listHeightString() }}>
					<button onClick={() => moveOnlineToTop()}>
						<h2 class="font-heading mb-2 text-xl font-bold uppercase text-gray-700 hover:underline">
							Coming up...
						</h2>
					</button>
					<ul class="packs flex w-full flex-col pb-4" ref={setAutoAnimate}>
						<For each={state.packs}>
							{(pack, index) => (
								<PackToOpenItem
									index={index()}
									pack={pack}
									activePackId={state.activePack?.packId || ''}
									isOnline={getOnlineStatus(pack.username)}
									setAsActive={() => setActivePack(pack)}
								/>
							)}
						</For>
					</ul>
				</section>
				<div class="flex-1">{props.children}</div>
			</div>
			<div class="flex h-1 items-end gap-4">
				<ListHeightAdjuster height={listHeight} setHeight={setListHeight} />
				<CardScaleAdjuster
					scale={state.cardScale}
					setScale={(newScale: number) => setState('cardScale', newScale)}
				/>
			</div>
			{state.isTesting ? <p class="text-lg">Test mode enabled</p> : null}

			<PackShowcase
				pack={state.activePack}
				removePack={removePack}
				flipCard={flipCard}
				setNextPack={setNextPack}
				packsRemaining={packsRemaining()}
				cardScale={state.cardScale}
				isTesting={(state.isTesting && props.canTest) || false}
				previewCard={(id) => {
					const index = state.activePack?.cardDetails.findIndex(
						(card) => card.instanceId === id
					);
					const card = index ? state.activePack?.cardDetails[index!] : null;
					if (card && card.stamps?.includes('new-stamp')) {
						setState('activePack', 'cardDetails', index!, 'stamps', ['shit-pack']);
					}
					setState('previewedCardId', id);
				}}
				previewedCardId={state.previewedCardId}
			/>

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
	);
}

function ListHeightAdjuster(props: { height: Accessor<number>; setHeight: Setter<number> }) {
	const handleMouseDown = (e: MouseEvent) => {
		e.preventDefault();
		let prevY = e.clientY / 1;
		const handleMouseMove = (e: MouseEvent) => {
			props.setHeight((prev) => Math.max(prev + (e.clientY / 1 - prevY), 0));
			prevY = e.clientY / 1;
		};
		const handleMouseUp = () => {
			window.removeEventListener('mousemove', handleMouseMove);
			window.removeEventListener('mouseup', handleMouseUp);
			// set the margin in a cookie
			document.cookie = `openPacksMargin=${props.height()}; path=/`;
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

function CardScaleAdjuster(props: { scale: number; setScale: (scale: number) => void }) {
	createEffect(() => {
		document.cookie = `openPacksScale=${props.scale}; path=/`;
	});

	return (
		<div class="flex h-min w-full items-center justify-start gap-x-2 opacity-0 transition-opacity hover:opacity-100">
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
	pack: PackEntityWithStatus;
	activePackId: string;
	isOnline: boolean;
	setAsActive: () => void;
}) {
	const isActive = () => props.pack.packId === props.activePackId;

	return (
		<li class="pack-list-item">
			<button
				title={props.isOnline ? 'Online' : 'Offline'}
				class="font-display -mx-2 w-[calc(100%+1rem)] gap-2 px-1 pt-1 text-left italic text-gray-600 hover:bg-gray-300 hover:text-gray-800"
				classList={{
					'bg-gray-300 text-gray-800': isActive(),
					'opacity-75': !props.isOnline && !isActive(),
				}}
				onClick={props.setAsActive}>
				<span
					class="mb-1 mr-2 inline-block h-2 w-2 rounded-full"
					classList={{
						'bg-brand-main': props.isOnline,
						'': !props.isOnline,
					}}></span>
				{props.pack.username}
			</button>
		</li>
	);
}

function PackShowcase(props: {
	pack: PackEntityWithStatus | null;
	removePack: () => void;
	flipCard: (instanceId: string) => void;
	setNextPack: () => void;
	packsRemaining: number;
	isTesting: boolean;
	cardScale: number;
	previewCard: (cardId: string) => void;
	previewedCardId: string | null;
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
		<div class="bg-brand-100 relative flex h-full flex-1 flex-col">
			<div class="flex items-end justify-between pr-8">
				<h2
					class="font-heading m-6 mb-0 mt-3 text-2xl font-bold uppercase text-gray-700"
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
				classList={{ blur: !!props.previewedCardId }}
				class="flex w-full flex-wrap items-center justify-center transition-[filter]"
				ref={animateCardList}>
				<For each={sortedCardDetails()}>
					{(card) => (
						<ShowcaseCard
							card={card}
							packId={props.pack!.packId}
							setFlipped={() => props.flipCard(card.instanceId)}
							isTesting={props.isTesting}
							scale={props.cardScale}
							previewCard={(val) => props.previewCard(val)}
							isPreviewed={props.previewedCardId === card.instanceId}
						/>
					)}
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
	setFlipped: () => void;
	isTesting: boolean;
	scale: number;
	previewCard: (cardId: string) => void;
	isPreviewed: boolean;
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

		const auth_token = localStorage.getItem('auth_token');
		props.isTesting
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
		props.previewCard(props.card.instanceId);
	};

	const closePreview = () => {
		props.previewCard('');
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
					<div style={{ scale: 1 }} class="origin-top-left">
						<TiltCardEffect>
							<img
								src={ASSETS.CARDS.CARD_BACK}
								class="w-72"
								style={{ width: `calc(18rem * ${props.scale})` }}
							/>
						</TiltCardEffect>
					</div>
				</button>
				<div class="backface-hidden flipped absolute inset-0 h-full w-full">
					<button class="block origin-top-left" onClick={previewCard}>
						{props.isPreviewed ? (
							<CardPreview close={closePreview}>
								<Card {...props.card} scale={props.scale * 1.5} />
							</CardPreview>
						) : (
							<Card {...props.card} scale={props.scale} />
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

	const [resource, { mutate, refetch }] = createResource(state, async (state) => {
		if (!state.totalCardCount || !state.packId) {
			return { shitPackOdds: 0 };
		}

		if (state.cardsOpened?.some((card) => card.totalOfType < 50))
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
