import type { APIRoute } from 'astro';
import { routes } from '@/constants';
import {
	createCardDesign,
	deleteUnmatchedDesignImage,
	getAllRarities,
	deleteCardDesignById,
} from '@lil-indigestion-cards/core/card';
import { Api } from 'sst/node/api';
import { AUTH_TOKEN } from '@/constants';

export const post: APIRoute = async (ctx) => {
	const params = new URLSearchParams(await ctx.request.text());

	const season = params.get('season');
	const imgUrl = params.get('imgUrl');
	const imageKey = params.get('imageKey');
	const cardName = params.get('cardName');
	const designId = params.get('designId');
	const cardDescription = params.get('cardDescription');
	const artist = params.get('artist');

	const errors = [];
	if (!imgUrl) errors.push('Image URL is required');
	if (!imageKey) errors.push('Image key is required');
	if (!season) errors.push('Season is required');
	if (!cardName) errors.push('Card name is required');
	if (!cardDescription) errors.push('Card description is required');
	if (!artist) errors.push('Artist is required');
	if (!designId) errors.push('Design ID is required');

	if (errors.length > 0) return new Response(errors.join('\n'), { status: 400 });

	const rarities = await getAllRarities();

	const rarityDetails = rarities.map((rarity) => {
		const count = params.get(`rarity-${rarity.rarityId}-count`);
		return {
			...rarity,
			count: count ? parseInt(count) : 0,
		};
	});

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

	if (!result.success) return new Response(result.error, { status: 500 });

	await deleteUnmatchedDesignImage({ imageId: imageKey!, type: 'cardDesign' });
	return ctx.redirect(`${routes.DESIGNS}?alert=Design%20created!&type=success`);
};

export const del: APIRoute = async (ctx) => {
	const params = new URLSearchParams(await ctx.request.text());

	const designId = params.get('designId');
	const imgUrl = params.get('imgUrl');
	const cardName = params.get('cardName');

	if (!designId) return new Response('Missing design ID', { status: 400 });
	if (!imgUrl) return new Response('Missing image URL', { status: 400 });

	const deleteImageUrl = `${Api.api.url}/delete-card-image`;
	const deleteImageResult = await fetch(deleteImageUrl, {
		method: 'DELETE',
		body: JSON.stringify({ imgUrl }),
		headers: {
			authorization: `Bearer ${ctx.cookies.get(AUTH_TOKEN).value ?? ''}`,
		},
	});

	if (!deleteImageResult.ok) return new Response('Failed to delete image', { status: 500 });

	const result = await deleteCardDesignById({ designId: designId! });
	if (!result.success) return new Response(result.error, { status: 500 });

	return ctx.redirect(
		`${routes.DESIGNS}?alert=Design%20${cardName ? cardName : designId}%20deleted!&type=success`
	);
};
