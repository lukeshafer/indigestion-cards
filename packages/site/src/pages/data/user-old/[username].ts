import { createLoader } from '@/lib/api';
import { getUserByUserName } from '@lil-indigestion-cards/core/lib/user';
import { z } from 'astro/zod';

export const { GET, load } = createLoader(
	z.object({
		username: z.string(),
	}),
	async params => {
		const { username } = params;
		if (!username) throw new Error('No username provided');

		const user = await getUserByUserName(username);

		return user;
	}
);
