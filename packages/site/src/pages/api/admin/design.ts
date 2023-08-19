import type { APIRoute } from 'astro';
import { routes } from '@/constants';
import {
	createCardDesign,
	deleteUnmatchedDesignImage,
	getAllRarities,
	deleteCardDesignById,
	updateCardDesign,
} from '@lil-indigestion-cards/core/card';
import { moveImageBetweenBuckets } from '@lil-indigestion-cards/core/images';
import { createS3Url } from '@lil-indigestion-cards/core/utils';
import { Api } from 'sst/node/api';
import { Bucket } from 'sst/node/bucket';
import { AUTH_TOKEN, FULL_ART_ID, LEGACY_CARD_ID } from '@/constants';

export const post: APIRoute = async (ctx) => {
	const params = new URLSearchParams(await ctx.request.text());

	const season = params.get('season');
	const imageKey = params.get('imageKey');
	const cardName = params.get('cardName');
	const designId = params.get('designId');
	const cardDescription = params.get('cardDescription');
	const artist = params.get('artist');
	const isFullArt = params.get('fullArt') === 'on';
	const isLegacy = params.get('legacy') === 'on';

	const errors = [];
	if (!imageKey) errors.push('Image key is required');
	if (!season) errors.push('Season is required');
	if (!cardName) errors.push('Card name is required');
	if (!cardDescription) errors.push('Card description is required');
	if (!artist) errors.push('Artist is required');
	if (!designId) errors.push('Design ID is required');

	if (errors.length > 0) return new Response(errors.join('\n'), { status: 400 });

	const rarities = await getAllRarities();

	const rarityDetails = [
		...rarities.map((rarity) => {
			const count = params.get(`rarity-${rarity.rarityId}-count`);
			return {
				...rarity,
				count: count ? parseInt(count) : 0,
			};
		}),
		...(isFullArt && rarities.length > 0
			? [
					{
						rarityId: FULL_ART_ID,
						rarityName: 'Full Art',
						count: 1,
						frameUrl: '',
						rarityColor: '',
					},
			  ]
			: []),
		...(isLegacy && rarities.length > 0
			? [
					{
						rarityId: LEGACY_CARD_ID,
						rarityName: 'Legacy',
						count: 1,
						frameUrl: '',
						rarityColor: '',
					},
			  ]
			: []),
	];

	const { seasonId, seasonName } = JSON.parse(season!);

	const newUrl = createS3Url({ bucket: Bucket.CardDesigns.bucketName, key: imageKey! });

	const result = await createCardDesign({
		seasonId: seasonId!,
		seasonName: seasonName!,
		cardName: cardName!,
		cardDescription: cardDescription!,
		artist: artist!,
		designId: designId!,
		imgUrl: newUrl,
		rarityDetails,
	});

	if (!result.success) return new Response(result.error, { status: 500 });

	try {
		await moveImageBetweenBuckets({
			sourceBucket: Bucket.CardDrafts.bucketName,
			key: imageKey!,
			destinationBucket: Bucket.CardDesigns.bucketName,
		});
	} catch (e) {
		console.error(e);
		await deleteCardDesignById({ designId: designId! });
		return new Response(
			'An error occurred converting draft to design. Please try again and contact support if you have more issues.',
			{ status: 500 }
		);
	}
	await deleteUnmatchedDesignImage({ imageId: imageKey!, type: 'cardDesign' });

	return ctx.redirect(`${routes.DESIGNS}?alert=Design%20created!&type=success`);
};

export const patch: APIRoute = async (ctx) => {
	const params = new URLSearchParams(await ctx.request.text());

	const designId = params.get('designId');
	const cardDescription = params.get('cardDescription');

	if (!designId) return new Response('Missing design ID', { status: 400 });
	if (!cardDescription) return new Response('Missing card description', { status: 400 });

	const result = await updateCardDesign({
		designId: designId!,
		cardDescription: cardDescription!,
	});

	if (!result.success)
		return new Response('An error occurred while updating the card text.', { status: 500 });

	return new Response('Card updated!', { status: 200 });
};

export const del: APIRoute = async (ctx) => {
	const params = new URLSearchParams(await ctx.request.text());

	const designId = params.get('designId');
	const imgUrl = params.get('imgUrl');
	const cardName = params.get('cardName');

	if (!designId) return new Response('Missing design ID', { status: 400 });
	if (!imgUrl) return new Response('Missing image URL', { status: 400 });

	const result = await deleteCardDesignById({ designId: designId! });
	if (!result.success) return new Response(result.error, { status: 500 });

	const deleteImageUrl = `${Api.api.url}/delete-card-image`;
	const deleteImageResult = await fetch(deleteImageUrl, {
		method: 'DELETE',
		body: JSON.stringify({ imgUrl }),
		headers: {
			authorization: `Bearer ${ctx.cookies.get(AUTH_TOKEN).value ?? ''}`,
		},
	});

	if (!deleteImageResult.ok)
		return new Response('Failed to delete image -- see admin to manually delete', {
			status: 500,
		});

	return ctx.redirect(
		`${routes.DESIGNS}?alert=Design%20${cardName ? cardName : designId}%20deleted!&type=success`
	);
};
