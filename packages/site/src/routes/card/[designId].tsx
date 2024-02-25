import Card from '@/components/cards/Card';
import CardList from '@/components/cards/CardList';
import { Heading, PageTitle } from '@/components/text';
import { ASSETS, LEGACY_CARD_ID } from '@/constants';
import { client, createRouteOptions } from '@/data/data.client';
import { createQuery } from '@tanstack/solid-query';
import { Show } from 'solid-js';

export const route = createRouteOptions( {
  path: '/card/:designId',
  data: ['card', 'siteConfig', 'rarityRanking'],
  load(args, ssrData) {
    const card = createQuery(() => ({
      queryKey: ['card', args.params.designId],
      queryFn: () => client.get('card', { designId: args.params.designId }),
      initialData: ssrData?.card
    }))

    const siteConfig = createQuery(() => ({
      queryKey: ['siteConfig'],
      queryFn: () => client.get('siteConfig'),
      initialData: ssrData?.siteConfig
    }))

    const rarityRanking = createQuery(() => ({
      queryKey: ['rarityRanking'],
      queryFn: () => client.get('rarityRanking'),
      initialData: ssrData?.rarityRanking
    }))

    return {
      get card() {
        return card.data
      },
      get siteConfig() {
        return siteConfig.data
      },
      get rarityRanking() {
        return rarityRanking.data
      }
    }
  }
})

export default route.createRoute(
	props => {
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
							<Card
								{...card().design}
								{...baseRarity()}
								cardNumber={1}
								totalOfType={1}
							/>
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
	}
);
