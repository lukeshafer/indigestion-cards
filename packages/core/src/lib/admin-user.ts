import { ElectroError } from 'electrodb';
import { admins } from 'src/db/admins';

export async function createAdminUser(args: { userId: string; username: string }) {
	try {
		const result = await admins.create(args).go();
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
		const result = await admins.delete(args).go();
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
		const result = await admins.query.allAdmins({}).go();
		return result.data;
	} catch {
		return [];
	}
}

export async function getAdminUserById(userId: string) {
	try {
		const result = await admins.query.allAdmins({ userId }).go();
		return result.data[0];
	} catch {
		return null;
	}
}
