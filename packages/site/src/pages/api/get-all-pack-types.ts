import { getAllPackTypes } from '@lil-indigestion-cards/core/card';
import type { APIRoute } from 'astro';

export const get: APIRoute = async () => {
	const packTypes = await getAllPackTypes();

	return new Response(
		JSON.stringify(
			packTypes.map(({ packTypeName, packTypeId }) => ({ packTypeName, packTypeId }))
		),
		{
			status: 200,
			headers: {
				'content-type': 'application/json',
			},
		}
	);
};
