import { NO_CARDS_OPENED_ID, routes } from '@site/constants';
import Card from '@site/components/cards/Card';
import { For, Show, createMemo, createSignal, type JSXElement } from 'solid-js';
import { Select, TextInput } from '../form/Form';
import type { CardInstance, CardDesign } from '@core/types';
import {
	getCardSearcher,
	sortCards,
	sortTypes,
	useViewTransition,
	type SortType,
} from '@site/lib/client/utils';
import type { RarityRankingRecord } from '@core/lib/site-config';
import CardListFilter, {
	createFilters,
	filterCards,
	parseUniqueSeasons,
	type Filters,
} from './CardListFilter';

type CardType = Parameters<typeof Card>[0] & Partial<CardInstance> & Partial<CardDesign>;

const possibleFilterKeys = ['seasonId', 'minterId'] as const;
type FilterKey = (typeof possibleFilterKeys)[number];

export function CardList(props: {
	cards: Array<CardType>;
	showUsernames?: boolean;
	isUserPage?: boolean;
	children: (card: CardType, index: () => number) => JSXElement;
}): JSXElement {
	return (
		<ul
			class="grid w-full justify-center justify-items-center gap-x-2 gap-y-14 px-3 [--card-scale:0.75] sm:[--card-scale:1] md:gap-x-6"
			style={{
				'grid-template-columns':
					'repeat(auto-fill, minmax(calc(var(--card-scale) * 18rem), 1fr))',
			}}>
			<Show when={props.cards.length > 0} fallback={<p>No cards found</p>}>
				<For each={props.cards}>
					{(card, index) => <li class="w-fit">{props.children(card, index)}</li>}
				</For>
			</Show>
		</ul>
	);
}

export const CardListMenu = (props: { children: JSXElement }) => (
	<div class="mb-3 flex px-4">{props.children}</div>
);

export default function GenericCardList(props: {
	cards: CardType[];
	showUsernames?: boolean;
	noSort?: boolean;
	sortOnlyBy?: SortType[];
	isUserPage?: boolean;
	rarityRanking?: RarityRankingRecord;
	filters?: Array<[string, string]>;
	filterKeys?: Array<FilterKey>;
	cursor?: string;
}) {
	const allowedSortTypes = () =>
		props.sortOnlyBy?.length
			? sortTypes.filter(type => props.sortOnlyBy?.includes(type.value))
			: sortTypes.slice();
	// eslint-disable-next-line solid/reactivity
	const [sort, setSort] = createSignal<string>(allowedSortTypes()[0].value);
	const [searchText, setSearchText] = createSignal('');

	const filterKeys = () => props.filterKeys ?? possibleFilterKeys;

	const [filters, setFilters] = createSignal<Filters>(createFilters());

	const seasons = () => parseUniqueSeasons(props.cards);
	const filteredCards = () => filterCards(props.cards, filters());

	const sortedCards = createMemo(() => {
		//console.log('sorting', sort());
		const s = sortCards({
			cards: filteredCards(),
			sort: sort(),
			rarityRanking: props.rarityRanking,
		});

		return s;
	});

	const searcher = createMemo(() => {
		return getCardSearcher(sortedCards());
	});

	const cards = () => (searchText() ? searcher()(searchText()) : sortedCards());

	return (
		<div class="flex flex-col gap-3 ">
			<CardListMenu>
				<Show when={filterKeys().length}>
					<CardListFilter
						params={{
							seasons: filterKeys().includes('seasonId') ? seasons() : undefined,
							minterId: filterKeys().includes('minterId'),
						}}
						setFilters={setFilters}
					/>
				</Show>
				<div class="ml-auto flex gap-4">
					<TextInput
						class="h-8 self-end"
						name="search"
						label="Search cards"
						type="text"
						setValue={setSearchText}
					/>
					{props.noSort ? null : (
						<Select
							name="sort"
							class="h-8 self-end p-1"
							label="Sort by"
							setValue={val => useViewTransition(() => setSort(val))}
							options={allowedSortTypes()}
						/>
					)}
				</div>
			</CardListMenu>
			<CardList
				cards={cards()}
				isUserPage={props.isUserPage}
				showUsernames={props.showUsernames}>
				{(card, index) =>
					card.bestRarityFound?.rarityId === NO_CARDS_OPENED_ID ? (
						<Card {...card} lazy={index() > 5} scale="var(--card-scale)" />
					) : (
						<>
							<a
								href={
									props.isUserPage && card.username
										? `${routes.USERS}/${card.username}/${
												card.instanceId ?? ''
											}`
										: `${routes.INSTANCES}/${card.designId}/${
												card.instanceId ?? ''
											}`
								}>
								<Card {...card} lazy={index() > 5} scale="var(--card-scale)" />
							</a>
							<Show when={props.showUsernames}>
								<p class="mt-2">
									Owner:{' '}
									<a
										href={`${routes.USERS}/${card.username}`}
										class="inline font-bold hover:underline">
										{card.username}
									</a>
								</p>
							</Show>
						</>
					)
				}
			</CardList>
		</div>
	);
}
