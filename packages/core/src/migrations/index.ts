import { migration as packs1To2 } from "./packs-1-to-2";

export async function migration() {
	await packs1To2()
}
