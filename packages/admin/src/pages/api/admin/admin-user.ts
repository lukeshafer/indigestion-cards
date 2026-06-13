import { validateSearchParams } from '@core/lib/api';
import { createAdminUser, deleteAdminUser, getAllAdminUsers } from '@core/lib/admin-user';
import { getUserByLogin } from '@core/lib/twitch';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const users = await getAllAdminUsers();

  return new Response(
    JSON.stringify(
      users.map((user) => ({
        username: user.username,
        userId: user.userId,
        isStreamer: user.isStreamer,
      }))
    ),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};

export const POST: APIRoute = async (ctx) => {
  const formData = await ctx.request.formData();
  const validation = validateSearchParams(new URLSearchParams(formData as unknown as string), {
    username: 'string',
  });

  if (!validation.success) return new Response(validation.errors.join(' '), { status: 400 });

  const { username } = validation.value;
  const user = await getUserByLogin(username);

  if (!user) return new Response('Twitch user not found', { status: 404 });

  const { display_name, id } = user;
  const createResult = await createAdminUser({ userId: id, username: display_name });
  if (!createResult.success)
    return new Response('An error occurred while creating the user.', { status: 500 });

  return new Response(`Successfully created user ${display_name} (ID: ${id})`, { status: 200 });
};

export const DELETE: APIRoute = async (ctx) => {
  const formData = await ctx.request.formData();
  const validation = validateSearchParams(new URLSearchParams(formData as unknown as string), {
    userId: 'string',
    username: 'string',
    isStreamer: 'boolean',
  });

  if (!validation.success) return new Response(validation.errors.join(' '), { status: 400 });

  const { userId, username, isStreamer } = validation.value;

  const result = await deleteAdminUser({ userId, username, isStreamer });

  if (!result.success)
    return new Response('An error occurred while deleting the user.', { status: 500 });

  return new Response(`Successfully deleted user ${username} (ID: ${userId})`, { status: 200 });
};
