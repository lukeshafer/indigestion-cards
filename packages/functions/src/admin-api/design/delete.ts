import { SiteHandler } from '@core/lib/api';
import { deleteCardDesignById } from '@core/lib/design';
import { deleteS3ObjectByUrl } from '@core/lib/images';

export const handler = SiteHandler(
	{
		authorizationType: 'admin',
		schema: {
			designId: 'string',
			imgUrl: 'string',
			cardName: 'string?',
		},
	},
	async (_, { params }) => {
		const result = await deleteCardDesignById({ designId: params.designId });
		if (!result.success) return { statusCode: 500, body: result.error };

		try {
			await deleteS3ObjectByUrl(params.imgUrl);
		} catch (error) {
			console.error(error);
			return { statusCode: 500, body: 'An error occurred while deleting the image.' };
		}

		return {
			statusCode: 200,
			body: `Design ${params.cardName ? params.cardName : params.designId} deleted!`,
		};
	}
);
