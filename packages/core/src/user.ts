import { db } from './db';
import { CreateEntityItem, ElectroError, EntityItem } from 'electrodb';
import { getUserByLogin } from './twitch-helpers';

type User = typeof db.entities.users;
type Admin = typeof db.entities.admins;
export type UserEntity = EntityItem<User>;
export type AdminEntity = EntityItem<Admin>;

export async function getUser(userId: string) {
	const user = await db.entities.users.get({ userId }).go();
	return user.data;
}

export async function getUserByUserName(username: string) {
	try {
		const user = await db.entities.users.query.byUsername({ username }).go();
		return user.data[0] ?? null;
	} catch {
		return null;
	}
}

export async function getAllUsers() {
	try {
		let { data, cursor } = await db.entities.users.find({}).go();
		while (cursor) {
			const users = await db.entities.users.find({}).go({ cursor });
			data.push(...users.data);
			cursor = users.cursor;
		}
		return data ?? [];
	} catch {
		return [];
	}
}

export async function getUserAndCardInstances(args: { username: string }) {
	try {
		const data = await db.collections.cardsByOwnerName({ username: args.username }).go();
		return data.data;
	} catch {
		console.error('Error while retrieving user and card instance data for user', args.username);
		return null;
	}
}

export async function createNewUser(args: CreateEntityItem<User>) {
	const existingUser = await getUserByUserName(args.username);
	if (existingUser && existingUser.username === args.username) {
		const twitchData = await getUserByLogin(args.username);
		if (!twitchData) {
			throw new Error(`Username ${args.username} is not a valid Twitch user`);
		}
		if (twitchData.login === args.username) {
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

	const result = await db.entities.users
		.create({
			...args,
			username: twitchLogin?.display_name ?? args.username,
		})
		.go();
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

	const cards = await db.entities.cardInstances.query
		.byOwnerId({ username: args.oldUsername })
		.go();
	
	const packData = await db.entities.packs.query
		.byUsername({ username: args.oldUsername })
		.go();

	// TODO: get all minted cards and update those

	const transactionResult = await db.transaction.write(({ users, cardInstances, packs }) => [
		users.patch({ userId: args.userId }).set({ username: args.newUsername }).commit(),
		...cards.data.map((card) =>
			cardInstances
				.patch({ designId: card.designId, instanceId: card.instanceId })
				.set({
					username: args.newUsername,
					minterUsername:
						card.minterUsername === args.oldUsername
							? args.newUsername
							: card.minterUsername,
				})
				.commit()
		),
		...packData.data.map((pack) =>
			packs
				.patch({ packId: pack.packId })
				.set({ username: args.newUsername })
				.commit()
		),
	]).go();

	return transactionResult.data
}

export async function batchUpdateUsers(users: CreateEntityItem<User>[]) {
	await db.entities.users.put(users).go();
}

export async function checkIfUserExists(userId: string): Promise<boolean> {
	return getUser(userId).then((user) => !!user);
}

export async function checkIfUsernameExists(userName: string) {
	return getUserByUserName(userName);
}

export async function createAdminUser(args: { userId: string; username: string }) {
	try {
		const result = await db.entities.admins.create(args).go();
		return { success: true, data: result.data };
	} catch (err) {
		if (!(err instanceof ElectroError)) return { success: false, error: `${err}` };

		if (err.code === 4001)
			// aws error, User already exists
			return {
				success: false,
				error: 'User already exists',
			};

		// default
		return {
			success: false,
			error: err.message,
		};
	}
}

export async function deleteAdminUser(args: {
	userId: string;
	username: string;
	isStreamer: boolean;
}) {
	try {
		const result = await db.entities.admins.delete(args).go();
		return { success: true, data: result.data };
	} catch (err) {
		if (!(err instanceof ElectroError)) return { success: false, error: `${err}` };

		if (err.code === 4001)
			// aws error, User already exists
			return {
				success: false,
				error: 'User does not exist',
			};

		// default
		return {
			success: false,
			error: err.message,
		};
	}
}

export async function getAllAdminUsers() {
	try {
		const result = await db.entities.admins.query.allAdmins({}).go();
		return result.data;
	} catch {
		return [];
	}
}

export async function getAdminUserById(userId: string) {
	try {
		const result = await db.entities.admins.query.allAdmins({ userId }).go();
		return result.data[0];
	} catch {
		return null;
	}
}

export function setAdminEnvSession(username: string, userId: string) {
	process.env.SESSION_USER_ID = userId;
	process.env.SESSION_TYPE = 'admin';
	process.env.SESSION_USERNAME = username;
}
