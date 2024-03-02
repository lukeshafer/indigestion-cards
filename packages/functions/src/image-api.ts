import { S3 } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { Config } from 'sst/node/config';
import { getCardInstanceByDesignAndRarity } from '@lil-indigestion-cards/core/lib/card';
import { parseS3Url } from '@lil-indigestion-cards/core/lib/images';
import { getCardDesignById } from '@lil-indigestion-cards/core/lib/design';
import { getRarityById } from '@lil-indigestion-cards/core/lib/rarity';
import { FULL_ART_ID, LEGACY_CARD_ID } from '@lil-indigestion-cards/core/constants';
import { Bucket } from 'sst/node/bucket';

const s3 = new S3({ region: 'us-east-2' });
const IMG_SIZE = [588, 816] as const;

export const handler: APIGatewayProxyHandlerV2 = async event => {
  const { designId, rarityId: rarityIdWithPng } = event.pathParameters ?? {};
  const rarityId =
    (rarityIdWithPng?.endsWith('.png') && rarityIdWithPng.replaceAll('.png', '')) || undefined;
  if (!designId || !rarityId) {
    return {
      statusCode: 404,
      body: 'Design Key or Rarity Key not provided',
    };
  }

  const adminSecret = event.queryStringParameters?.adminsecret;

  const urls = await getImageUrls({ designId, rarityId, adminSecret });

  console.debug('Combining images from urls', { urls });

  if (urls === null) {
    return {
      statusCode: 404,
      body: 'Image not found',
    };
  }

  const [designOutput, frameOutput] = await Promise.all([
    getImageByteArray(urls.designUrl),
    getImageByteArray(urls.frameUrl),
  ]);

  if (!designOutput) {
    return {
      statusCode: 404,
      body: 'Images not found',
    };
  }

  const designImg = await sharp(designOutput).resize(...IMG_SIZE);

  let combinedBuffer: Buffer;
  if (frameOutput !== null) {
    const combinedImage = designImg.composite([
      {
        input: await sharp(frameOutput)
          .resize(...IMG_SIZE)
          .png()
          .toBuffer(),
      },
    ]);
    combinedBuffer = await combinedImage.png().toBuffer();
  } else {
    combinedBuffer = await designImg.png().toBuffer();
  }

  //const key = `${designId}/${rarityId}.png`;
  //await s3.putObject({
  //Bucket: Bucket.CardsBucket.bucketName,
  //Key: key,
  //Body: combinedBuffer,
  //ContentType: 'image/png',
  //});
  //console.debug('Created new image', key);

  return {
    headers: {
      'Content-Type': 'image/png',
      'Content-Length': String(combinedBuffer.length),
      'Cache-Control': 'no-store',
    },
    statusCode: 200,
    body: combinedBuffer.toString('base64'),
    isBase64Encoded: true,
  };
};

async function getImageUrls({
  designId,
  rarityId,
  adminSecret,
}: {
  designId: string;
  rarityId: string;
  adminSecret: string | undefined;
}): Promise<{
  designUrl: string;
  frameUrl: string;
} | null> {
  const cards = await getCardInstanceByDesignAndRarity({ designId, rarityId });
  const card = cards.find(c => c.openedAt);
  if (card)
    return {
      designUrl: card.imgUrl,
      frameUrl: card.frameUrl,
    };
  else if (adminSecret !== Config.AdminImageSecret) return null;

  const [design, rarity] = await Promise.all([
    getCardDesignById({ designId }),
    getRarityById({ rarityId }),
  ]);

  if (!design) return null;
  else if (rarityId === FULL_ART_ID || rarityId === LEGACY_CARD_ID) {
    return {
      designUrl: design.imgUrl,
      frameUrl: '',
    };
  } else if (!rarity) return null;
  else
    return {
      designUrl: design.imgUrl,
      frameUrl: rarity.frameUrl,
    };
}

async function getImageByteArray(url: string): Promise<Uint8Array | null> {
  if (!url) return null;

  let key: string;
  let bucket: string;
  try {
    const s3Info = parseS3Url(url);
    key = s3Info.Key;
    bucket = s3Info.Bucket;
  } catch {
    return null;
  }

  const output = await s3.getObject({ Bucket: bucket, Key: key });
  const byteArray = await output.Body?.transformToByteArray();

  return byteArray || null;
}
