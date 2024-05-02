import type { APIRoute } from 'astro';
import { TypedResponse } from '@admin/lib/api';
import { getAllUsers } from '@core/lib/user';

export const GET = (async () => {
  const users = (await getAllUsers())
    .map(user => user.username)
    .sort((a, b) => a.localeCompare(b));

  return new TypedResponse(users);
}) satisfies APIRoute;
