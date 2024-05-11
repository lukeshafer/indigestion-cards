import { type SortInfo, getSortInfo, type CardType } from '@site/lib/client/utils';
import { Show, Suspense, createResource, createSignal, type Setter } from 'solid-js';
import { CardList as CardList } from './CardList';
import { trpc } from '@site/lib/client/trpc';
import { CardListMenu } from './CardList';
import CardListSortDropdown from './CardListSortDropdown';
import CardListFilter, { filterCards, parseUniqueSeasons, type Filters } from './CardListFilter';
import PlaceholderCardList from './PlaceholderCardList';
import CardListSearch from './CardListSearch';
import { routes } from '@site/constants';
import Card from './Card';
import CardListLoader from './CardListLoader';

export default function UserCardList(props: {
	initialCards: CardType[];
	username: string;
	ssrFilters: Filters;
	initialCursor?: string;
	pinnedCardId?: string;
}) {
	const [nextCursor, setNextCursor] = createSignal(props.initialCursor ?? null);
	const [sortInfo, setSortInfo] = createSignal<SortInfo>({
		by: 'rarity',
		isReversed: false,
	});
	const [filters, setFilters] = createSignal(props.ssrFilters);
	const [searchText, setSearchText] = createSignal('');

	const [cardsResource, { mutate: mutateCards }] = createResource(
		() => ({
			sortInfo: sortInfo(),
			username: props.username,
			setNextCursor,
			pinnedCardId: props.pinnedCardId,
			searchText: searchText(),
		}),
		queryCards,
		{ initialValue: props.initialCards, ssrLoadFrom: 'initial' }
	);

	const filteredCards = () => filterCards(cardsResource() ?? [], filters());
	return (
		<div>
			<CardListMenu>
				<CardListFilter
					params={{
						seasons: parseUniqueSeasons(cardsResource.latest),
						minterId: true,
					}}
					setFilters={setFilters}
					ssrFilters={/*@once*/ props.ssrFilters}
				/>
				<div class="ml-auto flex gap-4">
					<CardListSearch setSearchText={setSearchText} />
					<CardListSortDropdown
						sortTypes={[
							'rarest',
							'common',
							'card-name-asc',
							'card-name-desc',
							'open-date-asc',
							'open-date-desc',
						]}
						setSort={sortType => {
							setSortInfo(getSortInfo(sortType));
						}}
					/>
				</div>
			</CardListMenu>
			<Suspense fallback={<PlaceholderCardList />}>
				<CardList cards={filteredCards() ?? []}>
					{(card, index) => (
						<a href={`${routes.USERS}/${card.username}/${card.instanceId ?? ''}`}>
							<Card {...card} lazy={index() > 5} scale="var(--card-scale)" />
						</a>
					)}
				</CardList>
				<Show when={nextCursor() && !searchText()}>
					<CardListLoader
						load={() =>
							queryCards({
								username: props.username,
								sortInfo: sortInfo(),
								cursor: nextCursor() || undefined,
								setNextCursor,
								searchText: '',
							}).then(result => mutateCards(cards => [...(cards ?? []), ...result]))
						}>
						Load more cards
					</CardListLoader>
				</Show>
			</Suspense>
		</div>
	);
}

async function queryCards(opts: {
	sortInfo: SortInfo;
	username: string;
	cursor?: string;
	pinnedCardId?: string;
	setNextCursor: Setter<string | null>;
	searchText: string;
}): Promise<Array<CardType>> {
	if (opts.searchText.length > 0) {
		const result = await trpc.userCards.search.query({
			searchText: opts.searchText,
			username: opts.username,
			sortType: opts.sortInfo.by,
			isReversed: opts.sortInfo.isReversed,
			ignoredIds: opts.pinnedCardId ? [opts.pinnedCardId] : undefined,
		});

		return result;
	}

	const query =
		opts.sortInfo.by === 'cardName'
			? trpc.userCards.sortedByName.query
			: opts.sortInfo.by === 'rarity'
				? trpc.userCards.sortedByRarity.query
				: trpc.userCards.sortedByOpenDate.query;

	const result = await query({
		username: opts.username,
		isReversed: opts.sortInfo.isReversed,
		cursor: opts.cursor,
		ignoredIds: opts.pinnedCardId ? [opts.pinnedCardId] : undefined,
	});

	opts.setNextCursor(result.cursor);
	return result.data;
}
