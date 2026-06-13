import { getUser } from '@core/lib/user';
import { getAllPacks } from '@core/lib/pack';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async (ctx) => {
  const userId = ctx.url.searchParams.get('userId');

  if (userId) {
    const user = await getUser(userId);
    const packCount = user?.packCount ?? 0;
    return new Response(JSON.stringify({ packCount }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const packs = await getAllPacks();
  const packCount = packs.length;
  return new Response(JSON.stringify({ packCount }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
