import { db } from './db'
import { EntityRecord, CreateEntityItem, ElectroError } from 'electrodb'
import { createPack } from './card'

type User = typeof db.entities.users

export async function getUser(userId: string) {
	const user = await db.entities.users.query.byUserId({ userId }).go()
	return user
}

export async function getUserByUserName(username: string) {
	const user = await db.entities.users.query.byUsername({ username }).go()
	return user
}

async function putUser(user: CreateEntityItem<User>) {
	const result = await db.entities.users.create(user).go()
	return result
}

export async function createNewUser(user: CreateEntityItem<User>) {
	if (await checkIfUsernameExists(user.username)) {
		// TODO: update existing username, as they likely changed their username
	}

	const result = await putUser(user)
}

export async function checkIfUserExists(userId: string): Promise<boolean> {
	return getUser(userId).then((user) => !!user)
}

export async function checkIfUsernameExists(userName: string): Promise<boolean> {
	return getUserByUserName(userName).then((user) => !!user)
}

export async function addUnopenedPacks(args: {
	userId: string
	username: string
	packCount: number
}) {
	for (let i = 0; i < args.packCount; i++) {
		await createPack({
			username: args.username,
			userId: args.userId,
			count: getDefaultCardCountInPack(),
			seasonId: getCurrentSeasonId(),
		})
	}
}

export async function createAdminUser(args: { userId: string; username: string }) {
	try {
		const result = await db.entities.admins.create(args).go()
		return { success: true, data: result.data }
	} catch (err) {
		if (!(err instanceof ElectroError)) return { success: false, error: `${err}` }

		if (err.code === 4001)
			// aws error, User already exists
			return {
				success: false,
				error: 'User already exists',
			}

		// default
		return {
			success: false,
			error: err.message,
		}
	}
}

export async function getAdminUserById(userId: string) {
	try {
		const result = await db.entities.admins.query.allAdmins({ userId }).go()
		return result.data[0]
	} catch {
		return null
	}
}

function getDefaultCardCountInPack() {
	// TODO: implement this properly with database
	return 5
}

function getCurrentSeasonId() {
	// TODO: implement this properly with database
	return 'base'
}
