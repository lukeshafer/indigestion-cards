import { createCardInstance } from '@core/lib/card';
import { generateInstanceId } from '@core/lib/card-pool';
import { createCardDesign, deleteCardDesignById } from '@core/lib/design';
import { createS3Url, moveImageBetweenBuckets } from '@core/lib/images';
import { deleteMomentRedemption, momentInputSchemas } from '@core/lib/moments';
import { generatePackId } from '@core/lib/pack';
import { getRarityRankForRarity } from '@core/lib/site-config';
import { deleteUnmatchedDesignImage } from '@core/lib/unmatched-image';
import { Resource } from 'sst';
import type { APIRoute } from 'astro';

export const POST: APIRoute = async (ctx) => {
  const formData = await ctx.request.formData();

  const season = formData.get('season') as string;
  const imgUrl = formData.get('imgUrl') as string;
  const imageKey = formData.get('imageKey') as string;
  const cardName = formData.get('cardName') as string;
  const designId = formData.get('designId') as string;
  const cardDescription = formData.get('cardDescription') as string;
  const artist = formData.get('artist') as string;
  const rarityRaw = formData.get('rarity') as string;
  const usersRaw = formData.get('users') as string;
  const momentDate = formData.get('momentDate') as string;

  if (!season || !imageKey || !cardName || !designId || !cardDescription || !artist || !rarityRaw || !usersRaw || !momentDate) {
    return new Response('Missing required fields.', { status: 400 });
  }

  const { seasonId, seasonName } = JSON.parse(season);

  const users = momentInputSchemas.users.parse(JSON.parse(usersRaw));

  const rarity = {
    ...momentInputSchemas.rarity.parse(JSON.parse(rarityRaw)),
    count: users.length,
  };

  const newUrl = createS3Url({
    bucket: Resource.CardDesigns.name,
    key: imageKey,
  });

  const createDesignResult = await createCardDesign({
    seasonId,
    seasonName,
    cardName,
    cardDescription,
    artist,
    designId,
    imgUrl: newUrl,
    rarityDetails: [rarity],
    bestRarityFound: rarity,
  });

  if (!createDesignResult.success) return new Response(createDesignResult.error, { status: 400 });
  const design = createDesignResult.data;

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
  await deleteUnmatchedDesignImage({
    imageId: imageKey,
    unmatchedImageType: 'cardDesign',
  });

  const shuffledUsers = users.slice().sort(() => Math.random() - 0.5);
  await Promise.all(
    shuffledUsers.map(async (user, index) =>
      createCardInstance({
        instanceId: generateInstanceId({
          seasonId: design.seasonId,
          designId: design.designId,
          rarityId: rarity.rarityId,
          cardNumber: index + 1,
        }),
        cardNumber: index + 1,
        userId: user.userId,
        username: user.username,
        minterId: user.userId,
        minterUsername: user.username,
        seasonId: design.seasonId,
        seasonName: design.seasonName,
        designId: design.designId,
        cardName: design.cardName,
        cardDescription: design.cardDescription,
        imgUrl: design.imgUrl,
        rarityId: rarity.rarityId,
        frameUrl: rarity.frameUrl,
        rarityName: rarity.rarityName,
        rarityRank: await getRarityRankForRarity(rarity),
        rarityColor: rarity.rarityColor,
        totalOfType: rarity.count,
        packId: generatePackId({ userId: user.userId, prefix: 'moment-' }),
        openedAt: new Date().toISOString(),
      }).then(() => {
        deleteMomentRedemption({ momentDate, userId: user.userId });
      })
    )
  );

  return new Response('Successfully created moment card and assigned to users', { status: 200 });
};
