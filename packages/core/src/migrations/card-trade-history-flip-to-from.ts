import { cardInstances } from '../db/cardInstances';

export async function migration() {
	const cards = await cardInstances.scan.go({ pages: 'all' });

	for (const card of cards.data) {
		let isUpdated = false;
		const updatedTradeHistory = card.tradeHistory?.map(history => {
			if ((history.version ?? 0) >= 2) return history;
			isUpdated = true;

			return {
				...history,
				toUserId: history.fromUserId,
				toUsername: history.fromUsername,
				fromUserId: history.toUserId,
				fromUsername: history.toUsername,
				version: 2,
			};
		});

		if (!isUpdated) continue;
		await cardInstances.patch(card).set({ tradeHistory: updatedTradeHistory }).go();
	}
}
