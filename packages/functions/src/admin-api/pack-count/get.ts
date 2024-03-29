import { useQueryParam } from 'sst/node/api';
import { SiteHandler } from '@lib/api';
import { getUser } from '@lib/user';
import { getAllPacks } from '@lib/pack';

export const handler = SiteHandler({ authorizationType: 'admin' }, async () => {
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
