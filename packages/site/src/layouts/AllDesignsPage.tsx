import * as List from '@site/components/CardList';
import * as Solid from 'solid-js';
import * as Card from '@site/components/Card';
import type { RarityRankingRecord } from '@core/lib/site-config';
import type { AllDesignsPageData } from '@core/lib/design';
import { routes } from '@site/constants';

export const AllDesignsCardList: Solid.Component<{
	initialCards: AllDesignsPageData;
	rarityRanking?: RarityRankingRecord;
	initialFilters: List.Filters;
}> = props => {
	const [cards, state] = List.createCardList(() => props.initialCards, {
		default: { sortType: 'card-name-asc', filters: props.initialFilters },
	});

	const seasons = () => List.parseUniqueSeasons(props.initialCards);

	return (
		<div>
			<List.CardListMenu>
				<List.CardListSearch setSearchText={state.setSearchText} />
				<List.CardListSortDropdown
					sortTypes={['card-name-asc', 'card-name-desc', 'rarest', 'common']}
					setSort={state.setSortType}
					default="card-name-asc"
				/>
				<List.CardListFilter
					params={{ seasons: seasons() }}
					setFilters={state.setFilters}
					ssrFilters={props.initialFilters}
				/>
			</List.CardListMenu>
			<List.CardList cards={cards()}>
				{(card, index) => <AllDesignsCardListItem card={card} lazy={index() > 5} />}
			</List.CardList>
		</div>
	);
};

const AllDesignsCardListItem: Solid.Component<{
	card: AllDesignsPageData[number];
	lazy: boolean;
}> = props => {
	const rarityId = () => props.card.rarityId;
	const background = () =>
		Card.checkIsFullArt(rarityId()) ? Card.FULL_ART_BACKGROUND_CSS : props.card.rarityColor;

	const card = (
		<Card.FullAnimatedCardEffect
			glowColor={Card.checkIsFullArt(rarityId()) ? undefined : background()}
			disableTiltOnTouch>
			<Card.Card
				lazy={props.lazy}
				scale="var(--card-scale)"
				alt={props.card.cardName}
				viewTransitionName={`design-${props.card.designId}`}
				imgSrc={Card.getCardImageUrl({
					designId: props.card.designId,
					rarityId: rarityId(),
				})}
				background={background()}>
				<Solid.Show when={Card.checkIfCanShowCardText(rarityId())}>
					<Card.CardName>{props.card.cardName}</Card.CardName>
					<Card.CardDescription>{props.card.cardDescription}</Card.CardDescription>
				</Solid.Show>
			</Card.Card>
		</Card.FullAnimatedCardEffect>
	);

	return (
		<Solid.Show when={!Card.checkIsSecret(rarityId())} fallback={card}>
			<Card.CardLinkWrapper href={`${routes.INSTANCES}/${props.card.designId}`}>
				{card}
			</Card.CardLinkWrapper>
		</Solid.Show>
	);
};
