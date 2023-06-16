import { getListOfTwitchUsersByIds } from '@lil-indigestion-cards/core/twitch-helpers';
import { getAllUsers, batchUpdateUsers } from '@lil-indigestion-cards/core/user';

export async function handler() {
	const users = await getAllUsers();
	const usersToUpdate: typeof users = [];

	// call twitch api with 100 twitchIds at a time
	for (let i = 0; i < users.length; i += 100) {
		const userSubset = users.slice(i, i + 100);
		const twitchUsers = await getListOfTwitchUsersByIds(userSubset.map((u) => u.userId));

		usersToUpdate.push(
			...twitchUsers
				.filter((twitchUser) => {
					const user = users.find((u) => u.userId === twitchUser.id);
					return user && user.username !== twitchUser.login;
				})
				.map((twitchUser) => {
					const user = users.find((u) => u.userId === twitchUser.id)!;
					return {
						...user,
						username: twitchUser.display_name,
					};
				})
		);
	}

	if (!usersToUpdate.length) {
		return;
	}

	console.log(`Updating ${usersToUpdate.length} users`);
	await batchUpdateUsers(usersToUpdate);
}
