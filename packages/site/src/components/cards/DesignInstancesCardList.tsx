import { getSortInfo, type CardType, type SortInfo } from '@site/lib/client/utils';
import { Show, Suspense, createResource, createSignal, type Setter } from 'solid-js';
import CardListFilter, { filterCards, type Filters } from './CardListFilter';
import { trpc } from '@site/lib/client/trpc';
import { CardList, CardListMenu } from './CardList';
import CardListSearch from './CardListSearch';
import CardListSortDropdown from './CardListSortDropdown';
import PlaceholderCardList from './PlaceholderCardList';
import { routes } from '@site/constants';
import Card from './Card';
import CardListLoader from './CardListLoader';

export default function DesignInstancesCardList(props: {
	initialCards: CardType[];
	designId: string;
	ssrFilters: Filters;
	initialCursor?: string;
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
			setNextCursor,
			searchText: searchText(),
			designId: props.designId,
		}),
		queryCards,
		{ initialValue: props.initialCards, ssrLoadFrom: 'initial' }
	);

	const filteredCards = () => filterCards(cardsResource() ?? [], filters());

	return (
		<div>
			<CardListMenu>
				<CardListFilter
					params={{ minterId: true }}
					setFilters={setFilters}
					ssrFilters={/*@once*/ props.ssrFilters}
				/>
				<div class="ml-auto flex gap-4">
					<CardListSearch setSearchText={setSearchText} />
					<CardListSortDropdown
						sortTypes={[
							'rarest',
							'common',
							'open-date-asc',
							'open-date-desc',
							'owner-asc',
							'owner-desc',
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
						<>
							<a
								href={`${routes.INSTANCES}/${card.designId}/${
									card.instanceId ?? ''
								}`}>
								<Card {...card} lazy={index() > 5} scale="var(--card-scale)" />
							</a>
							<p class="mt-2">
								Owner:{' '}
								<a
									href={`${routes.USERS}/${card.username}`}
									class="inline font-bold hover:underline">
									{card.username}
								</a>
							</p>
						</>
					)}
				</CardList>
				<Show when={nextCursor() && !searchText()}>
					<CardListLoader
						load={() =>
							queryCards({
								designId: props.designId,
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
	designId: string;
	cursor?: string;
	setNextCursor: Setter<string | null>;
	searchText: string;
}): Promise<Array<CardType>> {
	if (opts.searchText.length > 0) {
		const result = await trpc.designCards.search.query({
			searchText: opts.searchText,
			designId: opts.designId,
			sortType: opts.sortInfo.by,
			isReversed: opts.sortInfo.isReversed,
		});

		return result;
	}

	const query =
		opts.sortInfo.by === 'rarity'
			? trpc.designCards.sortedByRarity.query
			: opts.sortInfo.by === 'openDate'
				? trpc.designCards.sortedByOpenDate.query
				: trpc.designCards.sortedByOwner.query;

	const result = await query({
		designId: opts.designId,
		isReversed: opts.sortInfo.isReversed,
		cursor: opts.cursor,
	});

	opts.setNextCursor(result.cursor);
	return result.data;
}
