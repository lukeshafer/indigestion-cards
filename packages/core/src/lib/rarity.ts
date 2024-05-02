import { ElectroError } from 'electrodb';
import type { DBResult } from '../types';
import { getAllCardDesigns } from './design';
import { db } from '../db';
import type { CreateRarity, Rarity, UpdateRarity } from '../db.types';

export async function getRarityById(args: { rarityId: string }) {
	const result = await db.entities.Rarities.query.allRarities(args).go();
	return result.data[0];
}

export async function getAllRarities(): Promise<Rarity[]> {
	const result = await db.entities.Rarities.query.allRarities({}).go();
	return result.data.sort((a, b) => b.defaultCount - a.defaultCount);
}

export async function createRarity(rarity: CreateRarity): Promise<DBResult<Rarity>> {
	try {
		const result = await db.entities.Rarities.create(rarity).go();
		return { success: true, data: result.data };
	} catch (err) {
		if (!(err instanceof ElectroError)) return { success: false, error: `${err}` };

		if (err.code === 4001)
			// aws error, rarity already exists
			return {
				success: false,
				error: 'Rarity already exists',
			};

		// default
		return {
			success: false,
			error: err.message,
		};
	}
}

export async function updateRarity(args: UpdateRarity & { rarityId: string }) {
	const { rarityId, ...rest } = args;
	const result = await db.entities.Rarities.patch({ rarityId }).set(rest).go();
	return result.data;
}

export async function deleteRarityById(id: string): Promise<DBResult<Partial<Rarity>>> {
	const allDesigns = await getAllCardDesigns();
	const designsWithRarity = allDesigns.some(
		(design) => design.rarityDetails?.some((r) => r.rarityId === id)
	);
	if (designsWithRarity) {
		return {
			success: false,
			error: 'Cannot delete rarity with existing designs',
		};
	}

	const result = await db.entities.Rarities.delete({ rarityId: id }).go();
	return { success: true, data: result.data };
}
