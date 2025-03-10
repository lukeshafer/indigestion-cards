import { migration as migratePackNumbers } from './pack-numbers';

export async function migration() {
	await migratePackNumbers();
}
