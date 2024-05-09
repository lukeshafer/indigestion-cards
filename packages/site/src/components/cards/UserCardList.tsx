import { type SortInfo, getSortInfo, type CardType } from '@site/lib/client/utils';
import { Show, Suspense, createResource, createSignal, type Setter } from 'solid-js';
import { BaseCardList } from './CardList';
import { trpc } from '@site/lib/client/trpc';
import { CardListMenu } from './CardList';
import CardListSortDropdown from './CardListSortDropdown';
import CardListFilter, { createFilters, filterCards, parseUniqueSeasons } from './CardListFilter';
import PlaceholderCardList from './PlaceholderCardList';

export default function UserCardList(props: {
	initialCards: CardType[];
	username: string;
	initialCursor?: string;
	pinnedCardId?: string;
}) {
	const [nextCursor, setNextCursor] = createSignal(props.initialCursor ?? null);
	const [sortInfo, setSortInfo] = createSignal<SortInfo>({
		by: 'rarity',
		isReversed: false,
	});
	const [filters, setFilters] = createSignal(createFilters());

	const [cardsResource, { mutate: mutateCards }] = createResource(
		() => ({
			sortInfo: sortInfo(),
			username: props.username,
			setNextCursor,
			pinnedCardId: props.pinnedCardId,
		}),
		queryCards,
		{ initialValue: props.initialCards, ssrLoadFrom: 'initial' }
	);

	const filteredCards = () => filterCards(cardsResource() ?? [], filters());

	return (
		<>
			<div>
				<CardListMenu>
					<CardListFilter
						params={{
							seasons: parseUniqueSeasons(cardsResource.latest),
							minterId: true,
						}}
						setFilters={setFilters}
					/>
					<div class="ml-auto flex gap-4">
						<CardListSortDropdown
							sortTypes={['rarest', 'common', 'card-name-asc', 'card-name-desc']}
							setSort={sortType => {
								setSortInfo(getSortInfo(sortType));
							}}
						/>
					</div>
				</CardListMenu>
				<Suspense fallback={<PlaceholderCardList />}>
					<BaseCardList cards={filteredCards() ?? []} isUserPage />
					<Show when={nextCursor()}>
						<LoadMoreCardsButton
							load={() => {
								queryCards({
									username: props.username,
									sortInfo: sortInfo(),
									cursor: nextCursor() || undefined,
									setNextCursor,
								}).then(result =>
									mutateCards(cards => [...(cards ?? []), ...result])
								);
							}}>
							Load more cards
						</LoadMoreCardsButton>
					</Show>
				</Suspense>
			</div>
		</>
	);
}

function LoadMoreCardsButton(props: { load: () => void; children?: string }) {
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
								props.load();
							}
						}
					});

					observer.observe(div);
				}}
			/>
			{props.children || 'Click to load more'}
		</button>
	);
}

async function queryCards(opts: {
	sortInfo: SortInfo;
	username: string;
	cursor?: string;
	pinnedCardId?: string;
	setNextCursor: Setter<string | null>;
}): Promise<Array<CardType>> {
	const query =
		opts.sortInfo.by === 'cardName'
			? trpc.userCards.sortedByName.query
			: trpc.userCards.sortedByRarity.query;

	const result = await query({
		username: opts.username,
		isReversed: opts.sortInfo.isReversed,
		cursor: opts.cursor,
		ignoredIds: opts.pinnedCardId ? [opts.pinnedCardId] : undefined,
	});

	opts.setNextCursor(result.cursor);
	return result.data;
}
