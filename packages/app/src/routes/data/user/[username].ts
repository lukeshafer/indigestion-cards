import type { APIHandler } from '@solidjs/start/server/types';
import { TypedResponse, createLoader } from '@/lib/api';
import { getUserByUserName } from '@lil-indigestion-cards/core/lib/user';
import { object, string } from 'valibot';

export const { GET, load } = createLoader(
  object({
    username: string(),
  }),
  async ({ username }) => {
    if (!username) throw new Error('No username provided');

    const user = await getUserByUserName(username);

    return new TypedResponse(user);
  },
);
