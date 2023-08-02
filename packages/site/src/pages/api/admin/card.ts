import type { APIRoute } from 'astro';
import { openCardFromPack } from '@lil-indigestion-cards/core/card';

export const patch: APIRoute = async (ctx) => {
	const params = new URLSearchParams(await ctx.request.text());

	console.log(params.toString());

	const instanceId = params.get('instanceId');
	const designId = params.get('designId');
	const packId = params.get('packId');

	if (!instanceId || !designId || !packId) {
		console.error({
			message: 'Instance ID, design ID, and packId are required',
			instanceId,
			designId,
		});
		return new Response('Instance ID, design ID, and packId are required', { status: 400 });
	}

	const result = await openCardFromPack({ instanceId, designId, packId });

	if (!result.success) {
		console.error(result);
		return new Response('There was an error opening the card.', { status: 400 });
	}

	return new Response('Card opened successfully', { status: 200 });
};
