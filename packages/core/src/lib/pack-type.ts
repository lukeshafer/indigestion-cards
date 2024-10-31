import { ElectroError } from 'electrodb';
import { db } from '../db';
import type { CreatePackType } from '../db.types';
import { InputValidationError } from './errors';
import { getAllPacks } from './pack';

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

export const updatePackTypeName = async (args: { packTypeId: string; packTypeName: string }) => {
	if (!args.packTypeName.length) {
		throw new InputValidationError('Pack Type Name must have a length of 1 or more');
	}

	const packs = await getAllPacks().then(packs =>
		packs.filter(pack => pack.packTypeId === args.packTypeId)
	);

	try {
		await db.entities.PackTypes.patch({ packTypeId: args.packTypeId })
			.set({ packTypeName: args.packTypeName })
			.go();

		for (let pack of packs) {
			await db.entities.Packs.patch({ packId: pack.packId })
				.set({ packTypeName: args.packTypeName })
				.go();
		}
	} catch (error) {
		console.error(error);
		throw error;
	}

	//const result = await db.transaction
	//	.write(({ Packs, PackTypes }) => [
	//		PackTypes.patch({ packTypeId: args.packTypeId })
	//			.set({ packTypeName: args.packTypeName })
	//			.commit(),
	//		...packs
	//			.filter(pack => pack.packTypeId === args.packTypeId)
	//			.map(pack =>
	//				Packs.patch({ packId: pack.packId })
	//					.set({ packTypeName: args.packTypeName })
	//					.commit()
	//			),
	//	])
	//	.go();
	//
	//if (result.canceled) {
	//	console.log('canceled');
	//	throw new ServerError('The packtype name update was canceled.');
	//}
	//
	//return result.data;
};
