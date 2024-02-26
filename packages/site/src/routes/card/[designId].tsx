import Card from '@/components/cards/Card';
import CardList from '@/components/cards/CardList';
import { Heading, PageTitle } from '@/components/text';
import { ASSETS, LEGACY_CARD_ID, routeNames, routes } from '@/constants';
import type { CardDesign } from '@lil-indigestion-cards/core/db/cardDesigns';
import type { CardInstance } from '@lil-indigestion-cards/core/db/cardInstances';
import type { SiteConfig } from '@lil-indigestion-cards/core/db/siteConfig';
import type { RarityRankingRecord } from '@lil-indigestion-cards/core/lib/site-config';
import { createQuery } from '@tanstack/solid-query';
import { Show } from 'solid-js';
import type { RouteOptions, RouteComponent } from '@/router';
import { trpc } from '@/trpc/client';

type RouteData = {
	card: {
		design: CardDesign;
		instances: Array<CardInstance>;
	};
	siteConfig: SiteConfig;
	rarityRanking: RarityRankingRecord;
};

export const route = {
	path: '/card/:designId',
	title: data => `${data.card.design.cardName} - ${data.card.design.seasonName}`,
  breadcrumbs: data => [
						{ label: routeNames.CARDS, href: routes.DESIGNS },
						{ label: data.card?.design.cardName ?? '' },
  ],
	load(args, ssrData) {
		const card = createQuery(() => ({
			queryKey: ['card', args.params.designId],
			queryFn: () => trpc.designs.byIdWithInstances.query({ designId: args.params.designId }),
			initialData: ssrData?.card,
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
			get card() {
				return card.data;
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

export default (function CardDesignPage(props) {
	const baseRarity = () =>
		props.data?.card?.design.bestRarityFound ||
		props.data?.card?.design.rarityDetails?.find(r => r.rarityId === LEGACY_CARD_ID) ||
		props.data?.siteConfig?.baseRarity || {
			rarityId: 'default',
			rarityName: 'Default',
			frameUrl: ASSETS.CARDS.DEFAULT_BASE_RARITY,
			rarityColor: '#fff',
		};

	return (
		<Show when={props.data?.card}>
			{card => (
				<>
					<header class="flex flex-col items-center gap-4">
						<PageTitle>{card().design.cardName}</PageTitle>
						<Card {...card().design} {...baseRarity()} cardNumber={1} totalOfType={1} />
						<section class="mx-auto text-lg">
							<p>
								<b>Season: </b>
								{card().design.seasonName}
							</p>
							<p>
								<b>Artist: </b>
								{card().design.artist}
							</p>
						</section>
					</header>
					<section class="flex flex-col text-center">
						<Heading>Cards Opened</Heading>
						<CardList
							cards={card().instances}
							showUsernames
							sortOnlyBy={[
								'rarest',
								'common',
								'owner-asc',
								'owner-desc',
								'open-date-desc',
								'open-date-asc',
							]}
							rarityRanking={props.data?.rarityRanking}
						/>
					</section>
				</>
			)}
		</Show>
	);
} satisfies RouteComponent<RouteData>);
