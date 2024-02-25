import CardList from '@/components/cards/CardList';
import { PageHeader, PageTitle } from '@/components/text';
import { client, createRouteOptions } from '@/data/data.client';
import { createQuery } from '@tanstack/solid-query';
import { Show } from 'solid-js';

export const route = createRouteOptions({
	path: '/card',
	data: ['designs'],
	load: (_, ssrData) => {
		const designs = createQuery(() => ({
			queryKey: ['designs'],
			queryFn: () => client.get('designs'),
			initialData: ssrData?.designs,
		}));

		return {
			get designs() {
				return designs.data;
			},
		};
	},
});

export default route.createRoute(props => {
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
});
