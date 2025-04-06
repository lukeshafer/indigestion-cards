import { getAllSeasons } from '@core/lib/season';
import { updateSeasonStatistics, updateSiteStatistics } from '@core/lib/stats';

export const handler = async () => {
	console.log('refreshing statistics');

  await updateSiteStatistics();

	const seasons = await getAllSeasons();
	for (let season of seasons) {
		await updateSeasonStatistics(season.seasonId);
	}
};
