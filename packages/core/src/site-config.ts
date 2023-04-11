import { db } from './db'

export async function getSiteConfig() {
	const result = await db.collections.siteConfig({}).go()
	return result.data
}
