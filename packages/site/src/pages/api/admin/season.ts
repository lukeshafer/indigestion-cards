//import type { APIRoute } from 'astro';
//import { createSeason, deleteSeasonById, updateSeason } from '@lil-indigestion-cards/core/card';
//import { routes } from '@/constants';

//export const post: APIRoute = async (ctx) => {
	//const params = new URLSearchParams(await ctx.request.text());

	//const seasonName = params.get('seasonName');
	//const seasonId = params.get('seasonId');
	//const seasonDescription = params.get('seasonDescription') ?? undefined;

	//const errors = [];
	//if (!seasonName) errors.push('Missing name');
	//if (!seasonId) errors.push('Missing seasonId');
	//if (seasonId && !seasonId!.match(/^[a-z0-9-]+$/))
		//errors.push('Invalid seasonId. (Must be lowercase, numbers, and dashes only)');
	//if (errors.length) return new Response(errors.join(', '), { status: 400 });

	//const result = await createSeason({
		//seasonId: seasonId!,
		//seasonName: seasonName!,
		//seasonDescription,
	//});

	//if (!result.success)
		//return new Response(result.error, {
			//status: result.error === 'Season already exists' ? 409 : 500,
		//});

	//return ctx.redirect(`${routes.SEASONS}/${seasonId}?alert=Season%20created!&type=success`);
//};

//export const del: APIRoute = async (ctx) => {
	//const params = new URLSearchParams(await ctx.request.text());

	//const seasonId = params.get('seasonId');
	//const seasonName = params.get('seasonName');
	//if (!seasonId) return new Response('Missing seasonId', { status: 400 });

	//const result = await deleteSeasonById(seasonId);

	//if (!result.success)
		//return new Response(result.error, {
			//status: result.error === 'Season does not exist' ? 404 : 500,
		//});

	//return ctx.redirect(`${routes.SEASONS}?alert=Season%20deleted!&type=success`);
//};

//export const patch: APIRoute = async (ctx) => {
	//const params = new URLSearchParams(await ctx.request.text());

	//const errors = [];
	//const seasonId = params.get('seasonId');
	//if (!seasonId) errors.push('Missing seasonId');
	//const seasonName = params.get('seasonName');
	//if (!seasonName) errors.push('Missing seasonName');
	//const seasonDescription = params.get('seasonDescription') || '';
	//if (errors.length) return new Response(errors.join(', '), { status: 400 });

	//const result = await updateSeason({
		//seasonId: seasonId!,
		//seasonName: seasonName!,
		//seasonDescription,
	//});

	//if (!result.success)
		//return new Response(result.error, {
			//status: result.error === 'Season does not exist' ? 404 : 500,
		//});

	//return new Response('Season updated', { status: 200 });
//};
