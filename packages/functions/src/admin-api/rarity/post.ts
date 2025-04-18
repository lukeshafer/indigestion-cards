import { SiteHandler } from '@core/lib/api';
import { createRarity } from '@core/lib/rarity';
import { deleteUnmatchedDesignImage } from '@core/lib/unmatched-image';
import { moveImageBetweenBuckets, createS3Url } from '@core/lib/images';
import { Resource } from 'sst';

export const handler = SiteHandler(
	{
		authorizationType: 'admin',
		schema: {
			rarityId: 'string',
			rarityName: 'string',
			rarityColor: 'string',
			defaultCount: 'number',
			imageKey: 'string',
			bucket: 'string',
		},
	},
	async (_, { params }) => {
		if (!params.rarityId.match(/^[a-z0-9-]+$/))
			return {
				statusCode: 400,
				body: 'Invalid rarityId. (Must be lowercase, numbers, and dashes only)',
			};
		if (params.defaultCount < 1)
			return { statusCode: 400, body: 'Default count must be greater than 0' };

		const frameUrl = createS3Url({
			bucket: Resource.FrameDesigns.name,
			key: params.imageKey!,
		});

		const result = await createRarity({ ...params, frameUrl });

		if (!result.success)
			return {
				statusCode: result.error === 'Rarity already exists' ? 409 : 500,
				body: result.error,
			};

		await moveImageBetweenBuckets({
			sourceBucket: Resource.FrameDrafts.name,
			key: params.imageKey,
			destinationBucket: Resource.FrameDesigns.name,
		});
		await deleteUnmatchedDesignImage({ imageId: params.imageKey, unmatchedImageType: 'frame' });

		return { statusCode: 200, body: 'Rarity created!' };
	}
);
