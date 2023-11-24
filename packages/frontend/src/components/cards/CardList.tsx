import { routes, NO_CARDS_OPENED_ID, FULL_ART_ID, LEGACY_CARD_ID } from '~/lib/constants';
import Card from './Card';
import { For, Show, createSignal } from 'solid-js';
import { Select } from '../form/Form';
import type { CardInstance } from '@core/db/cardInstances';
import type { CardDesign } from '@core/db/cardDesigns';
import type { SiteConfig } from '@core/db/siteConfig';
import { useViewTransition } from '~/lib/utils';
import { css } from '@acab/ecsstatic';
import { A } from '@solidjs/router';

type RarityRankingRecord = Record<
	string,
	NonNullable<SiteConfig['rarityRanking']>[number] | undefined
>;

type CardType = Parameters<typeof Card>[0] & Partial<CardInstance> & Partial<CardDesign>;

const sortTypes = [
	{ value: 'rarest', label: 'Most to Least Rare' },
	{ value: 'common', label: 'Least to Most Rare' },
	{ value: 'card-name-asc', label: 'Card Name (A-Z)' },
	{ value: 'card-name-desc', label: 'Card Name (Z-A)' },
	{ value: 'open-date-desc', label: 'Date Opened (Newest to Oldest)' },
	{ value: 'open-date-asc', label: 'Date Opened (Oldest to Newest)' },
	{ value: 'owner-asc', label: 'Owner (A-Z)' },
	{ value: 'owner-desc', label: 'Owner (Z-A)' },
] as const;

type SortType = (typeof sortTypes)[number]['value'];

const cardListStyles = css`
	grid-template-columns: repeat(auto-fill, minmax(calc(var(--card-scale) * 18rem), 1fr));
	--card-scale: 0.75;
	@media (min-width: 640px) {
		--card-scale: 1;
	}
`;

export default function CardList(props: {
	cards: CardType[];
	showUsernames?: boolean;
	noSort?: boolean;
	sortOnlyBy?: SortType[];
	isUserPage?: boolean;
	rarityRanking?: RarityRankingRecord;
}) {
	const allowedSortTypes = () =>
		props.sortOnlyBy?.length
			? sortTypes.filter((type) => props.sortOnlyBy?.includes(type.value))
			: sortTypes.slice();
	// eslint-disable-next-line solid/reactivity
	const [sort, setSort] = createSignal<string>(allowedSortTypes()[0].value);

	const sortedCards = () =>
		sortCards({ cards: props.cards, sort: sort(), rarityRanking: props.rarityRanking });

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
				classList={{ [cardListStyles]: true }}>
				<Show when={sortedCards().length > 0} fallback={<p>No cards found</p>}>
					<For each={sortedCards()}>
						{(card) => (
							<div class="w-fit">
								{card.bestRarityFound?.rarityId !==
								NO_CARDS_OPENED_ID /*|| props.sessionType === 'admin' */ ? (
									<>
										<A
											rel="prefetch"
											href={
												props.isUserPage && card.username
													? `${routes.USERS}/${card.username}/${
															card.instanceId ?? ''
													  } `
													: `${routes.INSTANCES}/${card.designId}/${
															card.instanceId ?? ''
													  }`
											}>
											<Card {...card} scale="var(--card-scale)" />
										</A>
										<Show when={props.showUsernames}>
											<p class="mt-2">
												Owner:{' '}
												<A
													href={`${routes.USERS}/${card.username}`}
													class="inline font-bold hover:underline">
													{card.username}
												</A>
											</p>
										</Show>
									</>
								) : (
									<Card {...card} scale="var(--card-scale)" />
								)}
							</div>
						)}
					</For>
				</Show>
			</ul>
		</div>
	);
}

function sortCards(args: {
	cards: CardType[];
	// eslint-disable-next-line @typescript-eslint/ban-types
	sort: SortType | (string & {});
	rarityRanking?: RarityRankingRecord;
}) {
	const { cards, sort } = args;

	switch (sort) {
		case 'card-name-asc':
			return cards.sort(
				(a, b) =>
					a.cardName.localeCompare(b.cardName) ||
					a.totalOfType - b.totalOfType ||
					+a.cardNumber - +b.cardNumber
			);
		case 'card-name-desc':
			return cards.sort(
				(a, b) =>
					b.cardName.localeCompare(a.cardName) ||
					a.totalOfType - b.totalOfType ||
					+a.cardNumber - +b.cardNumber
			);
		case 'rarest':
			return cards.sort((a, b) => rarestCardSort(a, b, args.rarityRanking));
		case 'common':
			return cards.sort((a, b) => rarestCardSort(a, b, args.rarityRanking)).reverse();
		case 'open-date-desc':
			return cards.sort((a, b) =>
				!(a.openedAt && b.openedAt)
					? 0
					: new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime() ||
					  a.cardName.localeCompare(b.cardName) ||
					  +a.cardNumber - +b.cardNumber
			);
		case 'open-date-asc':
			return cards.sort((a, b) =>
				!(a.openedAt && b.openedAt)
					? 0
					: new Date(a.openedAt).getTime() - new Date(b.openedAt).getTime() ||
					  a.cardName.localeCompare(b.cardName) ||
					  +a.cardNumber - +b.cardNumber
			);
		case 'owner-asc':
			return cards.sort((a, b) =>
				!(a.username && b.username)
					? 0
					: a.username.localeCompare(b.username) ||
					  a.cardName.localeCompare(b.cardName) ||
					  +a.cardNumber - +b.cardNumber
			);
		case 'owner-desc':
			return cards.sort((a, b) =>
				!(a.username && b.username)
					? 0
					: b.username.localeCompare(a.username) ||
					  a.cardName.localeCompare(b.cardName) ||
					  +a.cardNumber - +b.cardNumber
			);
		default:
			return cards;
	}
}

function rarestCardSort(a: CardType, b: CardType, rarityRanking?: RarityRankingRecord) {
	if (rarityRanking) {
		const aRank = rarityRanking[a.rarityId]?.ranking ?? Infinity;
		const bRank = rarityRanking[b.rarityId]?.ranking ?? Infinity;
		return aRank - bRank;
	}

	if (a.totalOfType !== b.totalOfType) {
		return a.totalOfType - b.totalOfType;
	}

	if (a.rarityId === LEGACY_CARD_ID && b.rarityId !== LEGACY_CARD_ID) {
		return -1;
	} else if (b.rarityId === LEGACY_CARD_ID && a.rarityId !== LEGACY_CARD_ID) {
		return 1;
	}
	if (a.rarityId === FULL_ART_ID && b.rarityId !== FULL_ART_ID) {
		return -1;
	} else if (b.rarityId === FULL_ART_ID && a.rarityId !== FULL_ART_ID) {
		return 1;
	}

	return a.cardName.localeCompare(b.cardName) || +a.cardNumber - +b.cardNumber;
}
