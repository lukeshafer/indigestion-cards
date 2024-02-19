import CardList from '../cards/CardList';
import { PageTitle, PageHeader } from '@/components/text';
import { Show } from 'solid-js';
import { fetchAllDesigns } from '@/client/data';

export default function AllCardsPage() {
	const designs = fetchAllDesigns();

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
