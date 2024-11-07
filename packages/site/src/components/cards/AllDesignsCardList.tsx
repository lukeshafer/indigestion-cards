import {
	CardList,
	CardListFilter,
	CardListMenu,
	CardListSearch,
	CardListSortDropdown,
	filterCards,
	parseUniqueSeasons,
	type Filters,
} from './CardList';
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
} from './Card';
import type { CardDesign } from '@core/types';

export default function AllDesignsCardList(props: {
	initialCards: CardDesign[];
	rarityRanking?: RarityRankingRecord;
	initialFilters: Filters;
}) {
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
				<CardListFilter
					params={{ seasons: seasons() }}
					setFilters={setFilters}
					ssrFilters={/*@once*/ props.initialFilters}
				/>
				<div class="ml-auto flex gap-4">
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
				</div>
			</CardListMenu>
			<CardList cards={cards()}>
				{(card, index) => <AllDesignsCardListItem card={card} lazy={index() > 5} />}
			</CardList>
		</div>
	);
}

const AllDesignsCardListItem: Component<{
	card: CardDesign;
	lazy: boolean;
}> = props => {
	const rarityId = () => props.card.bestRarityFound?.rarityId ?? '';

	const card = (
		<FullAnimatedCardEffect>
			<Card
				lazy={props.lazy}
				scale="var(--card-scale)"
				alt={props.card.cardName}
				viewTransitionName={`design-${props.card.designId}`}
				centerStamp={undefined}
				imgSrc={getCardImageUrl({
					designId: props.card.designId,
					rarityId: rarityId(),
				})}
				background={
					checkIsFullArt(rarityId())
						? FULL_ART_BACKGROUND_CSS
						: props.card.bestRarityFound?.rarityColor
				}>
				<Show when={checkIfCanShowCardText(rarityId())}>
					<CardName>{props.card.cardName}</CardName>
					<CardDescription>{props.card.cardDescription}</CardDescription>
				</Show>
			</Card>
		</FullAnimatedCardEffect>
	);

	return (
		<Show when={!checkIsSecret(rarityId())} fallback={card}>
			<a href={`${routes.INSTANCES}/${props.card.designId}`}>{card}</a>
		</Show>
	);
};
