import { ElectroError, Service } from 'electrodb';
import { type CreateSeason, season, type Season, type UpdateSeason } from '../db/season';
import { cardDesigns } from '../db/cardDesigns';
import { config } from '../db/_utils';
import type { DBResult } from '../types';
import { cardInstances } from 'src/db/cardInstances';

export async function getAllSeasons() {
	const result = await season.query.allSeasons({}).go({ pages: 'all' });
	return result.data;
}

export async function getSeasonById(id: string) {
	const result = await season.query.bySeasonId({ seasonId: id }).go();
	return result.data[0];
}

export async function getSeasonAndDesignsBySeasonId(id: string) {
	const service = new Service(
		{
			season,
			cardDesigns,
			cardInstances,
		},
		config
	);

	const result = await service.collections
		.seasonAndDesigns({ seasonId: id })
		.go({ pages: 'all' });
	return result.data;
}

export async function deleteSeasonById(id: string): Promise<DBResult<CreateSeason>> {
	const seasonData = await getSeasonAndDesignsBySeasonId(id);
	if (seasonData.cardDesigns.length > 0)
		return {
			success: false,
			error: 'Cannot delete season with existing designs',
		};

	const result = await season.delete({ seasonId: id }).go();
	return { success: true, data: result.data };
}

export async function createSeason(inputSeason: CreateSeason): Promise<DBResult<Season>> {
	try {
		const result = await season.create({ ...inputSeason }).go();
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
		const result = await season
			.update({ seasonId })
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
