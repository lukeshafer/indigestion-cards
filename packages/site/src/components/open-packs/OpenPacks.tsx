import type { PackEntity } from '@lil-indigestion-cards/core/pack';
import { For, Show, createEffect, createSignal } from 'solid-js';
import { api } from '@/constants';
import Card from '@/components/cards/Card';
import { createStore, produce } from 'solid-js/store';
import { setTotalPackCount } from '@/lib/client/state';

export default function OpenPacks(props: { packs: PackEntity[] }) {
	const [state, setState] = createStore({
		packs: props.packs,
		activePack: null as PackEntity | null,
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

	const setNextPack = () => setState('activePack', { ...state.packs[0] } ?? null);

	const flipCard = (instanceId: string) => {
		const index = state.activePack?.cardDetails.findIndex(
			(card) => card.instanceId === instanceId
		);
		if (index === undefined) return;
		setState('activePack', 'cardDetails', index, 'opened', true);
	};

	return (
		<div class="mt-52 grid grid-cols-[auto_1fr] grid-rows-[80vh] gap-x-8">
			<section class="col-start-1 h-full overflow-y-scroll bg-gray-200 p-6" id="pack-list">
				<h2 class="font-heading mb-8 text-4xl font-bold uppercase text-gray-700">
					Coming up...
				</h2>
				<ul class="packs flex w-full flex-col gap-2 pb-2">
					<For each={state.packs}>
						{(pack) => (
							<PackToOpenItem
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
			/>
		</div>
	);
}

function PackToOpenItem(props: {
	pack: PackEntity;
	activePackId: string;
	setAsActive: () => void;
}) {
	const isActive = () => props.pack.packId === props.activePackId;

	createEffect(() => {
		console.log(props.pack.packId, props.activePackId, isActive());
	});

	return (
		<li>
			<button
				class="font-display shover:bg-gray-300 shover:text-gray-800 -mx-2 w-full p-2 text-left text-2xl italic text-gray-600"
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
}) {
	const sortedCardDetails = () => props.pack?.cardDetails.slice().sort((a, b) => b.totalOfType - a.totalOfType);
	const allCardsOpened = () => props.pack?.cardDetails.every((card) => card.opened);

	return (
		<div class="bg-brand-100 flex h-full flex-col p-6">
			{props.pack ? (
				<>
					<h2 class="font-heading mb-8 text-4xl font-bold uppercase text-gray-700">
						Opening pack for{' '}
						<span class="font-display text-brand-main block py-4 text-6xl normal-case italic">
							{props.pack.username}
						</span>
					</h2>
					<ul class="flex flex-wrap items-center justify-center gap-4">
						<For each={sortedCardDetails()}>
							{(card) => (
								<ShowcaseCard
									card={card}
									setFlipped={() => props.flipCard(card.instanceId)}
								/>
							)}
						</For>
					</ul>
					<Show when={allCardsOpened()}>
						<button
							class="bg-brand-main font-display ml-auto mt-8 block p-8 text-7xl italic text-white"
							onClick={props.setNextPack}>
							Next
						</button>
					</Show>
				</>
			) : (
				<h2 class="font-heading mb-8 text-4xl font-bold uppercase text-gray-700">
					Select a pack to start
				</h2>
			)}
		</div>
	);
}

function ShowcaseCard(props: { card: PackEntity['cardDetails'][number]; setFlipped: () => void }) {
	const [flipped, setFlipped] = createSignal(props.card.opened);

	const handleClick = async () => {
		setFlipped(true);
		props.setFlipped();

		const body = new URLSearchParams({
			instanceId: props.card.instanceId,
			designId: props.card.designId,
		}).toString();

		const res = await fetch(api.CARD, {
			method: 'PATCH',
			body,
		});
	};

	return (
		<li>
			<p class="error-text"></p>
			<div
				classList={{ flipped: flipped() }}
				class="perspective preserve-3d card-aspect-ratio relative block w-60 origin-center transition-transform duration-500">
				<button
					onClick={handleClick}
					class="backface-hidden absolute inset-0 h-full w-full cursor-pointer"
					title="Click to reveal">
					<img src="/card-back.png" class="w-full" />
				</button>
				<div class="backface-hidden flipped absolute inset-0 h-full w-full">
					<div style={{ scale: '0.8333' }} class="origin-top-left">
						<Card {...props.card} />
					</div>
				</div>
			</div>
		</li>
	);
}
