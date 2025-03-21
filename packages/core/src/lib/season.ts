import { ElectroError } from 'electrodb';
import type { DBResult } from '../types';
import { db } from '../db';
import type { CreateSeason, Season, UpdateSeason } from '../db.types';

export async function getAllSeasons() {
	const result = await db.entities.Seasons.query.allSeasons({}).go({ pages: 'all' });
	return result.data;
}

export async function getSeasonById(id: string) {
	const result = await db.entities.Seasons.get({ seasonId: id }).go();
	return result.data;
}

export async function getSeasonAndDesignsBySeasonId(id: string) {
	const result = await db.collections
		.SeasonAndDesignsAndCards({ seasonId: id })
		.go({ pages: 'all' });
	return result.data;
}

export async function deleteSeasonById(id: string) {
	const seasonData = await getSeasonAndDesignsBySeasonId(id);
	if (seasonData.CardDesigns.length > 0)
		return {
			success: false,
			error: 'Cannot delete season with existing designs',
		};

	const result = await db.entities.Seasons.delete({ seasonId: id }).go();
	return { success: true, data: result.data };
}

export async function createSeason(inputSeason: CreateSeason) {
	let seasonNumber = inputSeason.seasonId.split('-')[1];
	try {
		const result = await db.entities.Seasons.create({
			packNumberPrefix: `S${seasonNumber}`,
			...inputSeason,
		}).go();
		return {
			success: true,
			data: result.data,
		};
	} catch (err) {
		if (!(err instanceof ElectroError)) return { success: false, error: `${err}` };

		if (err.code === 4001)
			// aws error, season already exists
			return {
				success: false,
				error: 'Season already exists',
			};

		// default
		return {
			success: false,
			error: err.message,
		};
	}
}

export async function updateSeason({
	seasonId,
	seasonName,
	seasonDescription,
}: UpdateSeason & { seasonId: string }): Promise<DBResult<Partial<Season>>> {
	try {
		const result = await db.entities.Seasons.patch({ seasonId })
			.set({ seasonName, seasonDescription })
			.go();
		return {
			success: true,
			data: result.data,
		};
	} catch (err) {
		if (!(err instanceof ElectroError)) return { success: false, error: `${err}` };

		// default
		return {
			success: false,
			error: err.message,
		};
	}
}
