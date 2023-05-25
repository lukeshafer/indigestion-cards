// 05/18/23 - Luke Shafer
import { db } from '../db';

runMigration();
async function runMigration() {
	let cursor: string | undefined = undefined;
	console.log('Updating season names for card instances');
	do {
		const instances = await db.entities.cardInstances.scan.go({ cursor });
		instances.data.forEach(async (instance) => {
			if (instance.seasonName) return;
			console.log('STARTING: Updating season name for instance: ', instance.instanceId);
			const instanceSeason = await db.entities.season.query
				.bySeasonId({ seasonId: instance.seasonId })
				.go();
			if (instanceSeason.data.length === 0) return;
			const seasonName = instanceSeason.data[0].seasonName;
			await db.entities.cardInstances
				.update({ instanceId: instance.instanceId, designId: instance.designId })
				.set({ seasonName })
				.go();
			console.log('FINISHED: Updated season name for instance: ', instance.instanceId);
		});
	} while (cursor);
}
