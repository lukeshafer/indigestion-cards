import { validateSearchParams } from '@core/lib/api';
import { createSeason, deleteSeasonById, updateSeason } from '@core/lib/season';
import type { APIRoute } from 'astro';

export const POST: APIRoute = async (ctx) => {
  const formData = await ctx.request.formData();
  const validation = validateSearchParams(new URLSearchParams(formData as unknown as string), {
    seasonId: 'string',
    seasonName: 'string',
    seasonDescription: 'string?',
  });

  if (!validation.success) return new Response(validation.errors.join(' '), { status: 400 });

  const { seasonId, ...rest } = validation.value;

  if (!seasonId.match(/^[a-z0-9-]+$/))
    return new Response('Invalid seasonId. (Must be lowercase, numbers, and dashes only)', {
      status: 400,
    });

  const season = await createSeason({ seasonId, ...rest });

  if (!season.success)
    return new Response(season.error, {
      status: season.error === 'Season already exists' ? 409 : 500,
    });

  return new Response('Season created!', { status: 200 });
};

export const DELETE: APIRoute = async (ctx) => {
  const formData = await ctx.request.formData();
  const validation = validateSearchParams(new URLSearchParams(formData as unknown as string), {
    seasonId: 'string',
  });

  if (!validation.success) return new Response(validation.errors.join(' '), { status: 400 });

  const result = await deleteSeasonById(validation.value.seasonId);

  if (!result.success)
    return new Response(result.error, {
      status: result.error === 'Season does not exist' ? 404 : 500,
    });

  return new Response('Season deleted!', { status: 200 });
};

export const PATCH: APIRoute = async (ctx) => {
  const formData = await ctx.request.formData();
  const validation = validateSearchParams(new URLSearchParams(formData as unknown as string), {
    seasonId: 'string',
    seasonName: 'string',
    seasonDescription: 'string?',
  });

  if (!validation.success) return new Response(validation.errors.join(' '), { status: 400 });

  const result = await updateSeason(validation.value);

  if (!result.success)
    return new Response(result.error, {
      status: result.error === 'Season does not exist' ? 404 : 500,
    });

  return new Response('Season updated!', { status: 200 });
};
