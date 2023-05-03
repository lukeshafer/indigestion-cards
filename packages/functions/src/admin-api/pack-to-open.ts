import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { html } from '@lil-indigestion-cards/core/utils';
import { getPackById } from '@lil-indigestion-cards/core/card';
import { useQueryParam, useQueryParams } from 'sst/node/api';

export const GET: APIGatewayProxyHandlerV2 = async (e) => {
	const packId = useQueryParam('packId');
	console.log(e);
	if (!packId) return { statusCode: 400, body: 'Missing packId' };
	const pack = await getPackById({ packId });
	if (!pack) return { statusCode: 404, body: 'Pack not found' };

	return html`
		<h2>Now opening for <span class="username">${pack.username}</span></h2>
		<ul class="cards"></ul>
	`;
};
