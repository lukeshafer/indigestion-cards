import type { TradeCardUi } from './NewTrade';
import { For, Show, type Component } from 'solid-js';
import type { CardInstance, TradeCard } from '@core/types';
import { Select, TextInput } from '../Form';
import { produce } from 'solid-js/store';
import type { RarityRankingRecord } from '@core/lib/site-config';
import { sortTypes } from '@site/client/card-sort';

import * as TradeInventory from './TradeInventoryList';
import * as Card from '../Card';
import { createCardList } from '../CardList';

export default function CardSearchList(props: {
	label: string;
	cards: TradeCardUi[];
	setCards: (setter: (cards: TradeCard[]) => TradeCard[]) => void;
	type: 'offer' | 'request';
	rarityRanking?: RarityRankingRecord;
}) {
	const [cards, state] = createCardList(() => props.cards, { default: { sortType: 'rarest' } });

	return (
		<TradeInventory.TradeInventoryDetails summary={props.label}>
			<TradeInventory.TradeInventoryStickyHeading>
				<Select
					name="sort"
					label="Sort by"
					setValue={val => state.setSortType(val)}
					options={Array.from(sortTypes)}
				/>
				<TextInput label="Search" name="search" setValue={state.setSearchText} />
			</TradeInventory.TradeInventoryStickyHeading>
			<TradeInventory.TradeInventoryList>
				<For each={cards()}>
					{card => (
						<TradeInventory.TradeInventoryItemCheckbox
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
							<CardSearchListItem card={card} />
						</TradeInventory.TradeInventoryItemCheckbox>
					)}
				</For>
			</TradeInventory.TradeInventoryList>
		</TradeInventory.TradeInventoryDetails>
	);
}

const CardSearchListItem: Component<{ card: CardInstance }> = props => {
	return (
		<div class="flex w-40 flex-col items-center text-center">
			<div class="group relative">
				<Card.GlowOnHover color={props.card.rarityColor}></Card.GlowOnHover>
				<Card.Card
					lazy={false}
					scale={0.5}
					alt={props.card.cardName}
					imgSrc={Card.getCardImageUrl(props.card)}
					viewTransitionName={undefined}
					background={
						Card.checkIsFullArt(props.card.rarityId)
							? Card.FULL_ART_BACKGROUND_CSS
							: props.card.rarityColor
					}>
					<Show when={Card.checkIfCanShowCardText(props.card.rarityId)}>
						<Card.CardName>{props.card.cardName}</Card.CardName>
						<Card.CardDescription>
							{props.card.cardDescription}
						</Card.CardDescription>
					</Show>
				</Card.Card>
				<Card.ShineMouseEffect />
			</div>
			<p class="whitespace-break-spaces font-bold">{props.card.cardName}</p>
			<p>{props.card.rarityName}</p>
			<p>
				{props.card.cardNumber} / {props.card.totalOfType}
			</p>
		</div>
	);
};
