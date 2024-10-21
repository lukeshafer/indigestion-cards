'use server';
import { getAllCardDesigns } from '@core/lib/design';
import { getAllUsers, getUserByUserName } from '@core/lib/user';
import { getUserByLogin } from '@core/lib/twitch';
import { getCardsByUserSortedByRarity } from '@core/lib/card';

export async function $_userData(username: string) {
	const user = getUserByUserName(username);
	const twitchData = getUserByLogin(username);

	return {
		user: await user,
		twitchData: await twitchData,
	};
}

export async function $_userCardsByRarity(username: string, cursor?: string) {
	return getCardsByUserSortedByRarity({ username, cursor });
}

export async function $_allUsers() {
	return getAllUsers();
}

export async function $_allCardDesigns() {
	return getAllCardDesigns();
}
