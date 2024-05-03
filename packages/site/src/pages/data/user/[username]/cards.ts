import type { APIRoute } from 'astro';
import { getCardsByUsername } from '@core/lib/card';

export const GET: APIRoute = async ({ params, url }) => {
	if (!params.username) {
		throw new Response('No username provided', { status: 400 });
	}

	const { data, cursor } = await getCardsByUsername({ username: params.username });

	const cards = data.map(card => ({
		rarityName: card.rarityName,
		cardNumber: card.cardNumber,
		totalOfType: card.totalOfType,
		cardName: card.cardName,
    instanceId: card.instanceId,
	}));

	return new Response(JSON.stringify({ count: cards.length, cards }), {
		headers: {
			'content-type': 'application/json',
		},
	});
};
