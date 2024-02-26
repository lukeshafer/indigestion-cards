import CardList from '@/components/cards/CardList';
import { PageHeader, PageTitle } from '@/components/text';
import { routeNames } from '@/constants';
import type { RouteOptions, RouteComponent } from '@/router';
import { trpc } from '@/trpc/client';
import type { CardDesign } from '@lil-indigestion-cards/core/db/cardDesigns';
import { createQuery } from '@tanstack/solid-query';
import { Show } from 'solid-js';

type RouteData = {
	designs: Array<CardDesign>;
};

export const route = {
	path: '/card',
  title: () => 'All Cards',
  breadcrumbs: () => [{ label: routeNames.CARDS }],
	load: (_, ssrData) => {
		const designs = createQuery(() => ({
			queryKey: ['designs'],
			queryFn: () => trpc.designs.all.query(),
			initialData: ssrData?.designs,
		}));

		return {
			get designs() {
				return designs.data;
			},
		};
	},
} satisfies RouteOptions<RouteData>;

export default (function CardsPage(props) {
	return (
		<>
			<PageHeader>
				<PageTitle>All Cards</PageTitle>
			</PageHeader>
			<Show when={props.data?.designs}>
				{designs => (
					<CardList
						filters={[...new URLSearchParams(props.location.search).entries()]}
						cards={designs().map(card => {
							const bestRarity = card.bestRarityFound;

							return {
								...card,
								rarityName: bestRarity?.rarityName ?? '',
								rarityId: bestRarity?.rarityId ?? '',
								frameUrl: bestRarity?.frameUrl ?? '',
								rarityColor: bestRarity?.rarityColor ?? '',
								totalOfType: bestRarity?.count ?? 1,
								cardNumber: 1,
							};
						})}
						sortOnlyBy={['card-name-asc', 'card-name-desc']}
					/>
				)}
			</Show>
		</>
	);
} satisfies RouteComponent<RouteData>);
