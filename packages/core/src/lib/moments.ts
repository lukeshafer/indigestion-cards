import { momentRedemptions } from '../db/moments';

export async function createMomentRedemption(options: { userId: string; username: string }) {
	await momentRedemptions.upsert(options).go();
}
