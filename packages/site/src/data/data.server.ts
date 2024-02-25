import { z } from 'astro/zod';
import { createData, createLoader } from '@/data/lib/server';
import type { DataOutput } from './lib/utils';

// db calls
import { getAllCardDesigns, getCardDesignAndOpenedInstances } from '@lib/design';
import { getUserByUserName, getAllUsersSortedByName } from '@lib/user';
import { getTrade } from '@lib/trades';
import { getRarityRanking, getSiteConfig } from '@lib/site-config';
import { getPackCount, getPacksRemaining } from '@lib/pack';
import { getAllPreorders } from '@lib/preorder';

export type Output<T extends keyof Data> = DataOutput<Data, T>
export type Data = (typeof server)['data'];
export const server = createData({
  users: createLoader(async () => getAllUsersSortedByName()),
  usernames: createLoader(async () =>
    getAllUsersSortedByName().then(users => users.map(user => user.username))
  ),
  user: createLoader(
    z.object({
      username: z.string(),
    }),
    async ({ username }) => getUserByUserName(username)
  ),

  designs: createLoader(async () => getAllCardDesigns()),
  card: createLoader(z.object({ designId: z.string() }), async ({ designId }) =>
  {
      console.log("getting card design", {designId})
      const card = await  getCardDesignAndOpenedInstances({ designId })
      console.log("card", card)
      return card
    }
  ),

  packsRemaining: createLoader(() => getPacksRemaining()),
  packCount: createLoader(async () => getPackCount()),
  preorders: createLoader(() => getAllPreorders()),

  trades: createLoader(
    z.object({
      tradeId: z.string(),
    }),
    async ({ tradeId }) => getTrade(tradeId)
  ),
  siteConfig: createLoader(() => getSiteConfig()),
  rarityRanking: createLoader(() => getRarityRanking())
});
