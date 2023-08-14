import { routes } from '@/constants';
import Card from '@/components/cards/Card';
import { For, Show, createSignal } from 'solid-js';
import styles from './CardList.module.css';
import { Select } from '../form';
import type { CardInstanceEntity } from '@lil-indigestion-cards/core/card';
import { useViewTransition } from '@/lib/client/utils';

type CardType = Parameters<typeof Card>[0] & Partial<CardInstanceEntity>;

const sortTypes = [
	{ value: 'card-name-asc', label: 'Card Name (A-Z)' },
	{ value: 'card-name-desc', label: 'Card Name (Z-A)' },
	{ value: 'rarest', label: 'Most to Least Rare' },
	{ value: 'common', label: 'Least to Most Rare' },
] as const;

type SortType = (typeof sortTypes)[number]['value'];

export default function CardList(props: {
	cards: CardType[];
	showUsernames?: boolean;
	noSort?: boolean;
	sortOnlyBy?: SortType[];
}) {
	const allowedSortTypes = () =>
		props.sortOnlyBy?.length
			? sortTypes.filter((type) => props.sortOnlyBy?.includes(type.value))
			: sortTypes.slice();
	const [sort, setSort] = createSignal<string>(allowedSortTypes()[0].value);

	const sortedCards = () => sortCards({ cards: props.cards, sort: sort() });

	return (
		<div class="flex flex-col gap-3">
			{props.noSort ? null : (
				<div class="ml-auto flex w-fit">
					<Select
						name="sort"
						label="Sort by"
						setValue={(val) => useViewTransition(() => setSort(val))}
						options={allowedSortTypes()}
					/>
				</div>
			)}
			<ul
				class="grid w-full justify-center justify-items-center gap-x-2 gap-y-14 px-3 md:gap-x-6"
				classList={{ [styles.cardList]: true }}>
				<Show when={sortedCards().length > 0} fallback={<p>No cards found</p>}>
					<For each={sortedCards()}>
						{(card) => (
							<div class="w-fit">
								<a
									rel="prefetch"
									href={`${routes.INSTANCES}/${card.designId}/${
										card.instanceId ?? ''
									}`}>
									<Card {...card} scale="var(--card-scale)" />
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
							</div>
						)}
					</For>
				</Show>
			</ul>
		</div>
	);
}

function sortCards(props: { cards: CardType[]; sort: SortType | (string & {}) }) {
	const { cards, sort } = props;

	switch (sort) {
		case 'card-name-asc':
			return cards.sort(
				(a, b) => a.cardName.localeCompare(b.cardName) || a.totalOfType - b.totalOfType || +a.cardNumber - +b.cardNumber
			);
		case 'card-name-desc':
			return cards.sort(
				(a, b) => b.cardName.localeCompare(a.cardName) || a.totalOfType - b.totalOfType || +a.cardNumber - +b.cardNumber
			);
		case 'rarest':
			return cards.sort(
				(a, b) => a.totalOfType - b.totalOfType || a.cardName.localeCompare(b.cardName) || +a.cardNumber - +b.cardNumber
			);
		case 'common':
			return cards.sort(
				(a, b) => b.totalOfType - a.totalOfType || a.cardName.localeCompare(b.cardName) || +a.cardNumber - +b.cardNumber
			);
		default:
			return cards;
	}
}
