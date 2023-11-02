import { createStore, produce } from 'solid-js/store';
import type { TradeCard } from '@lil-indigestion-cards/core/db/trades';
import { For, createMemo, createResource } from 'solid-js';
import { trpc } from '@/lib/trpc';
import Card from '../cards/Card';
import { TextInput } from '../form/Form';
import type { CardInstance } from '@lil-indigestion-cards/core/db/cardInstances';
import { getCardSearcher } from '@/lib/client/search';

type TradeState = {
	offeredCards: TradeCard[];
	requestedCards: TradeCard[];
	search: string;
};

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
		{ initialValue: props.cardInstances ?? [] }
	);

	const cards = () =>
		__cards().map((card) => ({
			...card,
			get checked() {
				return state.offeredCards.some((offered) => offered.instanceId === card.instanceId);
			},
		}));

	const searcher = createMemo(() => getCardSearcher(cards()));
	const searchResults = () => {
		if (!state.search) return cards();
		return searcher()(state.search);
	};

	return (
		<div>
			Your offer:
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
			<ul>
				<For each={searchResults()}>
					{(card) => (
						<li>
							<CardCheckbox
								card={card}
								addCard={() => {
									setState(
										'offeredCards',
										produce((draft) => draft.push(card))
									);
								}}
								removeCard={() => {
									setState(
										'offeredCards',
										produce((draft) => {
											const index = draft.findIndex(
												(c) => c.instanceId === card.instanceId
											);
											if (index !== -1) draft.splice(index, 1);
										})
									);
								}}
							/>
						</li>
					)}
				</For>
			</ul>
		</div>
	);
}

function CardCheckbox(props: { card: TradeCard; addCard: () => void; removeCard: () => void }) {
	return (
		<label class="cursor-pointer">
			<Card {...props.card} scale={0.5} />
			<input
				type="checkbox"
				onInput={(e) => {
					if (e.currentTarget.checked) {
						props.addCard();
					} else {
						props.removeCard();
					}
				}}
			/>
			{props.card.cardName}, {props.card.rarityName}, {props.card.cardNumber}
		</label>
	);
}
