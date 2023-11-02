import { For, createEffect, createResource, onMount, type JSX, onCleanup, type Resource } from 'solid-js';
import { createStore, produce } from 'solid-js/store';
import { createAutoAnimate } from '@formkit/auto-animate/solid';

import { API, SHIT_PACK_RARITY_ID } from '@/constants';
import { setTotalPackCount } from '@/lib/client/state';
import { Checkbox } from '../form/Form';
import { isChatters, type Chatter } from '@/lib/client/chatters';
import {
	OpenPacksContext,
	type OpenPacksState,
	type PackEntityWithStatus,
} from './OpenPacksContext';
import { ListHeightAdjuster } from './ListHeightAdjuster';
import { CardScaleAdjuster } from './CardScaleAdjuster';
import { PackShowcase } from './PackShowcase';
import { PackToOpenItem } from './PackToOpenItem';

type Props = {
	packs: PackEntityWithStatus[];
	startMargin?: number;
	startCardScale?: number;
	canTest?: boolean;
	children?: JSX.Element;
}

export default function OpenPacks(props: Props) {
	const [setAutoAnimate] = createAutoAnimate();

	const [chatters, { refetch: refetchChatters }] = createResource(async () => {
		const res = await fetch(API.TWITCH_CHATTERS);
		const data = await res.json().catch(() => ({}));
		return isChatters(data) ? data : [];
	});

	const [state, setState] = (createState(props, chatters));

	onMount(() => {
		const savedActivePack =
			state.packs.find((pack) => pack.packId === window.localStorage.getItem('activePackId'));
		if (savedActivePack) state.setActivePack(savedActivePack);

		const savedPackOrder = getSavedPackOrderFromStorage();
		const listHasChanged = checkIfListHasChangedFromStorage(state.packs, savedPackOrder)

		if (listHasChanged) window.localStorage.removeItem('packOrder');
		else
			setState(
				'packs',
				savedPackOrder.map((packId) => state.packs.find((p) => p.packId === packId)!)
			)

		const interval = setInterval(refetchChatters, 10000);
		onCleanup(() => clearInterval(interval));

		setState('isHidden', false);
	});

	//// SIDE EFFECTS ////
	createEffect(() => {
		// When the active pack details update, 
		// 	check if every card is opened
		// 		if so, remove the pack from the list
		if (state.activePack?.cardDetails.every((card) => card.opened)) {
			setState(
				'packs',
				produce((draft) => {
					const index = draft.findIndex((p) => p.packId === state.activePack?.packId);
					draft.splice(index, 1);
				})
			);
			setTotalPackCount((val) => val - 1);
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
						<button onClick={() => setState(
							'packs',
							// Sort online users' packs to the top
							produce((draft) => {
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
							ref={setAutoAnimate} >
							<For each={state.packs}>
								{(pack, index) => <PackToOpenItem index={index()} pack={pack} />}
							</For>
							<div
								class="font-display -mx-2 mr-2 h-[1.75em] w-fit min-w-[calc(100%+1rem)] gap-2 whitespace-nowrap px-1 pt-1 text-left italic "
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
					<Checkbox
						name="testmode"
						label="Enable test mode (opening packs doesn't save)"
						setValue={(value) => setState('isTesting', value && props.canTest)}
					/>
				) : null}
			</div>
		</OpenPacksContext.Provider >
	);
}

function createState(props: Props, chatters: Resource<Chatter[]>) {
	const [state, setState] = createStore<OpenPacksState>({
		isTesting: props.canTest ? false : undefined,
		isHidden: true,

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
				produce((draft) => {
					const index = draft.findIndex((p) => p.packId === pack.packId);
					draft.splice(index, 1);
					draft.unshift(pack);
				})
			);
		},
		removeNewStampStamp(instanceId) {
			const index = this.activePack?.cardDetails.findIndex(
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
		setNextPack() {
			setState('activePack', { ...this.packs[0] } ?? null);
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
				(card) => card.instanceId === instanceId
			);
			if (index === undefined) return;
			setState('activePack', 'cardDetails', index, 'opened', true);

			if (
				this.activePack?.cardDetails.every(
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

		getIsOnline(username) {
			return (
				chatters()?.some(
					(chatter) => chatter.user_name.toLowerCase() === username?.toLowerCase()
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
			if (fromIndex === toIndex) return
			setState(
				'packs',
				produce((draft) => {
					const draggingPack = draft.splice(fromIndex, 1)[0];
					draft.splice(toIndex, 0, draggingPack);
				})
			);
		}
	})

	return [state, setState] as const
}

function getSavedPackOrderFromStorage() {
	const packOrder = window.localStorage.getItem('packOrder');
	let parsedOrder: string[] = [];
	try {
		parsedOrder = JSON.parse(packOrder || '[]');
	} catch {
		parsedOrder = [];
	}

	return parsedOrder
}

function checkIfListHasChangedFromStorage(currentPacks: PackEntityWithStatus[], storedPacks: string[]) {
	const storedSorted = storedPacks.slice().sort();
	const sorted = currentPacks.map((pack) => pack.packId).sort();

	const hasChanged = JSON.stringify(storedSorted) !== JSON.stringify(sorted);
	return hasChanged
}
