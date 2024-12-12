import {
	For,
	createEffect,
	createResource,
	onMount,
	type JSX,
	onCleanup,
	type Resource,
	untrack,
} from 'solid-js';
import { createStore, produce, type SetStoreFunction } from 'solid-js/store';
import { createAutoAnimate } from '@formkit/auto-animate/solid';

import { API, resolveLocalPath } from '@site/constants';
import { setTotalPackCount } from '@site/lib/client/state';
import { Checkbox } from '../form/Form';
import { isChatters, type Chatter } from '@site/lib/client/chatters';
import {
	OpenPacksContext,
	type OpenPacksState,
	type PackEntityWithStatus,
} from './OpenPacksContext';
import { ListHeightAdjuster } from './ListHeightAdjuster';
import { CardScaleAdjuster } from './CardScaleAdjuster';
import { PackShowcase } from './PackShowcase';
import { PackToOpenItem } from './PackToOpenItem';
import { checkIsShitPack } from '@core/lib/shared';
import { createWSClient } from '@site/lib/ws-client';
import { trpc } from '@site/lib/client/trpc';

type Props = {
	packs: PackEntityWithStatus[];
	startMargin?: number;
	startCardScale?: number;
	canTest?: boolean;
	children?: JSX.Element;
	adminSecret: string;
};

export default function OpenPacks(props: Props) {
	const [setAutoAnimate] = createAutoAnimate();

	const [chatters, { refetch: refetchChatters }] = createResource(async () => {
		try {
			const res = await fetch(resolveLocalPath(API.TWITCH_CHATTERS));
			const data = await res.json().catch(() => ({}));
			return isChatters(data) ? data : [];
		} catch {
			return [];
		}
	});

	const [state, setState] = createState(props, chatters);

	onMount(() => {
		const savedActivePack = state.packs.find(
			pack => pack.packId === window.localStorage.getItem('activePackId')
		);
		if (savedActivePack && !savedActivePack.isLocked) state.setActivePack(savedActivePack);

		const savedPackOrder = getSavedPackOrderFromStorage();
		const sortedList = mergeStoredListWithCurrentList(state.packs, savedPackOrder);

		setState('packs', sortedList);

		function refreshChattersTimeout() {
			if (chatters()?.length) {
				refetchChatters();
				setTimeout(refreshChattersTimeout, 60000);
			}
		}
		setTimeout(refreshChattersTimeout, 60000);

		setState('isHidden', false);

		const wsClient = createWSClient({
			onmessage: {
				REFRESH_PACKS: () => {
					state.refreshPacks();
				},
			},
		});
		if (wsClient) onCleanup(() => wsClient.close());
	});

	useSideEffects(state, setState);

	return (
		<OpenPacksContext.Provider value={state}>
			<div class="relative flex min-h-[80vh] flex-col">
				<div id="card-preview"></div>
				<div class="flex">
					<section
						class="scrollbar-narrow col-start-1 min-w-[15rem] max-w-[20rem] overflow-y-scroll bg-gray-200 px-4 py-3 dark:bg-gray-800"
						id="pack-list"
						style={{ height: state.listHeightString }}>
						<button
							onClick={() =>
								setState(
									'packs',
									// Sort online users' packs to the top
									produce(draft => {
										draft.sort((a, b) => {
											const aStatus = state.getIsOnline(a.username);
											const bStatus = state.getIsOnline(b.username);
											if (aStatus && !bStatus) return -1;
											if (!aStatus && bStatus) return 1;
											return 0;
										});
									})
								)
							}>
							<h2 class="font-heading mb-2 text-xl font-bold uppercase text-gray-700 hover:underline dark:text-gray-200">
								Coming up...
							</h2>
						</button>
						<ul
							classList={{
								'opacity-0': state.isHidden,
							}}
							class="packs relative flex w-full flex-col"
							ref={setAutoAnimate}>
							<For each={state.packs}>
								{(pack, index) => <PackToOpenItem index={index()} pack={pack} />}
							</For>
							<div class="font-display -mx-2 mr-2 h-[1.75em] w-fit min-w-[calc(100%+1rem)] gap-2 whitespace-nowrap px-1 pt-1 text-left italic" />
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
					<Checkbox
						name="testmode"
						label="Enable test mode (opening packs doesn't save)"
						setValue={value => setState('isTesting', value && props.canTest)}
					/>
				) : null}
			</div>
		</OpenPacksContext.Provider>
	);
}

//// SIDE EFFECTS ////
function useSideEffects(state: OpenPacksState, setState: SetStoreFunction<OpenPacksState>) {
	createEffect(() => {
		// When the active pack details update,
		// 	check if every card is opened
		// 		if so, remove the pack from the list
		if (state.activePack?.cardDetails.every(card => card.opened)) {
			untrack(() => {
				setState(
					'packs',
					produce(draft => {
						const index = draft.findIndex(p => p.packId === state.activePack?.packId);
						draft.splice(index, 1);
					})
				);
				setTotalPackCount(val => val - 1);
			});
		}
	});

	createEffect(() => {
		// When the active pack changes
		// 	save the pack id to
		// 		local storage
		window.localStorage.setItem('activePackId', state.activePack?.packId || '');
	});

	createEffect(() => {
		// When the saved pack state changes
		// 	save the new pack order
		// 		in local storage
		window.localStorage.setItem(
			'packOrder',
			JSON.stringify(state.packs.map(pack => pack.packId))
		);
	});
}

function createState(props: Props, chatters: Resource<Chatter[]>) {
	const [state, setState] = createStore<OpenPacksState>({
		isTesting: props.canTest ? false : undefined,
		isHidden: true,
		adminSecret: props.adminSecret,

		packs: props.packs,
		activePack: null as PackEntityWithStatus | null,
		get packsRemaining() {
			return this.packs.length;
		},
		setActivePack(pack) {
			setState('activePack', { ...pack });
			if (pack.packId === this.packs[0].packId) return;

			setState(
				'packs',
				produce(draft => {
					const index = draft.findIndex(p => p.packId === pack.packId);
					draft.splice(index, 1);
					draft.unshift(pack);
				})
			);
		},
		removeNewStampStamp(instanceId) {
			const index = this.activePack?.cardDetails.findIndex(
				card => card.instanceId === instanceId
			);
			if (!index) return;
			setState('activePack', 'cardDetails', index, 'stamps', stamps =>
				stamps?.filter(s => s !== 'new-stamp')
			);
		},
		setNextPack() {
			setState('activePack', { ...this.packs[0] });
		},

		cardScale: Math.max(props.startCardScale ?? 1, 0.25),
		setCardScale(scale) {
			setState('cardScale', scale);
		},

		previewedCardId: null as string | null,
		setPreviewedCardId(id) {
			setState('previewedCardId', id);
		},

		flipCard(instanceId) {
			const index = this.activePack?.cardDetails.findIndex(
				card => card.instanceId === instanceId
			);
			if (index === undefined) return;
			setState('activePack', 'cardDetails', index, 'opened', true);

			if (
				this.activePack?.cardDetails &&
				checkIsShitPack(this.activePack.cardDetails.filter(card => card.opened))
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

		getIsOnline(username) {
			return (
				chatters()?.some(
					chatter => chatter.user_name.toLowerCase() === username?.toLowerCase()
				) ?? false
			);
		},

		listHeight: props.startMargin ?? 200,
		get listHeightString() {
			return `${this.listHeight}px`;
		},
		setListHeight(height) {
			setState('listHeight', height);
		},

		movePackToIndex(fromIndex, toIndex) {
			if (fromIndex === toIndex) return;
			setState(
				'packs',
				produce(draft => {
					const draggingPack = draft.splice(fromIndex, 1)[0];
					draft.splice(toIndex, 0, draggingPack);
				})
			);
		},

		refreshPacks() {
			trpc.packs.all.query().then(packs => {
				const savedPackOrder = getSavedPackOrderFromStorage();
				const merged = mergeStoredListWithCurrentList(packs, savedPackOrder);
				setState('packs', merged);
			});
		},
	});

	return [state, setState] as const;
}

function getSavedPackOrderFromStorage() {
	const packOrder = window.localStorage.getItem('packOrder');
	let parsedOrder: string[] = [];
	try {
		parsedOrder = JSON.parse(packOrder || '[]');
	} catch {
		parsedOrder = [];
	}

	return parsedOrder;
}

function mergeStoredListWithCurrentList(
	currentPacks: Array<PackEntityWithStatus>,
	storedPacks: Array<string>
): Array<PackEntityWithStatus> {
	const remainingPacks = Array.from(currentPacks); // copy array for mutation
	const mergedPacks: Array<PackEntityWithStatus> = [];
	const lockedPacks: Array<PackEntityWithStatus> = [];
	for (const savedPackId of storedPacks) {
		const index = remainingPacks.findIndex(p => p.packId === savedPackId);
		if (index < 0) continue;

		const [pack] = remainingPacks.splice(index, 1);
		if (pack.isLocked) {
			lockedPacks.push(pack);
		} else {
			mergedPacks.push(pack);
		}
	}

	return mergedPacks.concat(remainingPacks).concat(lockedPacks);
}
