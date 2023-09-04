import { useValidateFormData, ProtectedApiHandler } from '@lil-indigestion-cards/core/api';
import {
	createCardDesign,
	deleteUnmatchedDesignImage,
	getAllRarities,
	deleteCardDesignById,
} from '@lil-indigestion-cards/core/card';
import { moveImageBetweenBuckets } from '@lil-indigestion-cards/core/images';
import { createS3Url } from '@lil-indigestion-cards/core/utils';
import { NO_CARDS_OPENED_ID } from '@lil-indigestion-cards/core/constants';
import { Bucket } from 'sst/node/bucket';
import { FULL_ART_ID, LEGACY_CARD_ID } from '@lil-indigestion-cards/core/constants';
import { useFormValue } from 'sst/node/api';

export const handler = ProtectedApiHandler(async () => {
	const validateResult = useValidateFormData({
		season: 'string',
		imageKey: 'string',
		cardName: 'string',
		designId: 'string',
		cardDescription: 'string',
		artist: 'string',
		fullArt: ['string', 'optional'],
		legacy: ['string', 'optional'],
	});

	if (!validateResult.success) return { statusCode: 400, body: validateResult.errors.join(' ') };
	const params = validateResult.value;

	const isFullArt = params.fullArt === 'on';
	const isLegacy = params.legacy === 'on';

	const rarities = await getAllRarities();

	const rarityDetails = rarities.map((rarity) => ({
		rarityId: rarity.rarityId,
		rarityName: rarity.rarityName,
		count: Number(useFormValue(`rarity-${rarity.rarityId}-count`)) || 0,
		frameUrl: rarity.frameUrl,
		rarityColor: rarity.rarityColor,
	}));

	if (isFullArt && rarities.length > 0)
		rarityDetails.push({
			rarityId: FULL_ART_ID,
			rarityName: 'Full Art',
			count: 1,
			frameUrl: '',
			rarityColor: '',
		});

	if (isLegacy && rarities.length > 0)
		rarityDetails.push({
			rarityId: LEGACY_CARD_ID,
			rarityName: 'Legacy',
			count: 1,
			frameUrl: '',
			rarityColor: '',
		});

	const { seasonId, seasonName } = JSON.parse(params.season);

	const newUrl = createS3Url({ bucket: Bucket.CardDesigns.bucketName, key: params.imageKey });

	const result = await createCardDesign({
		seasonId,
		seasonName,
		cardName: params.cardName,
		cardDescription: params.cardDescription,
		artist: params.artist,
		designId: params.designId,
		imgUrl: newUrl,
		rarityDetails,
		bestRarityFound: {
			count: 999999,
			rarityId: NO_CARDS_OPENED_ID,
			rarityName: 'No Cards Opened',
			rarityColor: 'transparent',
			frameUrl: '',
		},
	});

	if (!result.success) return { statusCode: 400, body: result.error };

	try {
		await moveImageBetweenBuckets({
			sourceBucket: Bucket.CardDrafts.bucketName,
			key: params.imageKey,
			destinationBucket: Bucket.CardDesigns.bucketName,
		});
	} catch (e) {
		console.error(e);
		await deleteCardDesignById({ designId: params.designId });
		return {
			statusCode: 500,
			body: 'An error occurred converting draft to design. Please try again and contact support if you have more issues.',
		};
	}
	await deleteUnmatchedDesignImage({ imageId: params.imageKey, type: 'cardDesign' });

	return { statusCode: 200, body: 'Design created!' };
});
