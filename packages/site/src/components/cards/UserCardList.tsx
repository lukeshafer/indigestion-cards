import { default as CardList, filterCards, parseUniqueSeasons, type Filters } from './CardList';
import { type SortInfo, getSortInfo } from '@site/lib/client/utils';
import {
	Show,
	Suspense,
	createResource,
	createSignal,
	type Component,
	type Setter,
} from 'solid-js';
import { trpc } from '@site/lib/client/trpc';
import PlaceholderCardList from './PlaceholderCardList';
import { routes } from '@site/constants';
import {
	Card,
	CardDescription,
	CardName,
	CardNumber,
	checkIfCanShowCardText,
	checkIsFullArt,
	checkIsLegacyCard,
	checkIsShitPack,
	formatCardNumber,
	FULL_ART_BACKGROUND_CSS,
	FullAnimatedCardEffect,
	getCardImageUrl,
	getShitStampPath,
	ShitStamp,
} from './Card';
import type { CardInstance } from '@core/types';

export default function UserCardList(props: {
	initialCards: CardInstance[];
	username: string;
	initialFilters: Filters;
	initialCursor?: string;
	pinnedCardId?: string;
}) {
	const [nextCursor, setNextCursor] = createSignal(props.initialCursor ?? null);
	const [sortInfo, setSortInfo] = createSignal<SortInfo>({
		by: 'rarity',
		isReversed: false,
	});
	const [filters, setFilters] = createSignal(props.initialFilters);
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
			<CardList.Menu>
				<CardList.Filter
					params={{
						seasons: parseUniqueSeasons(cardsResource.latest),
						minterId: true,
					}}
					setFilters={setFilters}
					ssrFilters={/*@once*/ props.initialFilters}
				/>
				<div class="ml-auto flex gap-4">
					<CardList.Search setSearchText={setSearchText} />
					<CardList.SortDropdown
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
			</CardList.Menu>
			<Suspense fallback={<PlaceholderCardList />}>
				<CardList.List cards={filteredCards() ?? []} scale={0.8}>
					{(card, index) => <UserCardListItem card={card} lazy={index() > 10} />}
				</CardList.List>
				<Show when={nextCursor() && !searchText()}>
					<CardList.LoadButton
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
					</CardList.LoadButton>
				</Show>
			</Suspense>
		</div>
	);
}

const UserCardListItem: Component<{
	card: CardInstance;
	lazy: boolean;
}> = props => (
	<a
		href={`${routes.USERS}/${props.card.username}/${props.card.instanceId ?? ''}`}
		class="outline-brand-main group">
		<FullAnimatedCardEffect
			glowColor={checkIsFullArt(props.card.rarityId) ? undefined : props.card.rarityColor}>
			<Card
				lazy={props.lazy}
				alt={props.card.cardName}
				imgSrc={getCardImageUrl(props.card)}
				viewTransitionName={`card-${props.card.instanceId}`}
				background={
					checkIsFullArt(props.card.rarityId)
						? FULL_ART_BACKGROUND_CSS
						: props.card.rarityColor
				}>
				<Show when={checkIfCanShowCardText(props.card.rarityId)}>
					<CardName>{props.card.cardName}</CardName>
					<CardDescription>{props.card.cardName}</CardDescription>
				</Show>
				<Show when={!checkIsLegacyCard(props.card.rarityId)}>
					<CardNumber color={checkIsFullArt(props.card.rarityId) ? 'white' : 'black'}>
						{formatCardNumber(props.card)}
					</CardNumber>
				</Show>
				<Show when={checkIsShitPack(props.card.stamps)}>
					<ShitStamp src={getShitStampPath(props.card.rarityId)} />
				</Show>
			</Card>
		</FullAnimatedCardEffect>
	</a>
);

async function queryCards(opts: {
	sortInfo: SortInfo;
	username: string;
	cursor?: string;
	pinnedCardId?: string;
	setNextCursor: Setter<string | null>;
	searchText: string;
}): Promise<Array<CardInstance>> {
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
