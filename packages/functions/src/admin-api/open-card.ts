import { useJsonBody } from 'sst/node/api';
import { openCardFromPack } from '@lil-indigestion-cards/core/card';

export async function PATCH() {
	const { instanceId, designId } = useJsonBody();
	if (!instanceId || typeof instanceId !== 'string')
		return { statusCode: 400, body: 'Missing instanceId.' };
	if (!designId || typeof designId !== 'string')
		return { statusCode: 400, body: 'Missing designId.' };

	const result = await openCardFromPack({ instanceId, designId });

	if (!result.success) {
		return {
			statusCode: 500,
			body: 'Unable to open card from pack.',
		};
	}

	return {
		statusCode: 200,
		body: JSON.stringify(result.data),
	};
}
