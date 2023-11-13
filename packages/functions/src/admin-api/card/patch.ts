import { SiteHandler } from '@lib/api';
import { openCardFromPack } from '@lib/open-pack';

export const handler = SiteHandler(
	{
		authorizationType: 'admin',
		schema: {
			instanceId: 'string',
			designId: 'string',
			packId: 'string',
		},
	},
	async (_, { params }) => {
		const { instanceId, designId, packId } = params;

		console.log('Opening card', { instanceId, designId, packId });
		const result = await openCardFromPack({ instanceId, designId, packId });

		if (!result.success) {
			console.error(result);
			return {
				statusCode: 400,
				body: result.error || 'There was an error opening the card.',
			};
		}

		return { statusCode: 200, body: 'Card opened.' };
	}
);
