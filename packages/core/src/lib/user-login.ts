import { userLogins, type CreateUserLogin } from "src/db/userLogins";

export async function getUserLoginById(userId: string) {
	try {
		const result = await userLogins.query.allLogins({ userId }).go();
		return result.data[0] ?? null;
	} catch {
		return null;
	}
}

export async function createNewUserLogin(args: CreateUserLogin) {
	console.log('Creating new user: ', args);

	try {
		const result = await userLogins.create(args).go();
		console.log('Created new user: ', result);
		return result.data;
	} catch (err) {
		console.error(err);
		return null;
	}
}

export async function updateUserLogin(args: { userId: string; hasProfile: boolean }) {
	try {
		const result = await userLogins
			.update({ userId: args.userId })
			.set({ hasProfile: args.hasProfile })
			.go();
		return result.data;
	} catch (err) {
		console.error(err);
		return null;
	}
}
