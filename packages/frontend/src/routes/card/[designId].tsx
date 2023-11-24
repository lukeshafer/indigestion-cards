import { useParams } from 'solid-start';
import Card from '~/components/cards/Card';
import { Heading, PageTitle } from '~/components/text';
import { getCardDesignAndInstancesById } from '../../../../core/src/lib/design';
import { getRarityRanking, getSiteConfig } from '../../../../core/src/lib/site-config';
import { getBaseRarity } from '../../../../core/src/lib/rarity';
import { createQuery } from '@tanstack/solid-query';
import { Show } from 'solid-js';
import CardList from '~/components/cards/CardList';
import server$ from 'solid-start/server';

export default function DesignPage() {
	const params = useParams();
	const state = createQuery(() => ({
		queryKey: ['cards', params.designId],
		queryFn: () =>
			server$(async (designId: string) => {
				const {
					cardDesigns: [design],
					cardInstances: instances,
				} = await getCardDesignAndInstancesById({ designId });

				const siteConfig = await getSiteConfig();
				const rarityRanking = getRarityRanking(siteConfig);
				const baseRarity = getBaseRarity({ design, siteConfig });

				instances.sort((a, b) =>
					+a.totalOfType === +b.totalOfType
						? a.designId !== b.designId
							? a.designId.localeCompare(b.designId)
							: +a.cardNumber - +b.cardNumber
						: +a.totalOfType - +b.totalOfType
				);

				const openedInstances = instances.filter((instance) => instance.openedAt);

				return {
					design,
					instances,
					rarityRanking,
					baseRarity,
					openedInstances,
				};
			})(params.designId),
	}));

	return (
		<Show when={state.data}>
			{(data) => (
				<>
					<header class="flex flex-col items-center gap-4">
						<PageTitle>{data().design.cardName}</PageTitle>
						<Card
							{...data().design}
							{...data().baseRarity}
							cardNumber={1}
							totalOfType={1}
						/>
						<section class="mx-auto text-lg">
							<p>
								<b>Season: </b>
								{data().design.seasonName}
							</p>
							<p>
								<b>Artist: </b>
								{data().design.artist}
							</p>
						</section>
						{
							//<AdminOnly>
							//<EditDesignForm {...design} client:load />
							//</AdminOnly>
						}
					</header>
					<section class="flex flex-col text-center">
						<Heading>Cards Opened</Heading>
						<CardList
							cards={data().openedInstances}
							showUsernames
							sortOnlyBy={['rarest', 'common', 'owner-asc', 'owner-desc']}
							rarityRanking={data().rarityRanking}
						/>
					</section>
					{
						//<AdminOnly>
						//<details>
						//<summary class="font-heading text-xl">Stats for Admins</summary>
						//<p class="font-bold text-red-600">
						//This section is only visible to admins: not for stream!
						//</p>
						//<div class="my-4 flex flex-col gap-8">
						//<section class="grid text-lg">
						//<Heading>Stats Overview</Heading>
						//<DesignOverviewTable {rarityStatsArray} client:load />
						//</section>
						//<AdminDesignStats {rarityStatsArray} client:load />
						//</div>
						//</details>
						//<DeleteDesignButton {...design} client:load />
						//</AdminOnly>
					}
				</>
			)}
		</Show>
	);
}
