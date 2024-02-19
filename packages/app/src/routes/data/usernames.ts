import { TypedResponse, createLoader } from '@/lib/api';
import { getAllUsers } from '@lib/user';
import { APIHandler } from '@solidjs/start/server/types';

export const { GET, load } = createLoader(async () => {
  const users = (await getAllUsers())
    .map(user => user.username)
    .sort((a, b) => a.localeCompare(b));

  return users;
});
