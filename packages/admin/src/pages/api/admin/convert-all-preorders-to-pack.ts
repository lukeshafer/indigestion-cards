import type { Preorder } from '@core/types';
import { givePackToUser } from '@core/lib/pack';
import { getPackTypeById } from '@core/lib/pack-type';
import { deletePreorder, getAllPreorders } from '@core/lib/preorder';
import { validateSearchParams } from '@core/lib/api';
import type { APIRoute } from 'astro';

export const POST: APIRoute = async (ctx) => {
  const formData = await ctx.request.formData();
  const validation = validateSearchParams(new URLSearchParams(formData as unknown as string), {
    packTypeId: 'string',
  });

  if (!validation.success) return new Response(validation.errors.join(' '), { status: 400 });

  const { packTypeId } = validation.value;
  const preorders = await getAllPreorders();
  const packType = await getPackTypeById({ packTypeId });

  if (!packType) {
    return new Response('Pack type not found', {
      status: 404,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  const errors: { error: unknown; preorder: Preorder }[] = [];
  for (const preorder of preorders) {
    try {
      await givePackToUser({
        userId: preorder.userId,
        username: preorder.username,
        packCount: 1,
        packType,
      });
      await deletePreorder(preorder);
    } catch (error) {
      console.error(error);
      errors.push({ error, preorder });
    }
  }

  if (errors.length > 0) {
    console.error({ errors });
    return new Response(
      `The following conversions failed:\n${errors
        .map(({ preorder }) => preorder.username)
        .join('\n')}`,
      {
        status: 500,
        headers: { 'Content-Type': 'text/plain' },
      }
    );
  }

  return new Response(null, { status: 200 });
};
