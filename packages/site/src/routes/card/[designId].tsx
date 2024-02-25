import Card from '@/components/cards/Card';
import CardList from '@/components/cards/CardList';
import { Heading, PageTitle } from '@/components/text';
import { ASSETS, LEGACY_CARD_ID } from '@/constants';
import { client, createData } from '@/data/data.client';
import { Show } from 'solid-js';

export default client.defineRoute(
  '/card/:designId',
  ['card', 'siteConfig', 'rarityRanking'],
  (props) => {
    console.log(props.data?.card)
    const card = createData('card', props);
    const rarityRanking = createData('rarityRanking', props);
    const siteConfig = createData('siteConfig', props);

    const baseRarity = () =>
      card()?.design.bestRarityFound ||
      card()?.design.rarityDetails?.find(r => r.rarityId === LEGACY_CARD_ID) ||
      siteConfig()?.baseRarity || {
        rarityId: 'default',
        rarityName: 'Default',
        frameUrl: ASSETS.CARDS.DEFAULT_BASE_RARITY,
        rarityColor: '#fff',
      };

    return (
      <Show when={card()}>
        {(card) =>
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
              rarityRanking={rarityRanking()}
            />
          </section>
        </>
      }
      </Show>
    );
  }
);
