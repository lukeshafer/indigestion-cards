import CardList from '@/components/cards/CardList';
import { PageHeader, PageTitle } from '@/components/text';
import { client, createData } from '@/data/data.client';
import { Show } from 'solid-js';
//import type { CardDesign } from '@lil-indigestion-cards/core/db/cardDesigns';

export default client.defineRoute(
	'/card',
	['designs'],
	(props) => {
    const designs = createData('designs', props);

    const filters = [ ...new URLSearchParams(props.location.search).entries() ]
		return (
			<>
				<PageHeader>
					<PageTitle>All Cards</PageTitle>
				</PageHeader>
        <Show when={designs()}>
          { designs =>
            <CardList
              filters={filters}
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
          }
        </Show>
			</>
		);
	}
);
