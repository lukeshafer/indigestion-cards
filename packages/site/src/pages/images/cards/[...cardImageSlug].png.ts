import { getCardDesignById } from '@lil-indigestion-cards/core/lib/design';
import { getCardInstanceByDesignAndRarity } from '@lil-indigestion-cards/core/lib/card';
import { getRarityById } from '@lil-indigestion-cards/core/lib/rarity';
import sharp from 'sharp';
import type { APIContext, APIRoute } from 'astro';
import { cacheControl } from '@/lib/api';
import { FULL_ART_ID, LEGACY_CARD_ID } from '@/constants';

export const GET: APIRoute = async ctx => {
	const FOUR04 = new Response(null, { status: 404 });

	const slug = ctx.params.cardImageSlug;
	if (!slug) return FOUR04;

	const [designId, rarityId] = slug.split('/');
	if (!designId || !rarityId) return FOUR04;

	const images = await getImages({ designId, rarityId, ctx });

	if (images === null) return FOUR04;

	const [designImgFrameBuffer, rarityImgFrameBuffer] = await Promise.all([
		fetch(images.cardImgUrl).then(res => res.arrayBuffer()),
		images.frameImgUrl ? fetch(images.frameImgUrl).then(res => res.arrayBuffer()) : null,
	]);
	const IMG_SIZE = [588, 816] as const;

	const designImg = sharp(designImgFrameBuffer).resize(...IMG_SIZE);

	const combined =
		rarityImgFrameBuffer === null
			? designImg
			: designImg.composite([
					{
						input: await sharp(rarityImgFrameBuffer)
							.resize(...IMG_SIZE)
							.png()
							.toBuffer(),
					},
				]);

	const outputBuffer = await combined.png().toBuffer();

	return new Response(outputBuffer, {
		headers: {
			'Content-Type': 'image/png',
			'Content-Length': String(outputBuffer.length),
			'Cache-Control': cacheControl({
        maxAge: 60 * 60 * 24 * 30,
				public: ctx.locals.session?.type === 'admin' ? false : true,
        staleWhileRevalidate: 60 * 60 * 24 * 365,
			}),
		},
	});
};

async function getImages({
	designId,
	rarityId,
	ctx,
}: {
	designId: string;
	rarityId: string;
	ctx: APIContext;
}): Promise<{
	cardImgUrl: string;
	frameImgUrl: string;
} | null> {
	const cards = await getCardInstanceByDesignAndRarity({ designId, rarityId });
  const card = cards.find(c => c.openedAt)
	if (card)
		return {
			cardImgUrl: card.imgUrl,
			frameImgUrl: card.frameUrl,
		};
	else if (ctx.locals.session?.type !== 'admin') return null;

	const [design, rarity] = await Promise.all([
		getCardDesignById({ designId }),
		getRarityById({ rarityId }),
	]);

	if (!design) return null;
	else if (rarityId === FULL_ART_ID || rarityId === LEGACY_CARD_ID) {
		return {
			cardImgUrl: design.imgUrl,
			frameImgUrl: '',
		};
	} else if (!rarity) return null;
	else
		return {
			cardImgUrl: design.imgUrl,
			frameImgUrl: rarity.frameUrl,
		};
}
