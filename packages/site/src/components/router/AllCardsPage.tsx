import { createQuery } from '@tanstack/solid-query';
import CardList from '../cards/CardList';
import { trpc } from '@/client/trpc';
import { PageTitle, PageHeader } from '@/components/text';
import { Show } from 'solid-js';

export default function AllCardsPage() {
	const designs = createQuery(() => ({
		queryKey: ['card-designs'],
		queryFn: async () => trpc.cardDesigns.getAll.query(),
	}));

	return (
		<>
			<PageHeader>
				<PageTitle>All Cards</PageTitle>
			</PageHeader>
			<Show when={designs.data}>
				{designs => (
					<CardList
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
}
