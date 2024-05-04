import type { APIContext } from 'astro';
import { getCardsByUserSortedByCardName } from '@core/lib/card';
import { TypedResponse } from '@site/lib/api';

export const GET = async ({ params, url }: APIContext) => {
	if (!params.username) {
		throw new Response('No username provided', { status: 400 });
	}

	const prevCursor = url.searchParams.get('cursor') ?? undefined;

	const { data, cursor } = await getCardsByUserSortedByCardName({
		username: params.username,
		cursor: prevCursor,
	});

	return new TypedResponse({ cursor, data });
};
