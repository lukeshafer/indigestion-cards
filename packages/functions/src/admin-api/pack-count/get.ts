import { useQueryParam } from 'sstv2/node/api';
import { SiteHandler } from '@core/lib/api';
import { getUser } from '@core/lib/user';
import { getAllPacks } from '@core/lib/pack';

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
