import { getSortInfo, type SortInfo } from '@site/client/card-sort';
import {
	Show,
	Suspense,
	createResource,
	createSignal,
	type Component,
	type Setter,
} from 'solid-js';
import { trpc } from '@site/client/api';
import CardList, {
	type Filters,
	PlaceholderCardList,
	filterCards,
} from '@site/components/CardList';
import { routes } from '@site/constants';
import { CardEls, cardUtils, FULL_ART_BACKGROUND_CSS } from '@site/components/Card';
import type { CardDesign, CardInstance } from '@core/types';

export const DesignInstancesCardList: Component<{
	initialCards: CardInstance[];
	designId: string;
	initialFilters: Filters;
	initialCursor?: string;
}> = props => {
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
			<CardList.Menu>
				<CardList.Search setSearchText={setSearchText} />
				<CardList.SortDropdown
					sortTypes={[
						'rarest',
						'common',
						'open-date-asc',
						'open-date-desc',
						'owner-asc',
						'owner-desc',
					]}
					setSort={sortType => setSortInfo(getSortInfo(sortType))}
				/>
				<CardList.Filter
					params={{ minterId: true }}
					setFilters={setFilters}
					ssrFilters={/*@once*/ props.initialFilters}
				/>
			</CardList.Menu>
			<Suspense fallback={<PlaceholderCardList scale={0.8} />}>
				<CardList.List cards={filteredCards() ?? []} scale={0.8}>
					{(card, index) => (
						<DesignInstancesCardListItem lazy={index() > 5} card={card} />
					)}
				</CardList.List>
				<Show when={nextCursor() && !searchText()}>
					<CardList.LoadButton
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
					</CardList.LoadButton>
				</Show>
			</Suspense>
		</div>
	);
};

const DesignInstancesCardListItem: Component<{
	card: CardInstance;
	lazy: boolean;
}> = props => (
	<div class="w-min">
		<a
			href={`${routes.INSTANCES}/${props.card.designId}/${props.card.instanceId}`}
			class="outline-brand-main group inline-block transition-transform hover:-translate-y-2">
			<CardEls.FullAnimatedCardEffect glowColor={props.card.rarityColor} disableTiltOnTouch>
				<CardEls.Card
					lazy={props.lazy}
					alt={props.card.cardName}
					imgSrc={cardUtils.getCardImageUrl(props.card)}
					viewTransitionName={`card-${props.card.instanceId}`}
					background={
						cardUtils.checkIsFullArt(props.card.rarityId)
							? FULL_ART_BACKGROUND_CSS
							: props.card.rarityColor
					}>
					<Show when={cardUtils.checkIfCanShowCardText(props.card.rarityId)}>
						<CardEls.CardName>{props.card.cardName}</CardEls.CardName>
						<CardEls.CardDescription>
							{props.card.cardDescription}
						</CardEls.CardDescription>
					</Show>
					<Show when={!cardUtils.checkIsLegacyCard(props.card.rarityId)}>
						<CardEls.CardNumber
							color={
								cardUtils.checkIsFullArt(props.card.rarityId) ? 'white' : 'black'
							}>
							{cardUtils.formatCardNumber(props.card)}
						</CardEls.CardNumber>
					</Show>
					<Show when={cardUtils.checkIsShitPack(props.card.stamps)}>
						<CardEls.ShitStamp src={cardUtils.getShitStampPath(props.card.rarityId)} />
					</Show>
				</CardEls.Card>
			</CardEls.FullAnimatedCardEffect>
		</a>
		<p class="mt-2">
			Owner:{' '}
			<a
				href={`${routes.USERS}/${props.card.username}`}
				class="inline font-bold hover:underline">
				{props.card.username}
			</a>
		</p>
	</div>
);

async function queryCards(opts: {
	sortInfo: SortInfo;
	designId: string;
	cursor?: string;
	setNextCursor: Setter<string | null>;
	searchText: string;
}): Promise<Array<CardInstance>> {
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

export const DesignHeaderCard: Component<{
	design: CardDesign;
}> = props => {
	const rarityId = () => props.design.bestRarityFound?.rarityId ?? '';

	return (
		<CardEls.TiltEffectWrapper>
			<CardEls.Card
				lazy={false}
				alt={props.design.cardName}
				viewTransitionName={`design-${props.design.designId}`}
				imgSrc={cardUtils.getCardImageUrl({
					designId: props.design.designId,
					rarityId: rarityId(),
				})}
				background={
					cardUtils.checkIsFullArt(rarityId())
						? FULL_ART_BACKGROUND_CSS
						: props.design.bestRarityFound?.rarityColor
				}>
				<Show when={cardUtils.checkIfCanShowCardText(rarityId())}>
					<CardEls.CardName>{props.design.cardName}</CardEls.CardName>
					<CardEls.CardDescription>
						{props.design.cardDescription}
					</CardEls.CardDescription>
				</Show>
			</CardEls.Card>
			<CardEls.ShineMouseEffect />
		</CardEls.TiltEffectWrapper>
	);
};
