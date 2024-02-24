import Card from '@/components/cards/Card';
import CardList from '@/components/cards/CardList';
import { Heading, PageTitle } from '@/components/text';
import { ASSETS, LEGACY_CARD_ID } from '@/constants';
import type { CardDesign } from '@lil-indigestion-cards/core/db/cardDesigns';
import type { CardInstance } from '@lil-indigestion-cards/core/db/cardInstances';
import type { SiteConfig } from '@lil-indigestion-cards/core/db/siteConfig';
import type { RarityRankingRecord } from '@lil-indigestion-cards/core/lib/site-config';

export default function CardDesignPage(props: {
	data: {
		design: CardDesign;
		siteConfig: SiteConfig;
		openedInstances: Array<CardInstance>;
    rarityRanking: RarityRankingRecord;
	};
}) {
	const baseRarity = () =>
		props.data.design.bestRarityFound ||
		props.data.design.rarityDetails?.find(r => r.rarityId === LEGACY_CARD_ID) ||
		props.data.siteConfig.baseRarity || {
			rarityId: 'default',
			rarityName: 'Default',
			frameUrl: ASSETS.CARDS.DEFAULT_BASE_RARITY,
			rarityColor: '#fff',
		};

	return (
		<>
			<header class="flex flex-col items-center gap-4">
				<PageTitle>{props.data.design.cardName}</PageTitle>
				<Card {...props.data.design} {...baseRarity()} cardNumber={1} totalOfType={1} />
				<section class="mx-auto text-lg">
					<p>
						<b>Season: </b>
						{props.data.design.seasonName}
					</p>
					<p>
						<b>Artist: </b>
						{props.data.design.artist}
					</p>
				</section>
			</header>
			<section class="flex flex-col text-center">
				<Heading>Cards Opened</Heading>
				<CardList
					cards={props.data.openedInstances}
					showUsernames
					sortOnlyBy={[
						'rarest',
						'common',
						'owner-asc',
						'owner-desc',
						'open-date-desc',
						'open-date-asc',
					]}
					rarityRanking={props.data.rarityRanking}
				/>
			</section>
		</>
	);
}
