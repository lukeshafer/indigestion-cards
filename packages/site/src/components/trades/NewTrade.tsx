import { createStore, produce } from 'solid-js/store';
import type { TradeCard } from '@lil-indigestion-cards/core/db/trades';
import { For, createMemo, createResource } from 'solid-js';
import { trpc } from '@/lib/trpc';
import Card from '../cards/Card';
import { TextInput } from '../form/Form';
import type { CardInstance } from '@lil-indigestion-cards/core/db/cardInstances';
import { getCardSearcher } from '@/lib/client/search';
import { Heading } from '@/components/text';

type TradeState = {
	offeredCards: TradeCard[];
	requestedCards: TradeCard[];
	search: string;
};

type TradeCardUi = CardInstance & { checked: boolean };

export default function NewTrade(props: {
	userId: string;
	username: string;
	cardInstances?: CardInstance[];
}) {
	const [state, setState] = createStore<TradeState>({
		offeredCards: [],
		requestedCards: [],
		search: '',
	});

	const [__cards] = createResource(
		() => {
			return trpc.cards.byUserId.query({ username: props.username });
		},
		// eslint-disable-next-line solid/reactivity
		{ initialValue: props.cardInstances ?? [] }
	);

	const cards = () =>
		__cards().map((card) => ({
			...card,
			get checked() {
				return state.offeredCards.some((offered) => offered.instanceId === card.instanceId);
			},
		})) satisfies TradeCardUi[];

	const searcher = createMemo(() => getCardSearcher(cards()));
	const searchResults = () => {
		if (!state.search) return cards();
		return searcher()(state.search);
	};

	return (
		<section>
			<Heading>Your offer</Heading>
			<ul>
				<For each={state.offeredCards}>
					{(card) => (
						<li>
							{card.cardName}, {card.rarityName}, {card.cardNumber}
						</li>
					)}
				</For>
			</ul>
			Your Cards:
			<TextInput
				label="Search"
				name="search"
				setValue={(value) => {
					setState('search', value);
				}}
			/>
			<CardList
				cards={searchResults()}
				addCard={(card) => {
					setState(
						'offeredCards',
						produce((draft) => draft.push(card))
					);
				}}
				removeCard={(card) => {
					setState(
						'offeredCards',
						produce((draft) => {
							let index = draft.findIndex((c) => c.instanceId === card.instanceId);
							while (index !== -1) {
								draft.splice(index, 1);
								index = draft.findIndex((c) => c.instanceId === card.instanceId);
							}
							//if (index !== -1) draft.splice(index, 1);
						})
					);
				}}
			/>
		</section>
	);
}

function CardList(props: {
	cards: TradeCardUi[];
	addCard: (card: TradeCardUi) => void;
	removeCard: (card: TradeCardUi) => void;
}) {
	return (
		<ul class="flex flex-wrap gap-4">
			<For each={props.cards}>
				{(card) => (
					<CardCheckbox
						card={card}
						addCard={() => props.addCard(card)}
						removeCard={() => props.removeCard(card)}
					/>
				)}
			</For>
		</ul>
	);
}

function CardCheckbox(props: { card: TradeCardUi; addCard: () => void; removeCard: () => void }) {
	return (
		<li class="m-2" classList={{ 'outline outline-4 outline-brand-main': props.card.checked }}>
			<label class="cursor-pointer text-center">
				<Card {...props.card} scale={0.5} />
				<input
					class="sr-only"
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
				<p class="font-bold">{props.card.cardName}</p>
				<p>{props.card.rarityName}</p>
				<p>
					{props.card.cardNumber} / {props.card.totalOfType}
				</p>
			</label>
		</li>
	);
}
