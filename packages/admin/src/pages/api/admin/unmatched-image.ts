import { validateSearchParams } from '@core/lib/api';
import { S3 } from '@aws-sdk/client-s3';
import { deleteUnmatchedDesignImage } from '@core/lib/unmatched-image';
import { Resource } from 'sst';
import type { APIRoute } from 'astro';

export const DELETE: APIRoute = async (ctx) => {
  const formData = await ctx.request.formData();
  const validation = validateSearchParams(new URLSearchParams(formData as unknown as string), {
    key: 'string',
    type: 'string',
  });

  if (!validation.success) return new Response(validation.errors.join(' '), { status: 400 });

  const { key, type } = validation.value;

  if (type !== 'cardDesign' && type !== 'frame') {
    return new Response('Invalid type: must be either "cardDesign" or "frame"', { status: 400 });
  }

  const bucketName = {
    cardDesign: Resource.CardDrafts.name,
    frame: Resource.FrameDrafts.name,
  }[type];

  const s3 = new S3();
  try {
    await deleteUnmatchedDesignImage({ imageId: key, unmatchedImageType: type });
    await s3.deleteObject({
      Bucket: bucketName,
      Key: key,
    });

    return new Response('Successfully deleted unused image', { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify(error), { status: 500 });
  }
};
