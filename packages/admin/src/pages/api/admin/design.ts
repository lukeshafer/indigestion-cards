import { validateSearchParams } from '@core/lib/api';
import { getAllRarities } from '@core/lib/rarity';
import { createCardDesign, deleteCardDesignById, updateCardDesign } from '@core/lib/design';
import { moveImageBetweenBuckets, createS3Url, deleteS3ObjectByUrl } from '@core/lib/images';
import { deleteUnmatchedDesignImage } from '@core/lib/unmatched-image';
import { NO_CARDS_OPENED_ID, FULL_ART_ID, LEGACY_CARD_ID } from '@core/constants';
import { Resource } from 'sst';
import type { APIRoute } from 'astro';

export const POST: APIRoute = async (ctx) => {
  const formData = await ctx.request.formData();

  const season = formData.get('season') as string;
  const imageKey = formData.get('imageKey') as string;
  const cardName = formData.get('cardName') as string;
  const designId = formData.get('designId') as string;
  const cardDescription = formData.get('cardDescription') as string;
  const artist = formData.get('artist') as string;
  const fullArt = formData.get('fullArt') as string | undefined;
  const legacy = formData.get('legacy') as string | undefined;

  if (!season || !imageKey || !cardName || !designId || !cardDescription || !artist) {
    return new Response('Missing required fields.', { status: 400 });
  }

  const isFullArt = fullArt === 'on';
  const isLegacy = legacy === 'on';

  const rarities = await getAllRarities();

  const rarityDetails = rarities.map((rarity) => ({
    rarityId: rarity.rarityId,
    rarityName: rarity.rarityName,
    count: Number(formData.get(`rarity-${rarity.rarityId}-count`)) || 0,
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

  const { seasonId, seasonName } = JSON.parse(season);

  const newUrl = createS3Url({ bucket: Resource.CardDesigns.name, key: imageKey });

  const result = await createCardDesign({
    seasonId,
    seasonName,
    cardName,
    cardDescription,
    artist,
    designId,
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

  if (!result.success) return new Response(result.error, { status: 400 });

  try {
    await moveImageBetweenBuckets({
      sourceBucket: Resource.CardDrafts.name,
      key: imageKey,
      destinationBucket: Resource.CardDesigns.name,
    });
  } catch (e) {
    console.error(e);
    await deleteCardDesignById({ designId });
    return new Response(
      'An error occurred converting draft to design. Please try again and contact support if you have more issues.',
      { status: 500 }
    );
  }
  await deleteUnmatchedDesignImage({ imageId: imageKey, unmatchedImageType: 'cardDesign' });

  return new Response('Design created!', { status: 200 });
};

export const PATCH: APIRoute = async (ctx) => {
  const formData = await ctx.request.formData();
  const validation = validateSearchParams(new URLSearchParams(formData as unknown as string), {
    designId: 'string',
    cardDescription: 'string',
  });

  if (!validation.success) return new Response(validation.errors.join(' '), { status: 400 });

  const result = await updateCardDesign(validation.value);

  if (!result.success)
    return new Response('An error occurred while updating the card text.', { status: 500 });

  return new Response('Card text updated successfully.', { status: 200 });
};

export const DELETE: APIRoute = async (ctx) => {
  const formData = await ctx.request.formData();
  const validation = validateSearchParams(new URLSearchParams(formData as unknown as string), {
    designId: 'string',
    imgUrl: 'string',
    cardName: 'string?',
  });

  if (!validation.success) return new Response(validation.errors.join(' '), { status: 400 });

  const result = await deleteCardDesignById({ designId: validation.value.designId });
  if (!result.success) return new Response(result.error, { status: 500 });

  try {
    await deleteS3ObjectByUrl(validation.value.imgUrl);
  } catch (error) {
    console.error(error);
    return new Response('An error occurred while deleting the image.', { status: 500 });
  }

  return new Response(
    `Design ${validation.value.cardName ? validation.value.cardName : validation.value.designId} deleted!`,
    { status: 200 }
  );
};
