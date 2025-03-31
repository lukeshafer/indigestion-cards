import { getAllSeasons } from '@core/lib/season';
import { updateSeasonStatistics } from '@core/lib/stats';

export const handler = async () => {
	console.log('refreshing statistics');

	const seasons = await getAllSeasons();
	for (let season of seasons) {
		await updateSeasonStatistics(season.seasonId);
	}
};
