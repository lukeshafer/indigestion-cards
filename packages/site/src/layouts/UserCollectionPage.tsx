import type { TwitchUser } from '@core/lib/twitch';
import type { CardInstance, Collection, User } from '@core/types';
import { PageTitle } from '@site/components/text';
import { Show, type Component } from 'solid-js';
import CardList from '@site/components/CardList';
import { CardEls, cardUtils, FULL_ART_BACKGROUND_CSS } from '@site/components/Card';
import { routes } from '@site/constants';
import { DeleteButton } from '@site/components/Form';
import { trpc } from '@site/client/api';
import { formatCollectionViewTransitionId } from '@site/components/Collections';

const IMG_SIZE = 60;
export const UserCollectionPage: Component<{
	user: User;
	twitchData: TwitchUser | null;
	isLoggedInUser: boolean;
	cards: Array<CardInstance>;
	collection: Collection;
}> = props => {
	return (
		<div class="grid-cols-[1fr_50rem_1fr] md:grid">
			<section class="flex items-center gap-4 self-start">
				<img
					alt={`${props.user.username}'s profile image`}
					style={{ 'view-transition-name': `${props.user.userId}-user-profile-image` }}
					src={props.twitchData?.profile_image_url}
					width={IMG_SIZE}
					height={IMG_SIZE}
					class="rounded-full"
				/>
				<div>
					<h2 class="font-display text-xl italic">{props.user.username}</h2>
					<p class="font-display text-brand-main -mt-2">collections</p>
				</div>
			</section>
			<section class="">
				<header class="my-6 text-center">
					<PageTitle>{props.collection.collectionName}</PageTitle>
					<Show when={props.isLoggedInUser}>
						<DeleteButton
							onClick={() => {
								const username = props.user.username;
								const collection = props.collection;

								trpc.collections.delete
									.mutate({ collectionId: collection.collectionId })
									.catch(error => console.error(error))
									.then(() =>
										location.assign(
											`${routes.USERS}/${username}?alert=Successfully%20deleted%20collection%20"${encodeURIComponent(collection.collectionName)}"`
										)
									);
							}}
							confirm="Are you sure you want to delete this collection? You will not lose any cards, but you will not be able to recover the collection without re-creating it.">
							Delete collection
						</DeleteButton>
					</Show>
				</header>

				<main>
					<CardList.List cards={props.cards} scale={0.8}>
						{(card, index) => (
							<a
								href={`${routes.USERS}/${card.username?.toLowerCase()}/${card.instanceId ?? ''}`}
								class="outline-brand-main group inline-block transition-transform hover:-translate-y-2">
								<CardEls.FullAnimatedCardEffect
									disableTiltOnTouch
									glowColor={
										cardUtils.checkIsFullArt(card.rarityId)
											? undefined
											: card.rarityColor
									}>
									<CardEls.Card
										lazy={index() > 10}
										alt={card.cardName}
										imgSrc={cardUtils.getCardImageUrl(card)}
										viewTransitionName={formatCollectionViewTransitionId({
											cardId: card.instanceId,
											collectionId: props.collection.collectionId,
										})}
										background={
											cardUtils.checkIsFullArt(card.rarityId)
												? FULL_ART_BACKGROUND_CSS
												: card.rarityColor
										}>
										<Show
											when={cardUtils.checkIfCanShowCardText(card.rarityId)}>
											<CardEls.CardName>{card.cardName}</CardEls.CardName>
											<CardEls.CardDescription>
												{card.cardDescription}
											</CardEls.CardDescription>
										</Show>
										<Show when={!cardUtils.checkIsLegacyCard(card.rarityId)}>
											<CardEls.CardNumber
												color={
													cardUtils.checkIsFullArt(card.rarityId)
														? 'white'
														: 'black'
												}>
												{cardUtils.formatCardNumber(card)}
											</CardEls.CardNumber>
										</Show>
										<Show when={cardUtils.checkIsShitPack(card.stamps)}>
											<CardEls.ShitStamp
												src={cardUtils.getShitStampPath(card.rarityId)}
											/>
										</Show>
									</CardEls.Card>
								</CardEls.FullAnimatedCardEffect>
							</a>
						)}
					</CardList.List>
				</main>
			</section>
		</div>
	);
};
