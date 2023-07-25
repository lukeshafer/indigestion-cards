import type { APIRoute } from 'astro';
import { type Category, getPackTypeContents } from '@/lib/packType';
import { createPackType, deletePackTypeById } from '@lil-indigestion-cards/core/card';
import { routes } from '@/constants';

export const post: APIRoute = async (ctx) => {
	const params = new URLSearchParams(await ctx.request.text());
	const packTypeName = params.get('packTypeName');
	const packTypeId = params.get('packTypeId');
	const description = params.get('description');
	const cardCountPerPack = params.get('cardCountPerPack');
	const category = params.get('category') as Category;
	const seasonString = params.get('season');
	const cardDesigns = params.get('cardDesigns');

	const errorList: string[] = [];

	if (!packTypeName) errorList.push('Missing packTypeName.');
	if (!packTypeId) errorList.push('Missing packTypeId.');
	if (!cardCountPerPack || !Number(cardCountPerPack)) errorList.push('Missing cardCountPerPack.');
	if (!category) errorList.push('Missing category.');
	if (category === 'season' && !seasonString) errorList.push('Missing season.');
	if (category === 'custom' && !cardDesigns) errorList.push('Missing cardDesigns.');

	if (errorList.length) return new Response(errorList.join(' '), { status: 400 });

	const contents = getPackTypeContents({ category, season: seasonString, cardDesigns });
	if (!contents.success) return new Response(contents.error, { status: 400 });

	const season = contents.season;
	const designs = contents.designs;

	const result = await createPackType({
		packTypeName: packTypeName!,
		packTypeId: packTypeId!,
		packTypeDescription: description || undefined,
		cardCount: Number(cardCountPerPack!),
		packTypeCategory: category!,
		seasonId: season?.seasonId,
		seasonName: season?.seasonName,
		designs: designs || undefined,
	});

	if (!result.success)
		return new Response(result.error, {
			status: result.error === 'Pack type already exists' ? 409 : 500,
		});

	return ctx.redirect(`${routes.PACK_TYPES}?alert=Pack%20type%20created!&type=success`);
};

export const del: APIRoute = async (ctx) => {
	const params = new URLSearchParams(await ctx.request.text());

	const packTypeId = params.get('packTypeId');
	if (!packTypeId) return new Response('Missing packTypeId', { status: 400 });

	const result = await deletePackTypeById({ packTypeId });
	if (!result.success) return new Response('Failed to delete pack type', { status: 500 });

	return ctx.redirect(`${routes.PACK_TYPES}?alert=Pack%20type%20deleted!&type=success`);
};
