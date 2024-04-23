import { ElectroError } from 'electrodb';
import { db } from '../db';
import type { CreatePackType } from '../db.types';

export async function getAllPackTypes() {
	const result = await db.entities.PackTypes.query.allPackTypes({}).go();
	return result.data;
}

export async function getPackTypeById(args: { packTypeId: string }) {
	const result = await db.entities.PackTypes.query.allPackTypes(args).go();
	return result.data[0];
}

export async function getPackTypesBySeasonId(args: { seasonId: string }) {
	const result = await db.entities.PackTypes.query.bySeason(args).go();
	return result.data;
}

export async function createPackType(args: CreatePackType) {
	try {
		const result = await db.entities.PackTypes.create({ ...args }).go();
		return { success: true, data: result.data };
	} catch (err) {
		if (!(err instanceof ElectroError)) return { success: false, error: `${err}` };

		if (err.code === 4001)
			// aws error, design already exists
			return {
				success: false,
				error: 'Pack already exists',
			};

		// default
		return {
			success: false,
			error: err.message,
		};
	}
}

export async function deletePackTypeById(args: { packTypeId: string }) {
	const result = await db.entities.PackTypes.delete(args).go();
	return { success: true, data: result.data };
}
