import { ProtectedApiHandler } from '@lil-indigestion-cards/core/api';
import { useQueryParam } from 'sst/node/api';
import { getUser } from '@lil-indigestion-cards/core/user';
import { getAllPacks } from '@lil-indigestion-cards/core/card';

export const handler = ProtectedApiHandler(async () => {
	const userId = useQueryParam('userId');

	if (userId) {
		const user = await getUser(userId);
		const packCount = user?.packCount ?? 0;
		return { statusCode: 200, body: JSON.stringify({ packCount }) };
	}

	const packs = await getAllPacks();
	const packCount = packs.length;
	return { statusCode: 200, body: JSON.stringify({ packCount }) };
});