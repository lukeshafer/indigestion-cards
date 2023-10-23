import { batchUpdateUsers, getAllUsers, getUserAndCardInstances } from '@lil-indigestion-cards/core/lib/user';
import { getAllPacks } from '@lil-indigestion-cards/core/lib/pack';

export async function handler() {
	const users = await getAllUsers();
	const packs = await getAllPacks();

	const result = users.map(async (user) => {
		const data = await getUserAndCardInstances({ username: user.username });

		if (!data) return;

		const { cardInstances } = data;

		const cardCount = cardInstances.filter((c) => c.openedAt).length;
		const packCount = packs.filter((p) => p.userId === user.userId).length;

		if (user.cardCount !== cardCount || user.packCount !== packCount) {
			return {
				...user,
				cardCount,
				packCount,
			};
		}

		return null;
	});

	const usersToUpdate = (await Promise.all(result)).filter((u) => u) as typeof users;

	if (!usersToUpdate.length) {
		return;
	}

	console.log(`Updating ${usersToUpdate.length} users`);
	await batchUpdateUsers(usersToUpdate);
}
