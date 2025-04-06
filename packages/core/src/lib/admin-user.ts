import { ElectroError } from 'electrodb';
import { db } from '../db';
import type { Admin } from '../db.types';

export async function createAdminUser(args: {
	userId: string;
	username: string;
}): Promise<{ success: false; error: string } | { success: true; data: Admin }> {
	try {
		const result = await db.entities.Admins.create(args).go();
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
}): Promise<
	{ success: false; error: string } | { success: true; data: { userId: string } | null }
> {
	try {
		const result = await db.entities.Admins.delete(args).go();
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

export async function getAllAdminUsers(): Promise<Admin[]> {
	try {
		const result = await db.entities.Admins.query.allAdmins({}).go();
		return result.data;
	} catch {
		return [];
	}
}

export async function getAdminUserById(userId: string): Promise<Admin | null> {
	try {
		const result = await db.entities.Admins.get({ userId }).go();
		return result.data;
	} catch {
		return null;
	}
}
