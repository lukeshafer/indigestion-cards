import { getAllPackTypes } from '@core/lib/pack-type';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
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
