import { z } from 'zod';
import { db } from '../db';
import type { MomentRedemption } from '../db.types';

export async function createMomentRedemption(options: {
	userId: string;
	username: string;
}): Promise<void> {
	await db.entities.MomentRedemptions.upsert(options).go();
}

export async function getAllMomentRedemptions(): Promise<Array<MomentRedemption>> {
	const moments = await db.entities.MomentRedemptions.query.allMomentRedemptions({}).go();
	return moments.data;
}

export async function getMomentRedemptionsForDate(date: string): Promise<Array<MomentRedemption>> {
	const moments = await db.entities.MomentRedemptions.query.primary({ momentDate: date }).go();
	return moments.data;
}

export async function deleteMomentRedemption(redemption: {
	momentDate: string;
	userId: string;
}): Promise<{ userId: string; momentDate: string } | null> {
	const result = await db.entities.MomentRedemptions.delete(redemption).go();
	return result.data;
}

export function groupRedemptionsByMoment(
	redemptions: Array<MomentRedemption>
): Map<string, Array<MomentRedemption>> {
	const map = new Map<string, Array<MomentRedemption>>();
	for (const r of redemptions) {
		const momentArray = map.get(r.momentDate) || [];
		momentArray.push(r);
		map.set(r.momentDate, momentArray);
	}

	return map;
}

export const momentInputSchemas = {
	rarity: z.object({
		rarityId: z.string(),
		rarityName: z.string(),
		frameUrl: z.string(),
		rarityColor: z.string(),
	}),
	users: z.array(
		z.object({
			username: z.string(),
			userId: z.string(),
		})
	),
};

export namespace MomentCardInput {
	export type Rarity = z.infer<typeof momentInputSchemas.rarity>;
	export type Users = z.infer<typeof momentInputSchemas.users>;
}
