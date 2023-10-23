import { For, createEffect, createResource, onMount, type JSX, onCleanup } from 'solid-js';
import { createStore, produce } from 'solid-js/store';
import { createAutoAnimate } from '@formkit/auto-animate/solid';

import { API, SHIT_PACK_RARITY_ID } from '@/constants';
import { setTotalPackCount } from '@/lib/client/state';
import { Checkbox } from '../form/Form';
import { isChatters } from '@/lib/client/chatters';
import {
	OpenPacksContext,
	type OpenPacksState,
	type PackEntityWithStatus,
} from './OpenPacksContext';
import { ListHeightAdjuster } from './ListHeightAdjuster';
import { CardScaleAdjuster } from './CardScaleAdjuster';
import { PackShowcase } from './PackShowcase';
import { PackToOpenItem } from './PackToOpenItem';

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
				<PackShowcase />
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
