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
import { getCardSearcher, sortCardsByName, type CardType } from '@site/lib/client/utils';
import { createMemo, createSignal } from 'solid-js';
import type { RarityRankingRecord } from '@core/lib/site-config';
import { NO_CARDS_OPENED_ID, routes } from '@site/constants';
import Card from './Card';

export default function AllDesignsCardList(props: {
	initialCards: CardType[];
	rarityRanking?: RarityRankingRecord;
	ssrFilters: Filters;
}) {
	const [sortOrder, setSortOrder] = createSignal<'asc' | 'desc'>('asc');
	const [filters, setFilters] = createSignal(props.ssrFilters);
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
					ssrFilters={/*@once*/ props.ssrFilters}
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
				{(card, index) =>
					card.bestRarityFound?.rarityId === NO_CARDS_OPENED_ID ? (
						<Card {...card} lazy={index() > 5} scale="var(--card-scale)" />
					) : (
						<a href={`${routes.INSTANCES}/${card.designId}`}>
							<Card {...card} lazy={index() > 5} scale="var(--card-scale)" />
						</a>
					)
				}
			</CardList>
		</div>
	);
}
