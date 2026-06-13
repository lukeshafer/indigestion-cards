import { validateSearchParams } from '@core/lib/api';
import { createPackForNoUser, givePackToUser, deleteFirstPackForUser, getPackById, updatePackUser } from '@core/lib/pack';
import { getUserByLogin } from '@core/lib/twitch';
import { getUserByUserName } from '@core/lib/user';
import { packSchema, packSchemaWithoutUser } from '@core/lib/entity-schemas';
import { broadcastMessage } from '@core/lib/ws';
import type { APIRoute } from 'astro';

export const POST: APIRoute = async (ctx) => {
  const formData = await ctx.request.formData();
  const validation = validateSearchParams(new URLSearchParams(formData as unknown as string), {
    username: 'string?',
    count: 'number?',
    userId: 'string?',
    packType: 'string',
  });

  if (!validation.success) return new Response(validation.errors.join(' '), { status: 400 });

  const p = validation.value;
  const username = p.username;
  const userId = username
    ? (p.userId ?? (await getUserByLogin(username))?.id ?? null)
    : null;
  const packCount = p.count || 1;

  if (username && !userId)
    return new Response(`User ${username} does not exist`, { status: 400 });

  try {
    const packType = JSON.parse(p.packType);

    if (!username || !userId) {
      const parseResult = packSchemaWithoutUser.safeParse({
        packCount,
        packType,
        event: {},
      });
      if (!parseResult.success) {
        return new Response(parseResult.error.message, { status: 400 });
      }
      await createPackForNoUser({
        ...parseResult.data,
        event: {
          eventType: 'admin-site',
        },
      });
    } else {
      const parseResult = packSchema.safeParse({ userId, username, packCount, packType });
      if (!parseResult.success) {
        return new Response(parseResult.error.message, { status: 400 });
      }
      await givePackToUser({
        ...parseResult.data,
        event: {
          eventType: 'admin-site',
        },
      });
    }

    await broadcastMessage({ messageData: 'REFRESH_PACKS' }).then(console.log);

    return new Response(username ? `Pack given to ${username}` : `Pack created`, { status: 200 });
  } catch (error) {
    console.error(error);
    if (error instanceof Error) return new Response(error.message, { status: 400 });
    else return new Response('Unknown error', { status: 400 });
  }
};

export const PATCH: APIRoute = async (ctx) => {
  const formData = await ctx.request.formData();
  const validation = validateSearchParams(new URLSearchParams(formData as unknown as string), {
    packId: 'string',
    username: 'string',
  });

  if (!validation.success) return new Response(validation.errors.join(' '), { status: 400 });

  const { packId, username } = validation.value;

  const pack = await getPackById({ packId });
  if (!pack) return new Response('Pack not found', { status: 404 });

  const userId =
    (await getUserByUserName(username))?.userId ?? (await getUserByLogin(username))?.id;

  if (!userId) return new Response('User not found', { status: 404 });

  if (pack.username !== username) {
    await updatePackUser({ packId, userId, username });
    return new Response('Pack updated', { status: 200 });
  }

  return new Response('Pack already assigned to user', { status: 200 });
};

export const DELETE: APIRoute = async (ctx) => {
  const formData = await ctx.request.formData();
  const validation = validateSearchParams(new URLSearchParams(formData as unknown as string), {
    username: 'string',
    userId: 'string',
  });

  if (!validation.success) return new Response(validation.errors.join(' '), { status: 400 });

  const { username, userId } = validation.value;

  const result = await deleteFirstPackForUser({ userId, username });
  if (!result.success) return new Response(result.error, { status: 400 });

  return new Response(`Deleted 1 pack for ${username}`, { status: 200 });
};
