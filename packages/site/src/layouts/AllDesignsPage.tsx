import {
	CardList,
	CardListFilter,
	CardListMenu,
	CardListSearch,
	CardListSortDropdown,
	filterCards,
	parseUniqueSeasons,
	type Filters,
} from '@site/components/CardList';
import { getCardSearcher, sortCardsByName } from '@site/lib/client/utils';
import { createMemo, createSignal, Show, type Component } from 'solid-js';
import type { RarityRankingRecord } from '@core/lib/site-config';
import { routes } from '@site/constants';
import {
	checkIsSecret,
	Card,
	FullAnimatedCardEffect,
	getCardImageUrl,
	checkIsFullArt,
	FULL_ART_BACKGROUND_CSS,
	checkIfCanShowCardText,
	CardName,
	CardDescription,
	CardLinkWrapper,
} from '@site/components/Card';
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
			<CardListMenu>
				<CardListSearch setSearchText={setSearchText} />
				<CardListSortDropdown
					sortTypes={['card-name-asc', 'card-name-desc']}
					setSort={sortType => {
						if (sortType === 'card-name-desc') {
							setSortOrder('desc');
						} else {
							setSortOrder('asc');
						}
					}}
				/>
				<CardListFilter
					params={{ seasons: seasons() }}
					setFilters={setFilters}
					ssrFilters={/*@once*/ props.initialFilters}
				/>
			</CardListMenu>
			<CardList cards={cards()}>
				{(card, index) => <AllDesignsCardListItem card={card} lazy={index() > 5} />}
			</CardList>
		</div>
	);
};

const AllDesignsCardListItem: Component<{
	card: CardDesign;
	lazy: boolean;
}> = props => {
	const rarityId = () => props.card.bestRarityFound?.rarityId ?? '';
	const background = () =>
		checkIsFullArt(rarityId())
			? FULL_ART_BACKGROUND_CSS
			: props.card.bestRarityFound?.rarityColor;

	const card = (
		<FullAnimatedCardEffect glowColor={background()}>
			<Card
				lazy={props.lazy}
				scale="var(--card-scale)"
				alt={props.card.cardName}
				viewTransitionName={`design-${props.card.designId}`}
				imgSrc={getCardImageUrl({
					designId: props.card.designId,
					rarityId: rarityId(),
				})}
				background={background()}>
				<Show when={checkIfCanShowCardText(rarityId())}>
					<CardName>{props.card.cardName}</CardName>
					<CardDescription>{props.card.cardDescription}</CardDescription>
				</Show>
			</Card>
		</FullAnimatedCardEffect>
	);

	return (
		<Show when={!checkIsSecret(rarityId())} fallback={card}>
			<CardLinkWrapper href={`${routes.INSTANCES}/${props.card.designId}`}>
				{card}
			</CardLinkWrapper>
		</Show>
	);
};
