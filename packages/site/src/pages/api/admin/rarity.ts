import type { APIRoute } from 'astro';
import { AUTH_TOKEN, routes } from '@/constants';
import { Api } from 'sst/node/api';
import {
	createRarity,
	deleteUnmatchedDesignImage,
	deleteRarityById,
} from '@lil-indigestion-cards/core/card';
import { Bucket } from 'sst/node/bucket';
import { moveImageBetweenBuckets } from '@lil-indigestion-cards/core/images';
import { createS3Url } from '@lil-indigestion-cards/core/utils';

export const post: APIRoute = async (ctx) => {
	const params = new URLSearchParams(await ctx.request.text());

	const rarityId = params.get('rarityId');
	const rarityName = params.get('rarityName');
	const rarityColor = params.get('rarityColor');
	const defaultCount = parseInt(params.get('defaultCount') || '0') || 0;
	const imageKey = params.get('imageKey');
	const bucket = params.get('bucket');

	const errors = [];
	if (!rarityId) errors.push('Missing rarityId');
	else if (!rarityId.match(/^[a-z0-9-]+$/))
		errors.push('Invalid rarityId. (Must be lowercase, numbers, and dashes only)');
	if (!rarityName) errors.push('Missing rarityName');
	if (!rarityColor) errors.push('Missing rarityColor');
	else if (!rarityColor.match(/^#[a-f0-9]{6}$/i))
		errors.push('Invalid rarityColor. (Must be a hex color code)');
	if (!imageKey) errors.push('Missing imageKey');
	if (!bucket) errors.push('Missing bucket');
	if (defaultCount < 1) errors.push('Default count must be greater than 0');

	if (errors.length) return new Response(errors.join(', '), { status: 400 });

	const newUrl = createS3Url({ bucket: Bucket.FrameDesigns.bucketName, key: imageKey! });

	const result = await createRarity({
		rarityId: rarityId!,
		rarityName: rarityName!,
		rarityColor: rarityColor!,
		defaultCount,
		frameUrl: newUrl,
	});

	if (!result.success)
		return new Response(result.error, {
			status: result.error === 'Rarity already exists' ? 409 : 500,
		});

	await moveImageBetweenBuckets({
		sourceBucket: Bucket.FrameDrafts.bucketName,
		key: imageKey!,
		destinationBucket: Bucket.FrameDesigns.bucketName,
	});
	await deleteUnmatchedDesignImage({ imageId: imageKey!, type: 'frame' });

	return ctx.redirect(`${routes.RARITIES}?alert=Rarity%20created!&type=success`);
};

export const del: APIRoute = async (ctx) => {
	const params = new URLSearchParams(await ctx.request.text());

	const rarityId = params.get('rarityId');
	const frameUrl = params.get('frameUrl');
	const rarityName = params.get('rarityName');

	if (!rarityId) return new Response('Missing rarityId', { status: 400 });
	if (!frameUrl) return new Response('Missing frameUrl', { status: 400 });

	const result = await deleteRarityById(rarityId);

	if (!result.success) return new Response(result.error, { status: 500 });

	const deleteFrameUrl = `${Api.api.url}/delete-rarity-frame`;
	const deleteFrameResult = await fetch(deleteFrameUrl, {
		method: 'DELETE',
		body: JSON.stringify({ frameUrl }),
		headers: {
			authorization: `Bearer ${ctx.cookies.get(AUTH_TOKEN).value ?? ''}`,
		},
	});
	if (!deleteFrameResult.ok)
		return new Response('Failed to delete frame -- see admin to manually delete.', {
			status: 500,
		});

	return ctx.redirect(`${routes.RARITIES}?alert=Rarity%20deleted!&type=success`);
};
