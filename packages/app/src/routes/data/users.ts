import { TypedResponse, createLoader } from '@/lib/api';
import { getAllUsers } from '@lib/user';
import { APIHandler } from '@solidjs/start/server/types';

export const { GET, load } = createLoader(async () => {
  const users = (await getAllUsers()).sort((a, b) => a.username.localeCompare(b.username));
  return users;
})
