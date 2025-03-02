import { db } from '../db';
import type { CardInstance, CreateUser, User, UserLogin } from '../db.types';
import { getUserByLogin } from '../lib/twitch';
import { batchUpdateCardUsernames } from './card';
import { batchUpdatePackUsername } from './pack';

export async function getUser(userId: string) {
	const user = await db.entities.Users.get({ userId }).go();
	return user.data;
}

export async function getUserByUserName(username: string) {
	try {
		const user = await db.entities.Users.query.byUsername({ username }).go();
		return user.data[0] ?? null;
	} catch {
		return null;
	}
}

export async function getAllUsers(): Promise<User[]> {
	try {
		let { data } = await db.entities.Users.query.allUsers({}).go({ pages: 'all' });
		return data ?? [];
	} catch {
		return [];
	}
}

export async function searchUsers(args: { searchString: string }): Promise<User[]> {
	try {
		let { data } = await db.entities.Users.query
			.allUsers({})
			.where((attr, op) => op.contains(attr.username, args.searchString.toLowerCase()))
			.go({ pages: 'all' });
		return data.sort((a, b) => a.username.localeCompare(b.username)) ?? [];
	} catch {
		return [];
	}
}

export async function getUserAndCardInstances(args: { username: string }): Promise<{
	Users: User[];
	UserLogins: UserLogin[];
	CardInstances: CardInstance[];
} | null> {
	try {
		const data = await db.collections
			.UserAndCards({ username: args.username })
			.go({ pages: 'all' });
		return data.data;
	} catch {
		console.error('Error while retrieving user and card instance data for user', args.username);
		return null;
	}
}

export async function getUserAndOpenedCardInstances(args: { username: string }): Promise<{
	Users: User[];
	UserLogins: UserLogin[];
	CardInstances: CardInstance[];
} | null> {
	const data = await getUserAndCardInstances(args);

	if (!data) return null;

	return {
		Users: data.Users,
		UserLogins: data.UserLogins,
		CardInstances: data.CardInstances.filter(card => card.openedAt),
	};
}

export async function getUserAndCard(args: { username: string; instanceId: string }): Promise<{
	User: User;
	UserLogin: UserLogin;
	Card: CardInstance;
} | null> {
	try {
		const data = await db.collections.UserAndCards({ username: args.username }).go();
		const card = data.data.CardInstances.find(card => card.instanceId === args.instanceId);
		if (!card) throw new Error('Card not found');
		return {
			User: data.data.Users[0],
			UserLogin: data.data.UserLogins[0],
			Card: card,
		};
	} catch {
		console.error('Error while retrieving user and card instance data for user', args.username);
		return null;
	}
}

export async function createNewUser(args: CreateUser) {
	// make sure this username isn't already in use
	const existingUser = await getUserByUserName(args.username);
	if (existingUser && existingUser.username === args.username) {
		const twitchData = await getUserByLogin(args.username);
		if (!twitchData) {
			throw new Error(`Username ${args.username} is not a valid Twitch user`);
		}
		if (twitchData.login.toLowerCase() === args.username.toLowerCase()) {
			// we cannot update the username, as it is still taken
			throw new Error(`Username ${args.username} is taken`);
		}
		await updateUsername({
			userId: existingUser.userId,
			newUsername: twitchData.login,
			oldUsername: existingUser.username,
		});
	}

	const twitchLogin = await getUserByLogin(args.username);

	const result = await db.entities.Users.create({
		...args,
		username: twitchLogin?.display_name ?? args.username,
	}).go();
	return result.data;
}

export async function updateUsername(
	args: { userId: string; newUsername: string; oldUsername: string },
	iteration = 0
) {
	if (iteration > 10) throw new Error('Too many iterations');
	const existingUser = await getUserByUserName(args.newUsername);
	if (existingUser && existingUser.username === args.newUsername) {
		// username is taken in our database, and is likely out of date
		const twitchData = await getUserByLogin(args.newUsername);
		if (!twitchData) {
			throw new Error(`Username ${args.newUsername} is not a valid Twitch user`);
		}
		if (twitchData.login === args.newUsername) {
			// we cannot update the username, as it is still taken
			throw new Error(`Username ${args.newUsername} is still taken`);
		}
		// we can update the username, as it is no longer taken
		await updateUsername(
			{
				userId: existingUser.userId,
				newUsername: twitchData.login,
				oldUsername: existingUser.username,
			},
			iteration + 1
		);
	}

	// TODO: get all minted cards and update those as well

	console.log(`Updating username on user from ${args.oldUsername} to ${args.newUsername}`);
	await db.entities.Users.patch({ userId: args.userId }).set({ username: args.newUsername }).go();
	await db.entities.UserLogins.patch({ userId: args.userId })
		.set({ username: args.newUsername })
		.go();

	console.log(`Updating username on packs from ${args.oldUsername} to ${args.newUsername}`);
	await batchUpdatePackUsername({
		newUsername: args.newUsername,
		oldUsername: args.oldUsername,
	});

	console.log(`Updating username on cards from ${args.oldUsername} to ${args.newUsername}`);
	await batchUpdateCardUsernames({
		newUsername: args.newUsername,
		oldUsername: args.oldUsername,
	});
}

export async function batchUpdateUsers(usersInput: CreateUser[]) {
	await db.entities.Users.put(usersInput).go();
}

export async function checkIfUserExists(userId: string): Promise<boolean> {
	return getUser(userId).then(user => !!user);
}

export async function checkIfUsernameExists(userName: string) {
	return getUserByUserName(userName);
}

type PinnedCard = {
	instanceId: string;
	designId: string;
};
export async function setUserProfile(args: {
	userId: string;
	lookingFor?: string;
	pinnedCard?: PinnedCard | null;
	minecraftUsername?: string;
	pinnedMessage?: string | null;
}) {
	const user = await getUser(args.userId);
	if (!user) return null;

	const card = args.pinnedCard
		? await db.entities.CardInstances.get(args.pinnedCard)
				.go()
				.then(result =>
					result.data?.userId === args.userId && !!result.data?.openedAt
						? result.data
						: user.pinnedCard
				)
		: args.pinnedCard === null
			? ({
					instanceId: '',
					designId: '',
					imgUrl: '',
					userId: '',
					username: '',
					cardName: '',
					frameUrl: '',
					rarityId: '',
					rarityName: '',
					rarityRank: 0,
					seasonId: '',
					cardNumber: 0,
					seasonName: '',
					rarityColor: '',
					totalOfType: 0,
					cardDescription: '',
				} satisfies CardInstance)
			: user.pinnedCard;

	return db.entities.Users.patch({ userId: args.userId })
		.set({
			lookingFor: args.lookingFor?.slice(0, 500) ?? user.lookingFor,
			pinnedCard: card,
			pinnedMessage: args.pinnedMessage === null ? '' : args.pinnedMessage,
			minecraftUsername: args.minecraftUsername?.toLowerCase() || user.minecraftUsername,
		})
		.go()
		.then(result => result.data);
}

export async function removeTradeNotification(args: { userId: string; tradeId: string }) {
	const queryResult = await db.entities.Users.query.byId({ userId: args.userId }).go();

	const user = queryResult.data[0];
	console.log({ user });
	if (!user) return;

	return db.entities.Users.patch({ userId: args.userId })
		.set({
			tradeNotifications: user.tradeNotifications?.filter(
				notification => notification.tradeId !== args.tradeId
			),
		})
		.go();
}

export async function getUserAndCardsByMinecraftUsername(args: { minecraftUsername: string }) {
	const {
		data: [user],
	} = await db.entities.Users.query
		.byMinecraftUsername({ minecraftUsername: args.minecraftUsername.toLowerCase() })
		.go({ pages: 'all' });
	if (!user) return null;

	const {
		data: { CardInstances: cards },
	} = await db.collections.UserAndCards(user).go({ pages: 'all' });

	return { user, cards };
}
