import { refreshUserCards } from '@core/lib/user';
import type { DynamoDBStreamEvent } from 'aws-lambda';

export const handler = async (e: DynamoDBStreamEvent) => {
	// Get all unique usernames affected by the transaction
	const usernames = new Set(
		e.Records.flatMap(r => {
			let names = [];
			let oldUsername = r.dynamodb?.OldImage?.username?.S;
			if (oldUsername) names.push(oldUsername);
			let oldMintername = r.dynamodb?.OldImage?.minterUsername?.S;
			if (oldMintername) names.push(oldMintername);
			let oldSenderUsername = r.dynamodb?.OldImage?.senderUsername?.S;
			if (oldSenderUsername) names.push(oldSenderUsername);
			let oldReceiverUsername = r.dynamodb?.OldImage?.receiverUsername?.S;
			if (oldReceiverUsername) names.push(oldReceiverUsername);

			let newUsername = r.dynamodb?.NewImage?.username?.S;
			if (newUsername) names.push(newUsername);
			let newMintername = r.dynamodb?.NewImage?.minterUsername?.S;
			if (newMintername) names.push(newMintername);
			let newSenderUsername = r.dynamodb?.NewImage?.senderUsername?.S;
			if (newSenderUsername) names.push(newSenderUsername);
			let newReceiverUsername = r.dynamodb?.NewImage?.receiverUsername?.S;
			if (newReceiverUsername) names.push(newReceiverUsername);

			return names;
		})
	);

	console.log('refreshing users page');
	for (let username of usernames) {
		await refreshUserCards(username);
	}
};
