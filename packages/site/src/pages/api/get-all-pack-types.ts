import { getAllPackTypes } from '@lil-indigestion-cards/core/card';
import type { APIRoute } from 'astro';

export const get: APIRoute = async (ctx) => {
	const packTypes = await getAllPackTypes();

	return {
		statusCode: 200,
		body: JSON.stringify(
			packTypes.map(({ packTypeName, packTypeId }) => ({ packTypeName, packTypeId }))
		),
	};
};
