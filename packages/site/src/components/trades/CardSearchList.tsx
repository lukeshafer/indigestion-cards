import type { TradeCardUi } from './NewTrade';
import { createMemo, createSignal, For } from 'solid-js';
import type { TradeCard } from '@core/types';
import { Select, TextInput } from '../form/Form';
import { produce } from 'solid-js/store';
import type { RarityRankingRecord } from '@core/lib/site-config';
import { sortCards, sortTypes, type SortType, getCardSearcher } from '@site/lib/client/utils';
import {
	TradeInventoryDetails,
	TradeInventoryItemCheckbox,
	TradeInventoryList,
	TradeInventoryStickyHeading,
} from './TradeInventoryList';
import Card from '../cards/Card';

export default function CardSearchList(props: {
	label: string;
	cards: TradeCardUi[];
	setCards: (setter: (cards: TradeCard[]) => TradeCard[]) => void;
	type: 'offer' | 'request';
	rarityRanking?: RarityRankingRecord;
}) {
	const [searchText, setSearchText] = createSignal('');
	const [sort, setSort] = createSignal('rarest' satisfies SortType);

	const sortedCards = () =>
		sortCards({ cards: props.cards, sort: sort(), rarityRanking: props.rarityRanking });

	const searcher = createMemo(() => getCardSearcher(sortedCards()));
	const searchResults = () => {
		if (!searchText()) return sortedCards();
		return searcher()(searchText());
	};

	return (
		<TradeInventoryDetails summary={props.label}>
			<TradeInventoryStickyHeading>
				<Select
					name="sort"
					label="Sort by"
					setValue={val => setSort(val)}
					options={Array.from(sortTypes)}
				/>
				<TextInput label="Search" name="search" setValue={setSearchText} />
			</TradeInventoryStickyHeading>
			<TradeInventoryList>
				<For each={searchResults()}>
					{card => (
						<TradeInventoryItemCheckbox
							checked={card.checked}
							value={card.instanceId}
							name={`${props.type}edCards`}
							onSelect={() => props.setCards(produce(draft => draft.push(card)))}
							onDeselect={() =>
								props.setCards(
									produce(draft => {
										let index = draft.findIndex(
											c => c.instanceId === card.instanceId
										);
										while (index !== -1) {
											draft.splice(index, 1);
											index = draft.findIndex(
												c => c.instanceId === card.instanceId
											);
										}
									})
								)
							}>
							<div class="flex w-40 flex-col items-center text-center">
								<Card {...card} scale={0.5} />
								<p class="whitespace-break-spaces font-bold">{card.cardName}</p>
								<p>{card.rarityName}</p>
								<p>
									{card.cardNumber} / {card.totalOfType}
								</p>
							</div>
						</TradeInventoryItemCheckbox>
					)}
				</For>
			</TradeInventoryList>
		</TradeInventoryDetails>
	);
}
