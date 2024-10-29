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

export class HTTPError extends Error {
	status: number;
	originalMessage: string;

	constructor(status: number, message: string) {
		super(`${status}: ${message}`);
		this.name = 'HTTPError';
		this.status = status;
		this.originalMessage = message;
	}
}

export class NotFoundError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'NotFoundError';
	}
}

export class UnauthorizedError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'UnauthorizedError';
	}
}

export class InputValidationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'InputValidationError';
	}
}

export class ServerError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'ServerError';
	}
}

type UserDoesNotOwnCardErrorDetails = {
	username: string;
	tradeId: string;
	card: {
		instanceId: string;
		cardName: string;
		cardNumber: number;
		totalOfType: number;
		rarityName: string;
	};
};

export class UserDoesNotOwnCardError extends Error {
	details: UserDoesNotOwnCardErrorDetails;
	constructor(message: string, options: UserDoesNotOwnCardErrorDetails) {
		super(message);
		this.name = 'UserDoesNotOwnCardError';
		this.details = options;
	}
}

type UserDoesNotOwnPackErrorDetails = {
	username: string;
	tradeId: string;
	pack: {
		packId: string;
		packTypeId: string;
		packTypeName: string;
	};
};

export class UserDoesNotOwnPackError extends Error {
	details: UserDoesNotOwnPackErrorDetails;
	constructor(message: string, options: UserDoesNotOwnPackErrorDetails) {
		super(message);
		this.name = 'UserDoesNotOwnCardError';
		this.details = options;
	}
}
