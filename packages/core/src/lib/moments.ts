import { momentRedemptions, type MomentRedemption } from '../db/moments';

export async function createMomentRedemption(options: { userId: string; username: string }) {
	await momentRedemptions.upsert(options).go();
}

export async function getAllMomentRedemptions() {
	const moments = await momentRedemptions.query.getAll({}).go();
	return moments.data;
}

export function groupRedemptionsByMoment(redemptions: Array<MomentRedemption>) {
	const map = new Map<string, Array<MomentRedemption>>();
	for (const r of redemptions) {
		const momentArray = map.get(r.momentDate) || [];
		momentArray.push(r);
		map.set(r.momentDate, momentArray);
	}

	return map;
}
