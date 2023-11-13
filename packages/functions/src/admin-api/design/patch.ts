import { SiteHandler } from '@lib/api';
import { updateCardDesign } from '@lib/design';

export const handler = SiteHandler(
	{
		authorizationType: 'admin',
		schema: {
			designId: 'string',
			cardDescription: 'string',
		},
	},
	async (_, { params }) => {
		const result = await updateCardDesign(params);

		if (!result.success)
			return { statusCode: 500, body: 'An error occurred while updating the card text.' };

		return { statusCode: 200, body: 'Card text updated successfully.' };
	}
);
