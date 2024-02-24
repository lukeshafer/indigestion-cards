import { PageHeader, PageTitle } from '@/components/text';
import NewTrade from '@/components/trades/NewTrade';
import type { CardInstance } from '@lil-indigestion-cards/core/db/cardInstances';
import type { RarityRankingRecord } from '@lil-indigestion-cards/core/lib/site-config';
import { createMemo } from 'solid-js';

export default function NewTradePage(props: {
	data: {
		sessionUserId: string;
		sessionUsername: string;
		cardInstances: Array<CardInstance>;
		params?: {
			offeredCardIds?: Array<string>;
			requestedCardIds?: Array<string>;
			receiverUsername?: string;
		};
		initialReceiverCards?: Array<CardInstance>;
		rarityRanking: RarityRankingRecord;
	};
}) {
	const initialOfferedCards = createMemo(() =>
		props.data.params?.offeredCardIds
			? parseCardIdListFromString(props.data.params.offeredCardIds, props.data.cardInstances)
			: undefined
	);

	const initialRequestedCards = createMemo(() =>
		props.data.params?.requestedCardIds && props.data.initialReceiverCards
			? parseCardIdListFromString(
					props.data.params.requestedCardIds,
					props.data.initialReceiverCards
				)
			: undefined
	);

	return (
		<>
			<PageHeader>
				<PageTitle>New Trade</PageTitle>
			</PageHeader>
			<NewTrade
				userId={props.data.sessionUserId}
				username={props.data.sessionUsername}
				cardInstances={props.data.cardInstances}
				initialOfferedCards={initialOfferedCards()}
				initialRequestedCards={initialRequestedCards()}
				initialReceiverUsername={props.data.params?.receiverUsername}
				initialReceiverCards={props.data.initialReceiverCards}
				rarityRanking={props.data.rarityRanking}
			/>
		</>
	);
}

function parseCardIdListFromString(cardIdList: string[], cardInstances: CardInstance[]) {
	const cards = [];
	for (const cardId of cardIdList) {
		const card = cardInstances.find(cardInstance => cardInstance.instanceId === cardId);
		if (card) cards.push(card);
	}
	return cards;
}
