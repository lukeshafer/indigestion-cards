import { SiteHandler } from '@lib/api';
import { deleteRarityById } from '@lib/rarity';
import { deleteS3ObjectByUrl } from '@lib/images';

export const handler = SiteHandler(
	{
		authorizationType: 'admin',
		schema: {
			rarityId: 'string',
			frameUrl: 'string',
			rarityName: 'string?',
		},
	},
	async (_, { params }) => {
		const deleteRarityResult = await deleteRarityById(params.rarityId);

		if (!deleteRarityResult.success) return { statusCode: 500, body: deleteRarityResult.error };

		await deleteS3ObjectByUrl(params.frameUrl);

		return { statusCode: 200, body: 'Rarity deleted!' };
	}
);
