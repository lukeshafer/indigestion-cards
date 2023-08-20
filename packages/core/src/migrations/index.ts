import { migration as packs1To2 } from "./packs-1-to-2";
import { migration as addBestRarityFound } from "./add-best-rarity-found"

export async function migration() {
	await packs1To2()
	await addBestRarityFound()
}
