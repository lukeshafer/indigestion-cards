import { z } from 'astro/zod';
import { createData, createLoader } from '@data-router/server';

// db calls
import { getAllCardDesigns, getCardDesignAndInstancesById } from '@lib/design';
import { getAllUsers, getUserByUserName } from '@lib/user';
import { getTrade } from '@lib/trades';
import { getSiteConfig } from '@lib/site-config';
import { getAllPacks, getPacksRemaining } from '@lib/pack';

export type Data = (typeof server)['data'];
export const server = createData({
	users: createLoader(async () => {
		const users = (await getAllUsers()).sort((a, b) => a.username.localeCompare(b.username));
		return users;
	}),
	usernames: createLoader(async () => {
		return (await getAllUsers()).map(user => user.username).sort((a, b) => a.localeCompare(b));
	}),
	user: createLoader(
		z.object({
			username: z.string(),
		}),
		async ({ username }) => {
			console.log('fetching user by username', { username });
			return getUserByUserName(username);
		}
	),

	designs: createLoader(async () => {
		return getAllCardDesigns();
	}),
	design: createLoader(
		z.object({
			designId: z.string(),
		}),
		async ({ designId }) => {
			const {
				cardDesigns: [design],
				cardInstances,
			} = await getCardDesignAndInstancesById({ designId });

			return { design, instances: cardInstances.filter(instance => instance.openedAt) };
		}
	),

	'packs-remaining': createLoader(() => getPacksRemaining()),
	'pack-count': createLoader(async () => {
		const packs = await getAllPacks();
		const packCount = packs.length;

		return { packCount };
	}),

	trades: createLoader(
		z.object({
			tradeId: z.string(),
		}),
		async ({ tradeId }) => getTrade(tradeId)
	),
	'site-config': createLoader(() => {
		return getSiteConfig();
	}),
});
