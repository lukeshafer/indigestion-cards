import type { Preorder, User } from '@core/types';
import { For, Show, type Component } from 'solid-js';
import { CardEls, FULL_ART_BACKGROUND_CSS, cardUtils } from '../cards/Card';
import type { TwitchUser } from '@core/lib/twitch';
import { routes } from '@site/constants';

export const UsersList: Component<{
	users: Array<{
		user: User;
		twitch?: TwitchUser | null | undefined;
		preorders: Array<Preorder>;
	}>;
}> = props => {
	return (
		<ul class="flex w-full flex-wrap justify-center gap-4">
			<For each={props.users}>
				{(userData, index) => (
					<li class="w-fit">
						<UsersListLink {...userData} lazy={index() > 8} />
					</li>
				)}
			</For>
		</ul>
	);
};

const UsersListLink: Component<{
	user: User;
	twitch?: TwitchUser | null | undefined;
	preorders: Array<Preorder>;
	lazy: boolean;
}> = props => {
	const packCount = () => props.user.packCount + props.preorders.length;

	return (
		<a
			class="groupuser relative grid items-end border border-gray-900"
			data-user
			href={`${routes.USERS}/${props.user.username}`}>
			<div class="flex w-full justify-center">
				<Show when={props.user.pinnedCard} fallback={<EmptyPinnedCard />}>
					{pinnedCard => (
						<PinnedCard
							card={pinnedCard()}
							username={props.user.username}
							lazy={props.lazy}
						/>
					)}
				</Show>
			</div>
			<div
				class="absolute bottom-0 left-0 right-0 flex h-28 items-center gap-4 bg-gray-900 px-3 py-4 transition-transform"
				classList={
					{
						//'group-[user]:group-hover:translate-y-full group-[user]:group-focus:translate-y-full':
						//	props.user.pinnedCard != undefined,
					}
				}>
				<img
					loading={props.lazy ? 'lazy' : undefined}
					alt={`${props.user.username}'s profile picture`}
					src={props.twitch?.profile_image_url}
					style={{ 'view-transition-name': `profile-pic-${props.user.username}` }}
					width="60"
					height="60"
					class="h-fit rounded-full"
				/>
				<div>
					<h2 class="font-display pt-1 text-lg italic transition-all w-fit relative">
						{props.user.username}
						<div class="border-t-2 border-t-[inherit] absolute bottom-1 group-[user]:group-hover:w-full w-0 transition-all"></div>
					</h2>
					<p>{props.user.cardCount} cards</p>
					<Show when={packCount() > 0}>
						<p>
							{packCount()} unopened {packCount() > 1 ? 'packs' : 'pack'}
						</p>
					</Show>
				</div>
			</div>
		</a>
	);
};

const EmptyPinnedCard: Component = () => (
	<CardEls.Card
		lazy={false}
		alt=""
		imgSrc=""
		viewTransitionName={undefined}
		background={undefined}>
		<div class="flex h-full w-full items-center justify-center font-bold opacity-50">
			No card pinned
		</div>
	</CardEls.Card>
);

const PinnedCard: Component<{
	card: NonNullable<User['pinnedCard']>;
	username: string;
	lazy: boolean;
}> = props => {
	return (
		<div class="group relative">
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
					<CardEls.CardDescription>{props.card.cardName}</CardEls.CardDescription>
				</Show>
				<Show when={!cardUtils.checkIsLegacyCard(props.card.rarityId)}>
					<CardEls.CardNumber
						color={cardUtils.checkIsFullArt(props.card.rarityId) ? 'white' : 'black'}>
						{cardUtils.formatCardNumber(props.card)}
					</CardEls.CardNumber>
				</Show>
				<Show when={cardUtils.checkIsShitPack(props.card.stamps)}>
					<CardEls.ShitStamp src={cardUtils.getShitStampPath(props.card.rarityId)} />
				</Show>
			</CardEls.Card>
			<CardEls.ShineMouseEffect />
		</div>
	);
};
