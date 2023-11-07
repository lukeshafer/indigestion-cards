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
	offerSearch: string;
	receiverUsername: string | null;
};

type TradeCardUi = CardInstance & { checked: boolean };

export default function NewTrade(props: {
	userId: string;
	username: string;
	cardInstances: CardInstance[];
}) {
	const [state, setState] = createStore<TradeState>({
		offeredCards: [],
		requestedCards: [],
		offerSearch: '',
		receiverUsername: null,
	});

	onMount(() => {
		fetchUsers();
	});

	const [receiverCards] = createResource(
		() => state.receiverUsername,
		(receiverUsername) =>
			trpc.cards.byUserId.query({ username: receiverUsername }).then(
				(cards) =>
					cards.map((card) => ({
						...card,
						get checked() {
							return state.requestedCards.some(
								(requested) => requested.instanceId === card.instanceId
							);
						},
					})) satisfies TradeCardUi[]
			)
	);

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
				<OfferWindow cards={state.offeredCards} />
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
				<OfferWindow cards={state.requestedCards} />
				<Show when={state.receiverUsername !== null}>
					<Suspense
						fallback={
							<div class="relative">
								<Loading />
							</div>
						}>
						<CardSearchList
							label={`${state.receiverUsername}'s cards`}
							cards={receiverCards() ?? []}
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
};

function Section(props: { heading: string; children: JSX.Element }) {
	return (
		<section class="w-1/2 min-w-[35rem]">
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

function OfferWindow(props: { cards: TradeCard[] }) {
	return (
		<ul class="m-4 flex min-h-[20rem] flex-wrap items-center justify-center gap-2 bg-gray-300 p-2 dark:bg-gray-700">
			<For each={props.cards}>
				{(card) => (
					<li style={{ 'view-transition-name': 'offer-window-card-' + card.instanceId }}>
						<MiniCard card={card} />
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
		<details class="bg-brand-100 dark:bg-brand-950 m-4 p-4">
			<summary class="text-lg">{props.label}</summary>
			<TextInput label="Search" name="search" setValue={setSearchText} />
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
