import {
	createMemo,
	createSignal,
	For,
	Show,
	type Component,
	type JSXElement,
	type Setter,
} from 'solid-js';

export function CardList<T extends CardDesign | CardInstance>(props: {
	cards: Array<T>;
	children: (card: T, index: () => number) => JSXElement;
	scale?: number;
}): JSXElement {
	return (
		<ul
			class="grid w-full justify-around justify-items-center gap-x-2 gap-y-14 px-3 [--base-card-scale:0.75] sm:[--base-card-scale:1] md:gap-x-6"
			style={{
				'--card-scale': `calc(${props.scale ?? 1} * var(--base-card-scale))`,
				'grid-template-columns':
					'repeat(auto-fit, minmax(auto, calc(var(--card-scale) * 18rem)))',
			}}>
			<Show when={props.cards.length > 0} fallback={<p>No cards found</p>}>
				<For each={props.cards}>
					{(card, index) => <li class="w-fit">{props.children(card, index)}</li>}
				</For>
			</Show>
		</ul>
	);
}

export const CardListMenu: Component<{ children: JSXElement }> = props => (
	<div class="mx-auto mb-6 flex max-w-3xl gap-4 px-2">{props.children}</div>
);

// FILTERING
import { Fieldset, SubmitButton } from '@site/components/Form';

export type SeasonFilterParams = {
	seasonId: string;
	seasonName: string;
};

type FilterParams = {
	seasons?: Array<SeasonFilterParams>;
	minterId?: boolean;
};

const PAGE_USER = 'page-user';
const OTHER_USER = 'other-user';
type MinterIdValue = typeof PAGE_USER | typeof OTHER_USER;

export type Filters = ReturnType<typeof createFilters>;

export const createFilters = (opts?: { seasonIds?: Array<string> }) => ({
	seasonIds: new Set<string>(opts?.seasonIds),
	minterId: new Set<MinterIdValue>(),
});

export const parseUniqueSeasons = (list: Array<Partial<SeasonFilterParams>>) =>
	Array.from(
		list
			.reduce<Map<string, SeasonFilterParams>>(
				(map, item) =>
					item.seasonId && item.seasonName
						? map.set(item.seasonId, {
								seasonId: item.seasonId,
								seasonName: item.seasonName,
							})
						: map,
				new Map()
			)
			.values()
	);

export function CardListFilter(props: {
	params: FilterParams;
	setFilters: (filters: Filters) => void;
	ssrFilters?: Filters;
}) {
	return (
		<details class="relative w-96 self-end rounded bg-gray-200 px-4 py-2 dark:bg-gray-900">
			<summary class="cursor-pointer text-left">Filter</summary>
			<div class="absolute left-0 top-full z-10 w-full bg-gray-200 dark:bg-gray-900">
				<form
					class="flex flex-wrap gap-2 p-4"
					onSubmit={e => e.preventDefault()}
					onInput={async e => {
						const formData = new FormData(e.currentTarget);
						syncFormDataWithUrlSearchParams(formData);
						props.setFilters({
							seasonIds: new Set(formData.getAll('seasonId') as Array<string>),
							minterId: new Set(formData.getAll('minterId') as Array<MinterIdValue>),
						});
					}}>
					<Show when={props.params.seasons}>
						{seasons => (
							<div class="w-full">
								<Fieldset legend="Season">
									<For each={seasons()}>
										{({ seasonId, seasonName }) => (
											<label class="flex gap-2">
												<input
													type="checkbox"
													name="seasonId"
													value={seasonId}
													checked={props.ssrFilters?.seasonIds.has(
														seasonId
													)}
													class="focus:border-brand-main focus:ring-brand-main inline-block w-auto rounded-none bg-white p-1 text-black focus:outline-none focus:ring-4"
												/>
												{seasonName}
											</label>
										)}
									</For>
								</Fieldset>
							</div>
						)}
					</Show>
					<Show when={props.params.minterId}>
						<div class="w-full">
							<Fieldset legend="Origin">
								<label class="flex gap-2">
									<input
										type="checkbox"
										name="minterId"
										value={PAGE_USER}
										checked={props.ssrFilters?.minterId.has(PAGE_USER)}
										class="focus:border-brand-main focus:ring-brand-main inline-block w-auto rounded-none bg-white p-1 text-black focus:outline-none focus:ring-4"
									/>
									Minted
								</label>
								<label class="flex gap-2">
									<input
										type="checkbox"
										name="minterId"
										value={OTHER_USER}
										checked={props.ssrFilters?.minterId.has(OTHER_USER)}
										class="focus:border-brand-main focus:ring-brand-main inline-block w-auto rounded-none bg-white p-1 text-black focus:outline-none focus:ring-4"
									/>
									Traded
								</label>
							</Fieldset>
						</div>
					</Show>
					<div ref={e => e.remove()}>
						<SubmitButton>Save</SubmitButton>
					</div>
				</form>
			</div>
		</details>
	);
}

function syncFormDataWithUrlSearchParams(formData: FormData) {
	const url = new URL(window.location.href);
	url.search = new URLSearchParams(formData as unknown as string).toString();
	window.history.replaceState({}, '', url.toString());
}

export function filterCards<
	T extends Partial<Pick<CardInstance, 'minterId' | 'userId' | 'seasonId'>>,
>(cards: Array<T>, filters: Filters): Array<T> {
	// console.log('filtering cards', { cards, filters });
	if (Object.values(filters).every(f => f.size === 0)) return cards;

	return cards.filter(card => {
		if (filters.seasonIds.size) {
			let seasonId = card.seasonId;
			if (!seasonId) return false;
			if (!checkCardHasValidSeason({ seasonId }, filters.seasonIds)) return false;
		}

		if (filters.minterId.size) {
			const hasValidMinterId = checkCardHasValidMinterId(card, filters.minterId);
			if (!hasValidMinterId) return false;
		}

		return true;
	});
}

function checkCardHasValidSeason(card: Pick<CardInstance, 'seasonId'>, seasons: Set<string>) {
	for (const seasonId of seasons) {
		if (card.seasonId === seasonId) return true;
		else continue;
	}
	return false;
}

function checkCardHasValidMinterId(
	card: Pick<CardInstance, 'minterId' | 'userId'>,
	minterId: Set<MinterIdValue>
) {
	if (minterId.has(PAGE_USER) && card.minterId === card.userId) {
		return true;
	} else if (minterId.has(OTHER_USER) && card.minterId !== card.userId) {
		return true;
	} else {
		return false;
	}
}

export function parseFiltersFromSearchParams(params: URLSearchParams) {
	const filters = createFilters();

	for (const [key, value] of Array.from(params)) {
		if (key === 'seasonId') {
			filters.seasonIds.add(value);
		} else if (key === 'minterId' && (value === PAGE_USER || value === OTHER_USER)) {
			filters.minterId.add(value);
		}
	}

	return filters;
}

/// LOAD BUTTON
export function CardListLoader(props: { load: () => Promise<unknown>; children?: string }) {
	return (
		<button
			class="border-brand-main relative m-8 mx-auto w-full max-w-52 border p-2"
			onClick={() => props.load()}>
			<div
				class="absolute -top-96 h-px w-px bg-red-500"
				ref={div => {
					const observer = new IntersectionObserver(entries => {
						for (let entry of entries) {
							if (entry.isIntersecting) {
								const viewportHeight = entry.rootBounds?.height ?? 0;
								(function load(count = 0) {
									props.load().then(() => {
										if (!entry.target.checkVisibility()) {
											return;
										}
										if (count > 50)
											throw new Error(
												'Loaded too many times: there is likely a bug'
											);
										setTimeout(() => {
											if (
												entry.target.getBoundingClientRect().top <
												viewportHeight
											) {
												load(count + 1);
											}
										}, 50);
									});
								})();
							}
						}
					});

					observer.observe(div);
					observer.takeRecords();
				}}
			/>
			{props.children || 'Click to load more'}
		</button>
	);
}

// SEARCH
import { TextInput } from '@site/components/Form';

export function CardListSearch(props: { setSearchText: (text: string) => void }) {
	let timeout: NodeJS.Timeout;

	return (
		<TextInput
			class="h-8 self-end"
			name="search"
			label="Search cards"
			type="text"
			setValue={text => {
				if (timeout) {
					clearTimeout(timeout);
				}
				timeout = setTimeout(props.setSearchText, 200, text);
			}}
		/>
	);
}

// SORT
import { useViewTransition } from '@site/client/utils';
import { Select } from '@site/components/Form';
import type { CardDesign, CardInstance } from '@core/types';
import { sortCards, sortTypes as validSortTypes, type SortType } from '@site/client/card-sort';
import Fuse from 'fuse.js';

export function CardListSortDropdown<T extends ReadonlyArray<SortType>>(props: {
	sortTypes: T | 'all';
	setSort: (value: T[number]) => void;
	default?: T[number];
}) {
	const selectedSortTypes = () =>
		props.sortTypes === 'all'
			? validSortTypes.slice()
			: validSortTypes.filter(type => props.sortTypes.includes(type.value));

	return (
		<Select
			name="sort"
			class="h-8 self-end p-1"
			label="Sort by"
			setValue={val => useViewTransition(() => props.setSort(val as SortType))}
			options={selectedSortTypes()}
			value={props.default}
		/>
	);
}

export const PlaceholderCardList: Component<{ length?: number; scale?: number }> = props => (
	<ul
		class="grid w-full justify-center justify-items-center gap-x-2 gap-y-14 px-3 [--base-card-scale:0.75] sm:[--base-card-scale:1] md:gap-x-6"
		style={{
			'--card-scale': `calc(${props.scale ?? 1} * var(--base-card-scale))`,
			'grid-template-columns':
				'repeat(auto-fill, minmax(calc(var(--card-scale) * 18rem), 1fr))',
		}}>
		<For each={[...Array(props.length || 6).keys()]}>
			{() => (
				<li class="w-fit" style={{ 'font-size': `calc(1rem * var(--card-scale))` }}>
					<article class="card-wrapper card-aspect-ratio relative w-[18em] bg-cover text-left">
						<img src="/assets/cards/placeholder.png" alt="" class="absolute inset-0" />
					</article>
				</li>
			)}
		</For>
	</ul>
);

export function createCardList<Card extends CardInstance | CardDesign>(
	cards: () => Array<Card>,
	opts?: {
		default?: {
			sortType?: SortType;
			filters?: Filters;
			searchText?: string;
		};
	}
): [
	cards: () => Array<Card>,
	state: {
		setSortType: Setter<SortType>;
		setFilters: Setter<Filters>;
		setSearchText: Setter<string>;
	},
] {
	const [sortType, setSortType] = createSignal<SortType>(opts?.default?.sortType ?? 'rarest');
	const [filters, setFilters] = createSignal<Filters>(opts?.default?.filters ?? createFilters());
	const [searchText, setSearchText] = createSignal(opts?.default?.searchText ?? '');

	const filteredCards = createMemo(() => filterCards(cards(), filters()));

	const sortedCards = createMemo(() => {
		const sortedCards = sortCards({ cards: filteredCards(), sort: sortType() });

		if (searchText().length === 0) {
			return sortedCards;
		}

		let searchCards = createCardSearcher(sortedCards);
		return searchCards(searchText());
	});

	return [sortedCards, { setSortType, setFilters, setSearchText }];
}

function createCardSearcher<T extends CardDesign | CardInstance>(cards: T[]) {
	const fuse = new Fuse(cards, {
		keys: [
			{ name: 'cardName', weight: 5 },
			{ name: 'rarityName', weight: 5 },
			{ name: 'seasonName', weight: 2 },
			{ name: 'cardNumber', weight: 2 },
			{ name: 'username', weight: 1 },
			{ name: 'stamps', weight: 1 },
		],
	});

	return (searchTerm: string) => fuse.search(searchTerm).map(result => result.item);
}

export default {
	List: CardList,
	Menu: CardListMenu,
	Filter: CardListFilter,
	LoadButton: CardListLoader,
	Search: CardListSearch,
	SortDropdown: CardListSortDropdown,
};
