import { validateSearchParams } from '@core/lib/api';
import { createRarity, deleteRarityById } from '@core/lib/rarity';
import { deleteUnmatchedDesignImage } from '@core/lib/unmatched-image';
import { moveImageBetweenBuckets, createS3Url, deleteS3ObjectByUrl } from '@core/lib/images';
import { Resource } from 'sst';
import type { APIRoute } from 'astro';

export const POST: APIRoute = async (ctx) => {
  const formData = await ctx.request.formData();
  const validation = validateSearchParams(new URLSearchParams(formData as unknown as string), {
    rarityId: 'string',
    rarityName: 'string',
    rarityColor: 'string',
    defaultCount: 'number',
    imageKey: 'string',
    bucket: 'string',
  });

  if (!validation.success) return new Response(validation.errors.join(' '), { status: 400 });

  const p = validation.value;

  if (!p.rarityId.match(/^[a-z0-9-]+$/))
    return new Response('Invalid rarityId. (Must be lowercase, numbers, and dashes only)', {
      status: 400,
    });

  if (p.defaultCount < 1)
    return new Response('Default count must be greater than 0', { status: 400 });

  const frameUrl = createS3Url({
    bucket: Resource.FrameDesigns.name,
    key: p.imageKey,
  });

  const result = await createRarity({ ...p, frameUrl });

  if (!result.success)
    return new Response(result.error, {
      status: result.error === 'Rarity already exists' ? 409 : 500,
    });

  await moveImageBetweenBuckets({
    sourceBucket: Resource.FrameDrafts.name,
    key: p.imageKey,
    destinationBucket: Resource.FrameDesigns.name,
  });
  await deleteUnmatchedDesignImage({ imageId: p.imageKey, unmatchedImageType: 'frame' });

  return new Response('Rarity created!', { status: 200 });
};

export const DELETE: APIRoute = async (ctx) => {
  const formData = await ctx.request.formData();
  const validation = validateSearchParams(new URLSearchParams(formData as unknown as string), {
    rarityId: 'string',
    frameUrl: 'string',
    rarityName: 'string?',
  });

  if (!validation.success) return new Response(validation.errors.join(' '), { status: 400 });

  const deleteRarityResult = await deleteRarityById(validation.value.rarityId);

  if (!deleteRarityResult.success)
    return new Response(deleteRarityResult.error, { status: 500 });

  await deleteS3ObjectByUrl(validation.value.frameUrl);

  return new Response('Rarity deleted!', { status: 200 });
};
