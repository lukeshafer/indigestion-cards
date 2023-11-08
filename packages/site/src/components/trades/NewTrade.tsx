import { createStore, produce } from 'solid-js/store';
import type { TradeCard } from '@lil-indigestion-cards/core/db/trades';
import {
	For,
	Suspense,
	createMemo,
	createResource,
	createSignal,
	onMount,
	type JSX,
	Show,
	createEffect,
	on,
} from 'solid-js';
import { trpc } from '@/lib/trpc';
import Card from '../cards/Card';
import { Loading, TextInput } from '../form/Form';
import type { CardInstance } from '@lil-indigestion-cards/core/db/cardInstances';
import { getCardSearcher } from '@/lib/client/search';
import { Heading } from '@/components/text';
import { users, fetchUsers } from '@/lib/client/state';

type TradeState = {
	offeredCards: TradeCard[];
	requestedCards: TradeCard[];
	receiverUsername: string | null;
};

type TradeCardUi = CardInstance & { checked: boolean };

export default function NewTrade(props: {
	userId: string;
	username: string;
	cardInstances: CardInstance[];
	initialOfferedCards?: CardInstance[];
	initialRequestedCards?: CardInstance[];
	initialReceiverUsername?: string;
	initialReceiverCards?: CardInstance[];
}) {
	const [state, setState] = createStore<TradeState>({
		offeredCards: props.initialOfferedCards ?? [],
		requestedCards: props.initialRequestedCards ?? [],
		receiverUsername: props.initialReceiverUsername ?? null,
	});

	createEffect(
		// When receiverUsername changes, reset requestedCards
		on(
			() => state.receiverUsername,
			() => {
				if (!state.receiverUsername) setState('requestedCards', []);
			}
		)
	);

	onMount(() => {
		fetchUsers();
	});

	const [receiverCards] = createResource(
		() => state.receiverUsername,
		(receiverUsername) => trpc.cards.byUserId.query({ username: receiverUsername }),
		{
			initialValue: props.initialReceiverCards ?? [],
			ssrLoadFrom: 'initial',
		}
	);

	const receiverCardsUi = () =>
		receiverCards().map((card) => ({
			...card,
			get checked() {
				return state.requestedCards.some(
					(requested) => requested.instanceId === card.instanceId
				);
			},
		})) satisfies TradeCardUi[];

	const yourCards = () =>
		props.cardInstances.map((card) => ({
			...card,
			get checked() {
				return state.offeredCards.some((offered) => offered.instanceId === card.instanceId);
			},
		})) satisfies TradeCardUi[];

	updateUrlFromState(state);

	return (
		<div class="flex flex-wrap justify-center">
			<Section heading="Offer">
				<Username>{props.username}</Username>
				<OfferWindow
					cards={state.offeredCards}
					setCards={(setter) => setState('offeredCards', setter)}
				/>
				<CardSearchList
					label="Your Cards"
					cards={yourCards()}
					setCards={(setter) => setState('offeredCards', setter)}
				/>
			</Section>
			<Section heading="Request">
				<Username>
					{state.receiverUsername === null ? (
						<TextInput
							inputOnly
							name="receiverUsername"
							label="Search for User"
							list="users"
							onChange={(e) => {
								if (
									users()?.includes(e.target.value) &&
									e.target.value !== props.username
								)
									setState('receiverUsername', e.target.value);
							}}
						/>
					) : (
						<>
							{state.receiverUsername}
							<button
								class="px-4 text-red-500"
								onClick={() => setState('receiverUsername', null)}>
								X
							</button>
						</>
					)}
				</Username>
				<OfferWindow
					cards={state.requestedCards}
					setCards={(setter) => setState('requestedCards', setter)}
				/>
				<Show when={state.receiverUsername !== null}>
					<Suspense
						fallback={
							<div class="relative">
								<Loading />
							</div>
						}>
						<CardSearchList
							label={`${state.receiverUsername}'s cards`}
							cards={receiverCardsUi() ?? []}
							setCards={(setter) => setState('requestedCards', setter)}
						/>
					</Suspense>
				</Show>
			</Section>
		</div>
	);
}

const updateUrlFromState = (state: TradeState) => {
	// RECEIVER USERNAME
	createEffect(() => {
		const url = new URL(window.location.href);
		if (state.receiverUsername === null) url.searchParams.delete('receiverUsername');
		else url.searchParams.set('receiverUsername', state.receiverUsername ?? '');
		window.history.replaceState({}, '', url.toString());
	});

	// OFFERED CARDS
	createEffect(() => {
		//console.log(state.offeredCards.map((card) => card.instanceId).join(','));
		const url = new URL(window.location.href);
		if (state.offeredCards.length === 0) url.searchParams.delete('offeredCards');
		else
			url.searchParams.set(
				'offeredCards',
				state.offeredCards.map((card) => card.instanceId).join(',')
			);
		//console.log(url.toString());
		window.history.replaceState({}, '', url.toString());
	});

	// REQUESTED CARDS
	createEffect(() => {
		//console.log(state.requestedCards.map((card) => card.instanceId).join(','));
		const url = new URL(window.location.href);
		if (state.requestedCards.length === 0) url.searchParams.delete('requestedCards');
		else
			url.searchParams.set(
				'requestedCards',
				state.requestedCards.map((card) => card.instanceId).join(',')
			);
		//console.log(url.toString());
		window.history.replaceState({}, '', url.toString());
	});
};

function Section(props: { heading: string; children: JSX.Element }) {
	return (
		<section class="w-1/2" style={{ 'min-width': 'min(35rem, 100vw)' }}>
			<Heading classList={{ 'text-center': true }}>{props.heading}</Heading>
			{props.children}
		</section>
	);
}

function Username(props: { children: JSX.Element }) {
	return (
		<div class="flex h-12 items-end justify-center ">
			<p class="flex h-12 items-end justify-center text-center text-xl font-semibold">
				{props.children}
			</p>
		</div>
	);
}

function OfferWindow(props: {
	cards: TradeCard[];
	setCards: (setter: (cards: TradeCard[]) => TradeCard[]) => void;
}) {
	return (
		<ul class="m-4 flex h-[30rem] flex-wrap items-center justify-center gap-2 overflow-y-scroll bg-gray-300 p-2 dark:bg-gray-700 scrollbar-narrow">
			<For each={props.cards}>
				{(card) => (
					<li
						class="relative"
						style={{ 'view-transition-name': 'offer-window-card-' + card.instanceId }}>
						<Card {...card} />
						<button
							title="Remove Card"
							class="absolute left-2 top-2 z-50 flex h-6 w-6 items-center justify-center rounded-full bg-white p-1 font-black text-red-600 hover:brightness-75"
							onClick={() => {
								props.setCards(
									produce((draft) => {
										let index = draft.findIndex(
											(c) => c.instanceId === card.instanceId
										);
										while (index !== -1) {
											draft.splice(index, 1);
											index = draft.findIndex(
												(c) => c.instanceId === card.instanceId
											);
										}
									})
								);
							}}>
							<span aria-hidden="true">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="100%"
									height="100%"
									viewBox="0 0 1024 1024">
									<path
										fill="currentColor"
										d="M195.2 195.2a64 64 0 0 1 90.496 0L512 421.504L738.304 195.2a64 64 0 0 1 90.496 90.496L602.496 512L828.8 738.304a64 64 0 0 1-90.496 90.496L512 602.496L285.696 828.8a64 64 0 0 1-90.496-90.496L421.504 512L195.2 285.696a64 64 0 0 1 0-90.496z"
									/>
								</svg>
							</span>
							<span class="sr-only">Remove Card</span>
						</button>
					</li>
				)}
			</For>
		</ul>
	);
}

function CardSearchList(props: {
	label: string;
	cards: TradeCardUi[];
	setCards: (setter: (cards: TradeCard[]) => TradeCard[]) => void;
}) {
	const [searchText, setSearchText] = createSignal('');

	const searcher = createMemo(() => getCardSearcher(props.cards));
	const searchResults = () => {
		if (!searchText()) return props.cards;
		return searcher()(searchText());
	};

	return (
		<details class="bg-brand-100 dark:bg-brand-950 m-4 max-h-screen overflow-y-scroll scrollbar-narrow scrollbar-brand">
			<summary class="bg-brand-100 dark:bg-brand-950 sticky top-0 z-10 h-14 p-4 text-lg">
				{props.label}
			</summary>
			<div class="bg-brand-100 dark:bg-brand-950 border-b-brand-main sticky top-14 z-10 border-b p-4 pt-0">
				<TextInput label="Search" name="search" setValue={setSearchText} />
			</div>
			<ul class="flex flex-wrap justify-center gap-4 py-4">
				<For each={searchResults()}>
					{(card) => (
						<CardCheckbox
							card={card}
							addCard={() => props.setCards(produce((draft) => draft.push(card)))}
							removeCard={() =>
								props.setCards(
									produce((draft) => {
										let index = draft.findIndex(
											(c) => c.instanceId === card.instanceId
										);
										while (index !== -1) {
											draft.splice(index, 1);
											index = draft.findIndex(
												(c) => c.instanceId === card.instanceId
											);
										}
									})
								)
							}
						/>
					)}
				</For>
			</ul>
		</details>
	);
}

function CardCheckbox(props: { card: TradeCardUi; addCard: () => void; removeCard: () => void }) {
	return (
		<li
			class="m-1 p-2"
			classList={{
				'outline outline-4 outline-brand-main bg-gray-200 opacity-90': props.card.checked,
			}}>
			<label class="relative cursor-pointer text-center">
				<input
					classList={{
						'absolute top-4 left-4 z-50': props.card.checked,
						'sr-only': !props.card.checked,
					}}
					checked={props.card.checked}
					type="checkbox"
					onInput={(e) => {
						if (e.currentTarget.checked) {
							props.addCard();
						} else {
							props.removeCard();
						}
					}}
				/>
				<MiniCard card={props.card} />
			</label>
		</li>
	);
}

function MiniCard(props: { card: TradeCard }) {
	return (
		<div class="text-center">
			<Card {...props.card} scale={0.5} />
			<p class="font-bold">{props.card.cardName}</p>
			<p>{props.card.rarityName}</p>
			<p>
				{props.card.cardNumber} / {props.card.totalOfType}
			</p>
		</div>
	);
}
