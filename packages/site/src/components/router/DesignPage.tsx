import Card from '@/components/cards/Card';
import CardList from '@/components/cards/CardList';
import { type RouteSectionProps } from '@solidjs/router';
import { Show } from 'solid-js';
import { fetchDesign, fetchRarityRanking } from '@/client/data';
import { Heading, PageTitle } from '../text';
import { getBestRarityFound } from '@/lib/client/utils';
import { defineRoute } from '@/lib/client/routes.client';

export const DesignRoute = defineRoute('/card/:designId', ['design', 'site-config'], props => {
	const rarityRanking = fetchRarityRanking();

	return (
		<Show when={props.data?.design}>
			{card => (
				<>
					<header class="flex flex-col items-center gap-4">
						<PageTitle>{card().design.cardName}</PageTitle>
						<Card
							{...card().design}
							{...getBestRarityFound(card().design)}
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
							rarityRanking={rarityRanking.data}
						/>
					</section>
				</>
			)}
		</Show>
	);
});

export default function DesignPage(props: RouteSectionProps) {
	const design = fetchDesign(props.params.designId);
	const rarityRanking = fetchRarityRanking();

	return (
		<Show when={design.data}>
			{card => (
				<>
					<header class="flex flex-col items-center gap-4">
						<PageTitle>{card().design.cardName}</PageTitle>
						<Card
							{...card().design}
							{...getBestRarityFound(card().design)}
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
							rarityRanking={rarityRanking.data}
						/>
					</section>
				</>
			)}
		</Show>
	);
}
