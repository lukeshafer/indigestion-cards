import { getAllSeasons } from '@core/lib/season';
import { publicProcedure } from '../router';
import { getAllCardDesigns } from '@core/lib/design';
import type { CardDesign } from '@core/types';

export const seasons = {
	getAll: publicProcedure.query(async () => await getAllSeasons()),
	getAllWithDesigns: publicProcedure.query(async () => {
		const [cards, seasons] = await Promise.all([getAllCardDesigns(), getAllSeasons()]);

		return Array.from(
			cards.reduce(
				(seasons, card) => {
					seasons.get(card.seasonId)?.cards.push(card);
					return seasons;
				},
				new Map(
					seasons.map(season => [
						season.seasonId,
						{ season, cards: [] as Array<CardDesign> },
					])
				)
			)
		);
	}),
};
