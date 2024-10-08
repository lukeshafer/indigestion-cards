import { Bucket } from 'sst/node/bucket';

import { SiteHandler } from '@core/lib/api';
import { createRarity } from '@core/lib/rarity';
import { deleteUnmatchedDesignImage } from '@core/lib/unmatched-image';
import { moveImageBetweenBuckets, createS3Url } from '@core/lib/images';

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
			bucket: Bucket.FrameDesigns.bucketName,
			key: params.imageKey!,
		});

		const result = await createRarity({ ...params, frameUrl });

		if (!result.success)
			return {
				statusCode: result.error === 'Rarity already exists' ? 409 : 500,
				body: result.error,
			};

		await moveImageBetweenBuckets({
			sourceBucket: Bucket.FrameDrafts.bucketName,
			key: params.imageKey,
			destinationBucket: Bucket.FrameDesigns.bucketName,
		});
		await deleteUnmatchedDesignImage({ imageId: params.imageKey, unmatchedImageType: 'frame' });

		return { statusCode: 200, body: 'Rarity created!' };
	}
);
