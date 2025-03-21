import {
	default as CardList,
	filterCards,
	parseUniqueSeasons,
	type Filters,
} from '@site/components/CardList';
import { sortCardsByName } from '@site/client/card-sort';
import { getCardSearcher } from '@site/client/search';
import { createMemo, createSignal, Show, type Component } from 'solid-js';
import type { RarityRankingRecord } from '@core/lib/site-config';
import { routes } from '@site/constants';
import { CardEls, cardUtils, FULL_ART_BACKGROUND_CSS } from '@site/components/Card';
import type { CardDesign } from '@core/types';

export const AllDesignsCardList: Component<{
	initialCards: CardDesign[];
	rarityRanking?: RarityRankingRecord;
	initialFilters: Filters;
}> = props => {
	const [sortOrder, setSortOrder] = createSignal<'asc' | 'desc'>('asc');
	const [filters, setFilters] = createSignal(props.initialFilters);
	const [searchText, setSearchText] = createSignal('');

	const seasons = () => parseUniqueSeasons(props.initialCards);
	const filteredCards = () => filterCards(props.initialCards, filters());

	const sortedCards = createMemo(() =>
		filteredCards().slice().sort(sortCardsByName(sortOrder()))
	);

	const searcher = createMemo(() => getCardSearcher(sortedCards()));

	const cards = () => (searchText() ? searcher()(searchText()) : sortedCards());

	return (
		<div>
			<CardList.Menu>
				<CardList.Search setSearchText={setSearchText} />
				<CardList.SortDropdown
					sortTypes={['card-name-asc', 'card-name-desc']}
					setSort={sortType => {
						if (sortType === 'card-name-desc') {
							setSortOrder('desc');
						} else {
							setSortOrder('asc');
						}
					}}
				/>
				<CardList.Filter
					params={{ seasons: seasons() }}
					setFilters={setFilters}
					ssrFilters={/*@once*/ props.initialFilters}
				/>
			</CardList.Menu>
			<CardList.List cards={cards()}>
				{(card, index) => <AllDesignsCardListItem card={card} lazy={index() > 5} />}
			</CardList.List>
		</div>
	);
};

const AllDesignsCardListItem: Component<{
	card: CardDesign;
	lazy: boolean;
}> = props => {
	const rarityId = () => props.card.bestRarityFound?.rarityId ?? '';
	const background = () =>
		cardUtils.checkIsFullArt(rarityId())
			? FULL_ART_BACKGROUND_CSS
			: props.card.bestRarityFound?.rarityColor;

	const card = (
		<CardEls.FullAnimatedCardEffect
			glowColor={cardUtils.checkIsFullArt(rarityId()) ? undefined : background()}
			disableTiltOnTouch>
			<CardEls.Card
				lazy={props.lazy}
				scale="var(--card-scale)"
				alt={props.card.cardName}
				viewTransitionName={`design-${props.card.designId}`}
				imgSrc={cardUtils.getCardImageUrl({
					designId: props.card.designId,
					rarityId: rarityId(),
				})}
				background={background()}>
				<Show when={cardUtils.checkIfCanShowCardText(rarityId())}>
					<CardEls.CardName>{props.card.cardName}</CardEls.CardName>
					<CardEls.CardDescription>{props.card.cardDescription}</CardEls.CardDescription>
				</Show>
			</CardEls.Card>
		</CardEls.FullAnimatedCardEffect>
	);

	return (
		<Show when={!cardUtils.checkIsSecret(rarityId())} fallback={card}>
			<CardEls.CardLinkWrapper href={`${routes.INSTANCES}/${props.card.designId}`}>
				{card}
			</CardEls.CardLinkWrapper>
		</Show>
	);
};
