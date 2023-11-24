import CardList from '~/components/cards/CardList';
import { PageHeader, PageTitle } from '~/components/text';
import { getAllCardDesigns } from '../../../../core/src/lib/design';
import server$ from 'solid-start/server';
import { NO_CARDS_OPENED_ID } from '~/lib/constants';
import { Show, Suspense } from 'solid-js';
import { createQuery } from '@tanstack/solid-query';

export default function Cards() {
	const state = createQuery(() => ({
		queryKey: ['cards'],
		queryFn: server$(() => getAllCardDesigns()),
	}));

	return (
		<>
			<PageHeader>
				<PageTitle>All Cards</PageTitle>
				{
					//<AdminOnly>
					//<Anchor href={routes.ADMIN.CREATE.CARD_DESIGN}>Add New Card</Anchor>
					//</AdminOnly>
				}
			</PageHeader>
			<Suspense fallback={'loading...'}>
				<Show when={state.data}>
					<CardList
						cards={state.data!.map((card, index) => {
							const rarity = card.bestRarityFound;

							if (
								rarity?.rarityId === NO_CARDS_OPENED_ID
								//&& Astro.locals.session?.type !== 'admin'
							) {
								return {
									...rarity,
									...card,
									cardName: 'zzz' + index,
									artist: '?????',
									designId: 'zzz' + index,
									seasonId: '',
									seasonName: '',
									imgUrl: '',
									cardNumber: 1,
									totalOfType: rarity.count,
								};
							}

							return {
								...card,
								rarityName: rarity?.rarityName ?? '',
								rarityId: rarity?.rarityId ?? '',
								frameUrl: rarity?.frameUrl ?? '',
								rarityColor: rarity?.rarityColor ?? '',
								totalOfType: rarity?.count ?? 1,
								cardNumber: 1,
							};
						})}
						sortOnlyBy={['card-name-asc', 'card-name-desc']}
						//sessionType={Astro.locals.session?.type}
					/>
				</Show>
			</Suspense>
		</>
	);
}
