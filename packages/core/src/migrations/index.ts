import { migration as migratePackNumbers } from './pack-numbers';

export async function migration() {
  console.log("Migrating db...")
	await migratePackNumbers();
}
