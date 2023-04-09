import {
	addUnopenedPacks,
	checkIfUserExists,
	createNewUser,
} from '@lil-indigestion-cards/core/user'

export async function handler(event: { userId: string; username: string; packCount: number }) {
	if (!(await checkIfUserExists(event.userId))) {
		console.log('User does not exist, creating user')
		await createNewUser({
			userId: event.userId,
			username: event.username,
		})
	}

	await addUnopenedPacks({
		userId: event.userId,
		packCount: event.packCount,
		username: event.username,
	})
}
