type OutOfCardsReason = 'No designs found' | 'No cards remaining' | 'No rarity found';

export class PackTypeIsOutOfCardsError extends Error {
	count: number;
	reason: OutOfCardsReason;

	constructor(reason: OutOfCardsReason, count = 1) {
		super(`No cards are available for pack type: ${reason}`);
		this.name = 'PackTypeIsOutOfCardsError';
		this.count = count;
		this.reason = reason;
	}
}
