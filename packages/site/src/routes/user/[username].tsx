import type { User } from '@lil-indigestion-cards/core/db/users';
import type { TwitchUser } from '@lil-indigestion-cards/core/lib/twitch';

import { transitionname } from '@/lib/client/utils';

import UserLookingFor from '@/components/user/UserLookingFor';
import Card from '@/components/cards/Card';
import type { SiteConfig } from '@lil-indigestion-cards/core/db/siteConfig';
import type { RarityRankingRecord } from '@lil-indigestion-cards/core/lib/site-config';
import { Anchor, Heading } from '@/components/text';
import { routes } from '@/constants';
import type { CardInstance } from '@lil-indigestion-cards/core/db/cardInstances';
import { Show } from 'solid-js';
import CardList from '@/components/cards/CardList';

// @ts-expect-error -- just calling for typescript
() => void transitionname({}, '');

export default function UserPage(props: {
	data: {
		twitchData?: TwitchUser;
		user: User;
		cards: Array<CardInstance>;
		isLoggedInUser: boolean;
		siteConfig: SiteConfig;
    rarityRanking: RarityRankingRecord;
	};
}) {
	const unpinnedCards = () =>
		props.data.cards.filter(card => card.instanceId !== props.data.user.pinnedCard?.instanceId);

	return (
		<>
			<header class="flex flex-col gap-4 gap-x-8 p-4 sm:flex-row">
				<img
					src={props.data.twitchData?.profile_image_url}
					width="150"
					height="150"
					class="col-start-1 row-span-full h-fit rounded-full"
				/>
				<section class="mt-4 flex flex-col">
					<h1
						class="font-display my-2 text-4xl font-bold italic text-gray-600 dark:text-gray-200"
						style={{ 'view-transition-name': `${props.data.user.username}-username` }}>
						{props.data.user.username}
					</h1>
					<ul>
						<li>
							<UserLookingFor
								user={props.data.user}
								isLoggedInUser={props.data.isLoggedInUser}
							/>
						</li>
						{props.data.isLoggedInUser ||
						!props.data.siteConfig.tradingIsEnabled ? null : (
							<li>
								<Anchor
									href={`${routes.TRADES}/new?receiverUsername=${props.data.user.username}`}>
									New Trade
								</Anchor>
							</li>
						)}
					</ul>
				</section>
				<Show when={props.data.user.pinnedCard?.instanceId}>
						<div class="ml-auto">
							<p class="text-center font-semibold uppercase text-gray-400">Pinned</p>
							<a
								use:transitionname={
									props.data.user.pinnedCard?.designId === 'lilindheart'
										? 'lilindheart-hero-card'
										: props.data.user.pinnedCard?.designId === 'lilindcult'
											? 'lilindcult-hero-card'
											: props.data.user.pinnedCard?.designId === 'ryan-of-the-wild'
												? 'ryan-of-the-wild-hero-card'
												: undefined
								}
								href={`${routes.USERS}/${props.data.user.username}/${props.data.user.pinnedCard?.instanceId}`}>
								<Card {...props.data.user.pinnedCard!} scale="var(--card-scale)"  />
							</a>
						</div>
				</Show>
			</header>
			<section class="my-4 grid gap-4 text-center">
				<Heading>Cards</Heading>
				<CardList
					cards={unpinnedCards()}
					rarityRanking={props.data.rarityRanking}
					isUserPage
					sortOnlyBy={[
						'rarest',
						'common',
						'card-name-asc',
						'card-name-desc',
						'open-date-asc',
						'open-date-desc',
					]}
				/>
			</section>
		</>
	);
}
