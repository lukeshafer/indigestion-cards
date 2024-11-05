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
	TiltEffect,
	getCardImageUrl,
	checkIsFullArt,
	FULL_ART_BACKGROUND_CSS,
	checkIfCanShowCardText,
	checkIsLegacyCard,
} from './Card';
import type { CardDesign } from '@core/types';

export default function AllDesignsCardList(props: {
	initialCards: CardDesign[];
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
		<TiltEffect>
			<Card
				lazy={props.lazy}
				scale="var(--card-scale)"
				alt={props.card.cardName}
				cardName={checkIfCanShowCardText(rarityId()) && props.card.cardName}
				cardDescription={checkIfCanShowCardText(rarityId()) && props.card.cardDescription}
				secret={checkIsSecret(rarityId())}
				legacy={checkIsLegacyCard(rarityId())}
				viewTransitionName={`design-${props.card.designId}`}
				centerStamp={undefined}
				cardNumberColor={undefined}
				cardNumberString={undefined}
				imgSrc={getCardImageUrl({
					designId: props.card.designId,
					rarityId: rarityId(),
				})}
				backgroundCSS={
					checkIsFullArt(rarityId())
						? FULL_ART_BACKGROUND_CSS
						: props.card.bestRarityFound?.rarityColor
				}
			/>
		</TiltEffect>
	);

	return (
		<Show when={!checkIsSecret('')} fallback={card}>
			<a href={`${routes.INSTANCES}/${props.card.designId}`}>{card}</a>
		</Show>
	);
};
