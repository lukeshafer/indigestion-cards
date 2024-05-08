import { type SortInfo, getSortInfo, type CardType } from '@site/lib/client/utils';
import { Show, createEffect, createSignal, on } from 'solid-js';
import { createStore, produce } from 'solid-js/store';
import { BaseCardList } from './CardList';
import { trpc } from '@site/lib/client/trpc';
import { CardListMenu } from './CardList';
import CardListSortDropdown from './CardListSortDropdown';

export default function UserCardList(props: {
	initialCards: CardType[];
	username: string;
	filters?: Array<[string, string]>;
	initialCursor?: string;
}) {
	const [cards, setCards] = createStore(props.initialCards);
	const [nextCursor, setNextCursor] = createSignal(props.initialCursor ?? null);
	const [sortInfo, setSortInfo] = createSignal<SortInfo>({
		by: 'rarity',
		isReversed: false,
	});

	createEffect(
		on(
			() => ({ sortInfo: sortInfo(), username: props.username }),
			async ({ sortInfo, username }) => {
				let queryFn;
				if (sortInfo.by === 'rarity') {
					queryFn = trpc.userCards.sortedByRarity;
				} else if (sortInfo.by === 'cardName') {
					queryFn = trpc.userCards.sortedByName;
				}
				if (!queryFn) return;

				const result = await queryFn.query({
					username: username,
					isReversed: sortInfo.isReversed,
				});

				setCards(result.data);
				setNextCursor(result.cursor);
			}
		)
	);

	const loadCards = async () => {
		let result = await trpc.userCards.sortedByRarity.query({
			username: props.username,
			cursor: nextCursor() || undefined,
		});

		setCards(produce(cards => cards.push(...result.data)));
		setNextCursor(result.cursor);
	};

	return (
		<>
			<div>
				<CardListMenu>
					<CardListSortDropdown
						sortTypes={['rarest', 'common', 'card-name-asc', 'card-name-desc']}
            setSort={(sortType) => {
              setSortInfo(getSortInfo(sortType))
            }}
					/>
				</CardListMenu>
				<BaseCardList cards={cards} isUserPage />
			</div>

			<Show when={nextCursor()}>
				<LoadMoreCardsButton load={loadCards}>Load more cards</LoadMoreCardsButton>
			</Show>
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
