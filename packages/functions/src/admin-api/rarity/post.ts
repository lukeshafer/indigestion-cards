import { useValidateFormData, ProtectedApiHandler } from '@lil-indigestion-cards/core/api';
import { createRarity, deleteUnmatchedDesignImage } from '@lil-indigestion-cards/core/card';
import { Bucket } from 'sst/node/bucket';
import { moveImageBetweenBuckets } from '@lil-indigestion-cards/core/images';
import { createS3Url } from '@lil-indigestion-cards/core/utils';

export const handler = ProtectedApiHandler(async () => {
	const validationResult = useValidateFormData({
		rarityId: 'string',
		rarityName: 'string',
		rarityColor: 'string',
		defaultCount: 'number',
		imageKey: 'string',
		bucket: 'string',
	});

	if (!validationResult.success)
		return { statusCode: 400, body: validationResult.errors.join(' ') };
	const params = validationResult.value;

	if (!params.rarityId.match(/^[a-z0-9-]+$/))
		return {
			statusCode: 400,
			body: 'Invalid rarityId. (Must be lowercase, numbers, and dashes only)',
		};
	if (!params.rarityColor.match(/^#[a-f0-9]{6}$/i))
		return { statusCode: 400, body: 'Invalid rarityColor. (Must be a hex color code)' };
	if (params.defaultCount < 1)
		return { statusCode: 400, body: 'Default count must be greater than 0' };

	const frameUrl = createS3Url({ bucket: Bucket.FrameDesigns.bucketName, key: params.imageKey! });

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
	await deleteUnmatchedDesignImage({ imageId: params.imageKey, type: 'frame' });

	return { statusCode: 200, body: 'Rarity created!' };
});
