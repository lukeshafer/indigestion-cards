import { db } from '../db';
import type { PackType } from '../db.types';
import { getCardPoolFromType } from '../lib/card-pool';

export async function migration() {
	console.log('Setting up pack numbers');
	let seasons = await db.entities.Seasons.scan.go({ pages: 'all' });
	let allExistingPacks = await db.entities.Packs.scan.go({ pages: 'all' });
	let packTypes = await db.entities.PackTypes.scan
		.go({ pages: 'all' })
		.then(
			({ data }) =>
				new Map<string, PackType>(
					data.map(packType => [packType.packTypeId, packType] as const)
				)
		);

	for (let season of seasons.data) {
		console.log('Adding pack number to season:', { season });
		if (season.nextPackNumber !== undefined) {
			console.log('Season has a pack number already, skipping');
			continue;
		}
		let seasonNumber = season.seasonId.split('-').at(1);

		let existingCards = await getCardPoolFromType({
			packTypeCategory: 'season',
			seasonId: season.seasonId,
		});

		let totalCardsCreated = existingCards.CardInstances.length;

		let packsSoFar = Math.floor(totalCardsCreated / 5);

		let nextPackNumber = packsSoFar + 1;
		let packNumberPrefix =
			seasonNumber !== undefined ? `S${seasonNumber}` : season.seasonId.toUpperCase();

		console.log('Setting next pack number for season:', { nextPackNumber, packNumberPrefix });

		await db.entities.Seasons.patch({ seasonId: season.seasonId })
			.set({ nextPackNumber, packNumberPrefix })
			.go();

		let seasonPacks = allExistingPacks.data.filter(pack => {
			let packType = packTypes.get(pack.packTypeId);

			if (!packType) return false;
      else if (packType.packTypeCategory !== 'season') return false;
      else if (packType.seasonId && packType.seasonId !== season.seasonId) return false;
      else return true
		});

		for (let i = 0; i < seasonPacks.length; i++) {
			let pack = seasonPacks[i];
			if (pack.packNumber !== undefined) continue;

			console.log('Adding pack number to existing pack', {
				pack,
				packNumber: packsSoFar - i,
				packNumberPrefix,
			});

			await db.entities.Packs.patch({ packId: pack.packId }).set({
				packNumber: packsSoFar - i,
				packNumberPrefix,
			}).go();
		}
	}
}
