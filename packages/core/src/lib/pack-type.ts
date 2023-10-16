import { ElectroError } from 'electrodb';
import { packTypes, type CreatePackType } from '../db/packTypes';

export async function getAllPackTypes() {
	const result = await packTypes.query.allPackTypes({}).go();
	return result.data;
}

export async function getPackTypeById(args: { packTypeId: string }) {
	const result = await packTypes.query.allPackTypes(args).go();
	return result.data[0];
}

export async function getPackTypesBySeasonId(args: { seasonId: string }) {
	const result = await packTypes.query.bySeasonId(args).go();
	return result.data;
}

export async function createPackType(args: CreatePackType) {
	try {
		const result = await packTypes.create({ ...args }).go();
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
	const result = await packTypes.delete(args).go();
	return { success: true, data: result.data };
}
