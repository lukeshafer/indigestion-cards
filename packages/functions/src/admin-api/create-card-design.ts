import {
	createCardDesign,
	deleteUnmatchedDesignImage,
	getAllRarities,
} from '@lil-indigestion-cards/core/card';
import { parseS3Url } from '@lil-indigestion-cards/core/utils';
import { ApiHandler, useFormValue, useFormData } from 'sst/node/api';
import { useSession } from 'sst/node/future/auth';

export const handler = ApiHandler(async () => {
	const session = useSession();
	if (session.type !== 'admin')
		return {
			statusCode: 401,
			body: 'Unauthorized',
		};

	const rarities = await getAllRarities();

	const imgUrl = useFormValue('imgUrl');
	const imageKey = useFormValue('imageKey');
	const season = useFormValue('season');
	const cardName = useFormValue('cardName');
	const cardDescription = useFormValue('cardDescription');
	const artist = useFormValue('artist');
	const designId = useFormValue('designId');

	const rarityDetails = rarities.map(({ rarityId, rarityName, frameUrl }) => {
		const count = useFormValue(`rarity-${rarityId}-count`);
		return {
			rarityId,
			rarityName,
			frameUrl,
			count: count ? parseInt(count) : 0,
		};
	});

	const errors = [];
	if (!imgUrl) errors.push('Image URL is required');
	if (!imageKey) errors.push('Image key is required');
	if (!season) errors.push('Season is required');
	if (!cardName) errors.push('Card name is required');
	if (!cardDescription) errors.push('Card description is required');
	if (!artist) errors.push('Artist is required');
	if (!designId) errors.push('Design ID is required');

	if (errors.length) {
		return { statusCode: 400, body: errors.join(', ') };
	}

	const { seasonId, seasonName } = JSON.parse(season!);

	const result = await createCardDesign({
		seasonId: seasonId!,
		seasonName: seasonName!,
		cardName: cardName!,
		cardDescription: cardDescription!,
		artist: artist!,
		designId: designId!,
		imgUrl: imgUrl!,
		rarityDetails,
	});

	if (result.success) {
		await deleteUnmatchedDesignImage({ imageId: imageKey!, type: 'cardDesign' });
	}

	const { Bucket, Key } = parseS3Url(imgUrl!);

	if (result.success) {
		return {
			statusCode: 200,
			body: `Successfully created card design '${cardName}'`,
			redirectPath: `/design/${seasonId}/${designId}`,
		};
	}

	const errorMessage =
		result.error === 'Design already exists'
			? `Card design with id '${designId}' already exists. Please choose a different id.`
			: result.error;

	const params = new URLSearchParams({
		bucket: Bucket,
		key: Key,
	});
	useFormData()?.forEach((value, key) => {
		params.set(key, value);
	});
	return {
		statusCode: 400,
		body: JSON.stringify({
			message: errorMessage,
			params,
		}),
	};
});
