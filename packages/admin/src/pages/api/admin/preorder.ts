import { validateSearchParams } from '@core/lib/api';
import { createNewUser, getUserByUserName } from '@core/lib/user';
import { createPreorder } from '@core/lib/preorder';
import { getUserByLogin } from '@core/lib/twitch';
import type { APIRoute } from 'astro';

export const POST: APIRoute = async (ctx) => {
  const formData = await ctx.request.formData();
  const validation = validateSearchParams(new URLSearchParams(formData as unknown as string), {
    username: 'string',
  });

  if (!validation.success) return new Response(validation.errors.join(' '), { status: 400 });

  const { username } = validation.value;
  let user = await getUserByUserName(username);

  if (!user) {
    const twitch_user = await getUserByLogin(username);
    if (!twitch_user) {
      return new Response('User not found', { status: 404 });
    }

    user = await createNewUser({
      userId: twitch_user.id,
      username: twitch_user.display_name,
    });
  }

  const result = await createPreorder({ userId: user.userId, username: user.username });
  if (!result.success) {
    return new Response(result.error, { status: 500 });
  }

  return new Response('Preorder created', { status: 200 });
};
