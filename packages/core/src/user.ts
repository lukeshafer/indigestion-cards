import { db } from './db';
import { EntityRecord, CreateEntityItem, ElectroError, EntityItem } from 'electrodb';
import { createPack } from './card';
import { getUserByLogin } from './twitch-helpers';
import type { CardPool } from './pack';

type User = typeof db.entities.users;

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
		const users = await db.entities.users.find({}).go();
		return users.data ?? [];
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
		const result = await updateUsername({
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
		const result = await updateUsername(
			{
				userId: existingUser.userId,
				newUsername: twitchData.login,
				oldUsername: existingUser.username,
			},
			iteration + 1
		);
	}

	const result = await db.entities.users
		.patch({ userId: args.userId })
		.set({ username: args.newUsername })
		.go();
	return result.data;
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

export async function deleteAdminUser(args: { userId: string }) {
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

function getDefaultCardCountInPack() {
	// TODO: implement this properly with database
	return 5;
}

function getCurrentSeasonId() {
	// TODO: implement this properly with database
	return 'season-1';
}
