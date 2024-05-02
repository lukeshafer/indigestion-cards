import { SiteHandler } from '@core/lib/api';
import { deleteSeasonById } from '@core/lib/season';

export const handler = SiteHandler(
	{
		authorizationType: 'admin',
		schema: {
			seasonId: 'string',
		},
	},
	async (_, { params }) => {
		const { seasonId } = params;

		const result = await deleteSeasonById(seasonId);

		if (!result.success)
			return {
				statusCode: result.error === 'Season does not exist' ? 404 : 500,
				body: result.error,
			};

		return { statusCode: 200, body: 'Season deleted!' };
	}
);
