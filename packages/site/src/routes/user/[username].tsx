import type { User } from '@lil-indigestion-cards/core/db/users';
import type { TwitchUser } from '@lil-indigestion-cards/core/lib/twitch';

import { transitionname } from '@/lib/client/utils';

import UserLookingFor from '@/components/user/UserLookingFor';
import Card from '@/components/cards/Card';
import type { SiteConfig } from '@lil-indigestion-cards/core/db/siteConfig';
import type { RarityRankingRecord } from '@lil-indigestion-cards/core/lib/site-config';
import { Anchor, Heading } from '@/components/text';
import { routeNames, routes } from '@/constants';
import type { CardInstance } from '@lil-indigestion-cards/core/db/cardInstances';
import { Show } from 'solid-js';
import CardList from '@/components/cards/CardList';
import { createQuery } from '@tanstack/solid-query';
import type { RouteComponent, RouteOptions } from '@/router';
import { trpc } from '@/trpc/client';
import { useConfig } from '@/lib/client/context';

// @ts-expect-error -- just calling for typescript
() => void transitionname({}, '');

type RouteData = {
	twitchData?: TwitchUser;
	user: User;
	cards: Array<CardInstance>;
	siteConfig: SiteConfig;
	rarityRanking: RarityRankingRecord;
};

export const route = {
	path: '/user/:username',
  title: data => data?.user?.username,
  breadcrumbs: data => [{ label: routeNames.USER, href: routes.USERS }, { label: data?.user?.username }],
	load(args, ssrData) {
		const twitchData = createQuery(() => ({
			queryKey: ['twitchData', args.params.username],
			queryFn: () => trpc.twitch.userByLogin.query({ login: args.params.username }),
			initialData: ssrData?.twitchData,
		}));

		const user = createQuery(() => ({
			queryKey: ['user', args.params.username],
			queryFn: () => trpc.users.byUsernameWithCards.query({ username: args.params.username }),
			initialData: { users: [ssrData?.user], cardInstances: ssrData?.cards },
		}));

		const siteConfig = createQuery(() => ({
			queryKey: ['siteConfig'],
			queryFn: () => trpc.siteConfig.query(),
			initialData: ssrData?.siteConfig,
		}));

		const rarityRanking = createQuery(() => ({
			queryKey: ['rarityRanking'],
			queryFn: () => trpc.rarityRanking.query(),
			initialData: ssrData?.rarityRanking,
		}));

		return {
			get twitchData() {
				return twitchData.data;
			},
			get user() {
				return user.data?.users[0];
			},
			get cards() {
				return user.data?.cardInstances;
			},
			get siteConfig() {
				return siteConfig.data;
			},
			get rarityRanking() {
				return rarityRanking.data;
			},
		};
	},
} satisfies RouteOptions<RouteData>;

export default (function UserPage(props) {
	const unpinnedCards = () =>
		props.data?.cards.filter(
			card => card.instanceId !== props.data?.user.pinnedCard?.instanceId
		);
	const globalConfig = useConfig();

	const isLoggedInUser = () =>
		globalConfig.session?.properties.username !== undefined &&
		globalConfig.session?.properties.username === props.data?.user.username;

	return (
		<Show when={props.data?.user}>
			{user => (
				<>
					<header class="flex flex-col gap-4 gap-x-8 p-4 sm:flex-row">
						<img
							src={props.data?.twitchData?.profile_image_url}
							width="150"
							height="150"
							class="col-start-1 row-span-full h-fit rounded-full"
						/>
						<section class="mt-4 flex flex-col">
							<h1
								class="font-display my-2 text-4xl font-bold italic text-gray-600 dark:text-gray-200"
								style={{ 'view-transition-name': `${user().username}-username` }}>
								{user().username}
							</h1>
							<ul>
								<li>
									<UserLookingFor
										user={user()}
										isLoggedInUser={isLoggedInUser()}
									/>
								</li>
								{isLoggedInUser() ||
								!props.data?.siteConfig.tradingIsEnabled ? null : (
									<li>
										<Anchor
											href={`${routes.TRADES}/new?receiverUsername=${user().username}`}>
											New Trade
										</Anchor>
									</li>
								)}
							</ul>
						</section>
						<Show when={user().pinnedCard?.instanceId}>
							<div class="ml-auto">
								<p class="text-center font-semibold uppercase text-gray-400">
									Pinned
								</p>
								<a
									use:transitionname={
										user().pinnedCard?.designId === 'lilindheart'
											? 'lilindheart-hero-card'
											: user().pinnedCard?.designId === 'lilindcult'
												? 'lilindcult-hero-card'
												: user().pinnedCard?.designId === 'ryan-of-the-wild'
													? 'ryan-of-the-wild-hero-card'
													: undefined
									}
									href={`${routes.USERS}/${user().username}/${user().pinnedCard?.instanceId}`}>
									<Card {...user().pinnedCard!} scale="var(--card-scale)" />
								</a>
							</div>
						</Show>
					</header>
					<section class="my-4 grid gap-4 text-center">
						<Heading>Cards</Heading>
						<Show when={unpinnedCards()}>
							{unpinnedCards => (
								<CardList
									cards={unpinnedCards()}
									rarityRanking={props.data?.rarityRanking}
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
							)}
						</Show>
					</section>
				</>
			)}
		</Show>
	);
} satisfies RouteComponent<RouteData>);
