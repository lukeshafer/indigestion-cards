import { validateSearchParams } from '@core/lib/api';
import { updateFaq } from '@core/lib/site-config';
import type { APIRoute } from 'astro';

export const PATCH: APIRoute = async (ctx) => {
  const formData = await ctx.request.formData();
  const validation = validateSearchParams(new URLSearchParams(formData as unknown as string), {
    content: 'string',
  });

  if (!validation.success) return new Response(validation.errors.join(' '), { status: 400 });

  const { content } = validation.value;

  await updateFaq(content);
  return new Response('FAQ Updated', { status: 200 });
};
