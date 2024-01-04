import { migration as packs1To2 } from './packs-1-to-2';
import { migration as addBestRarityFound } from './add-best-rarity-found';
import { migration as designs1To2 } from './designs-1-to-2';

export async function migration() {
	await packs1To2();
	await addBestRarityFound();
	await designs1To2();
}
