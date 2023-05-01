import { updateRarity } from '@lil-indigestion-cards/core/card';
import { ApiHandler, useFormValue } from 'sst/node/api';
import { useSession } from 'sst/node/future/auth';

export const handler = ApiHandler(async () => {
	const session = useSession();
	if (session.type !== 'admin')
		return {
			statusCode: 401,
			body: 'Unauthorized',
		};

	const rarityId = useFormValue('rarityId');
	const rarityName = useFormValue('rarityName') ?? undefined;
	const defaultCount = parseInt(useFormValue('defaultCount') || '0') || undefined;

	if (!rarityId) {
		return {
			statusCode: 400,
			body: 'Missing rarityId',
		};
	}

	await updateRarity({
		rarityId,
		rarityName,
		defaultCount,
	});

	return {
		statusCode: 200,
		body: `Updated rarity ${rarityId}`,
	};
});
