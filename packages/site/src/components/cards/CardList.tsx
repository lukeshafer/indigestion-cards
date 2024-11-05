import { For, Show, type JSXElement } from 'solid-js';
//import type { CardType } from '@site/lib/client/utils';

export function CardList<T extends CardDesign | CardInstance>(props: {
	cards: Array<T>;
	showUsernames?: boolean;
	isUserPage?: boolean;
	children: (card: T, index: () => number) => JSXElement;
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

// FILTERING
import { Fieldset, SubmitButton } from '../form/Form';

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
		<details class="w-fit min-w-32 max-w-72 self-end">
			<summary>Filter</summary>
			<form
				class="flex flex-wrap gap-2"
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
						<div class="w-fit">
							<Fieldset legend="Season">
								<For each={seasons()}>
									{({ seasonId, seasonName }) => (
										<label class="flex gap-2">
											<input
												type="checkbox"
												name="seasonId"
												value={seasonId}
												checked={props.ssrFilters?.seasonIds.has(seasonId)}
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
					<div class="w-fit">
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
		</details>
	);
}

function syncFormDataWithUrlSearchParams(formData: FormData) {
	const url = new URL(window.location.href);
	url.search = new URLSearchParams(formData as unknown as string).toString();
	window.history.replaceState({}, '', url.toString());
}

export function filterCards<T extends Pick<CardInstance, 'minterId' | 'userId' | 'seasonId'>>(
	cards: Array<T>,
	filters: Filters
): Array<T> {
	// console.log('filtering cards', { cards, filters });
	if (Object.values(filters).every(f => f.size === 0)) return cards;

	return cards.filter(card => {
		if (filters.seasonIds.size) {
			const hasValidSeason = checkCardHasValidSeason(card, filters.seasonIds);
			if (!hasValidSeason) return false;
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
export function CardListLoader(props: { load: () => Promise<any>; children?: string }) {
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
					observer.takeRecords;
				}}
			/>
			{props.children || 'Click to load more'}
		</button>
	);
}

// SEARCH
import { TextInput } from '../form/Form';

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
import {
	useViewTransition,
	type SortType,
	sortTypes as validSortTypes,
} from '@site/lib/client/utils';
import { Select } from '../form/Form';
import type { CardDesign, CardInstance } from '@core/types';

export function CardListSortDropdown<T extends ReadonlyArray<SortType>>(props: {
	sortTypes: T | 'all';
	setSort: (value: T[number]) => void;
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
		/>
	);
}
