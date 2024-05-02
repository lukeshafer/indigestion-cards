import { SiteHandler } from '@core/lib/api';
import { updateSeason } from '@core/lib/season';

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
		const result = await updateSeason(params);

		if (!result.success)
			return {
				statusCode: result.error === 'Season does not exist' ? 404 : 500,
				body: result.error,
			};

		return { statusCode: 200, body: 'Season updated!' };
	}
);
