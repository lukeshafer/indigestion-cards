import type { APIRoute } from 'astro';
import { openCardFromPack } from '@lil-indigestion-cards/core/card';

export const patch: APIRoute = async (ctx) => {
	const params = new URLSearchParams(await ctx.request.text());

	console.log(params.toString());

	const instanceId = params.get('instanceId');
	const designId = params.get('designId');

	if (!instanceId || !designId)
		return new Response('Instance ID and design ID are required', { status: 400 });

	const result = await openCardFromPack({ instanceId, designId });

	if (!result.success)
		return new Response("There was an error opening the card.", { status: 400 });

	return new Response('Card opened successfully', { status: 200 });
};
