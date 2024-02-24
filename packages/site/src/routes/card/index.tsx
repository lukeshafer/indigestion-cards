import CardList from '@/components/cards/CardList';
import { PageHeader, PageTitle } from '@/components/text';
import type { CardDesign } from '@lil-indigestion-cards/core/db/cardDesigns';

export default function CardPage(props: {
	filters: Array<[string, string]>;
	data: {
		designs: Array<CardDesign>;
	};
}) {
	return (
		<>
			<PageHeader>
				<PageTitle>All Cards</PageTitle>
			</PageHeader>
			<CardList
				filters={props.filters}
				cards={props.data.designs.map(card => {
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
		</>
	);
}
