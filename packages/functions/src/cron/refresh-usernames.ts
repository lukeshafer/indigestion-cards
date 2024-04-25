import { getListOfTwitchUsersByIds } from '@core/lib/twitch';
import { getAllUsers, updateUsername } from '@core/lib/user';

export async function handler() {
	const users = await getAllUsers();
	const usersToUpdate: { oldUsername: string; newUsername: string; userId: string }[] = [];

	// call twitch api with 100 twitchIds at a time
	for (let i = 0; i < users.length; i += 100) {
		const userSubset = users.slice(i, i + 100);
		const twitchUsers = await getListOfTwitchUsersByIds(userSubset.map((u) => u.userId));

		usersToUpdate.push(
			...twitchUsers
				.filter((twitchUser) => {
					const user = users.find((u) => u.userId === twitchUser.id);
					return user && user.username.toLowerCase() !== twitchUser.login.toLowerCase();
				})
				.map((twitchUser) => {
					const user = users.find((u) => u.userId === twitchUser.id)!;
					return {
						userId: user.userId,
						oldUsername: user.username,
						newUsername: twitchUser.display_name,
					};
				})
		);
	}

	if (!usersToUpdate.length) return;

	console.log(`Updating ${usersToUpdate.length} users`);
	for (const user of usersToUpdate) {
		console.log(`Updating ${user.oldUsername} to ${user.newUsername}`);
		await updateUsername(user);
	}
}
