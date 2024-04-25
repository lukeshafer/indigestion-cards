import { SiteHandler } from '@core/lib/api';
import { createSeason } from '@core/lib/season';

export const handler = SiteHandler(
	{
		authorizationType: 'admin',
		schema: {
			seasonId: 'string',
			seasonName: 'string',
			seasonDescription: 'string?',
		},
	},
	async (_, { params }) => {
		if (!params.seasonId!.match(/^[a-z0-9-]+$/))
			return {
				statusCode: 400,
				body: 'Invalid seasonId. (Must be lowercase, numbers, and dashes only)',
			};

		const season = await createSeason(params);

		if (!season.success)
			return {
				statusCode: season.error === 'Season already exists' ? 409 : 500,
				body: season.error,
			};

		return { statusCode: 200, body: 'Season created!' };
	}
);
