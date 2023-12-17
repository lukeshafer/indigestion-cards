import type { TradeCardUi } from './NewTrade';
import { createMemo, createSignal, For } from 'solid-js';
import type { TradeCard } from '@lil-indigestion-cards/core/db/trades';
import { getCardSearcher } from '@/lib/client/search';
import { TextInput } from '../form/Form';
import { produce } from 'solid-js/store';
import CardCheckbox from './CardCheckbox';

export default function CardSearchList(props: {
	label: string;
	cards: TradeCardUi[];
	setCards: (setter: (cards: TradeCard[]) => TradeCard[]) => void;
	type: 'offer' | 'request';
}) {
	const [searchText, setSearchText] = createSignal('');

	const searcher = createMemo(() => getCardSearcher(props.cards));
	const searchResults = () => {
		if (!searchText()) return props.cards;
		return searcher()(searchText());
	};

	return (
		<details class="bg-brand-100 dark:bg-brand-950 scrollbar-narrow scrollbar-brand m-4 max-h-screen overflow-y-scroll">
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
							type={props.type}
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
