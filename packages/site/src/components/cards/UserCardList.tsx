import { get } from '@site/lib/client/data';
import type { CardType } from '@site/lib/client/utils';
import { Show, createSignal } from 'solid-js';
import { createStore, produce } from 'solid-js/store';
import CardList from './CardList';

export default function UserCardList(props: {
	initialCards: CardType[];
	username: string;
	filters?: Array<[string, string]>;
	initialCursor?: string;
}) {
	const [cards, setCards] = createStore(props.initialCards);
	const [nextCursor, setNextCursor] = createSignal(props.initialCursor ?? null);

	const loadCards = async () => {
		let result;
		const cursor = nextCursor();
		if (cursor) result = await get('cards-by-rarity', [props.username], { cursor });
		else result = await get('cards-by-rarity', [props.username]);

		setCards(produce(cards => cards.push(...result.data)));
		setNextCursor(result.cursor);
	};

	return (
		<>
			<ul>
				<CardList
					cards={cards}
					isUserPage
					sortOnlyBy={[
						'rarest',
						'common',
						'card-name-asc',
						'card-name-desc',
						'open-date-asc',
						'open-date-desc',
					]}></CardList>

				<Show when={nextCursor()}>
					<LoadMoreCardsButton load={loadCards}>Load more cards</LoadMoreCardsButton>
				</Show>
			</ul>
		</>
	);
}

function LoadMoreCardsButton(props: { load: () => void; children?: string }) {
	return (
		<button class="m-8 border-brand-main mx-auto w-full max-w-52 border p-2 relative" onClick={() => props.load()}>
			<div class="w-px h-px absolute -top-96 bg-red-500"
				ref={div => {
					const observer = new IntersectionObserver(entries => {
						for (let entry of entries) {
							if (entry.isIntersecting) {
								props.load()
							}
						}
					});

					observer.observe(div);
				}}
			/>
			{ props.children || "Click to load more" }
		</button>
	);
}
