import { validateSearchParams } from '@core/lib/api';
import { deletePackTypeById } from '@core/lib/pack-type';
import { createPackType } from '@core/lib/pack-type';
import { parsePackTypeContents } from '@core/lib/entity-schemas';
import type { APIRoute } from 'astro';

export const POST: APIRoute = async (ctx) => {
  const formData = await ctx.request.formData();
  const params = Object.fromEntries(formData);
  const validation = validateSearchParams(new URLSearchParams(params as Record<string, string>), {
    packTypeName: 'string',
    packTypeId: 'string',
    description: 'string?',
    cardCountPerPack: 'number',
    category: 'string',
    season: 'string?',
    cardDesigns: 'string?',
  });

  if (!validation.success) return new Response(validation.errors.join(' '), { status: 400 });

  const p = validation.value;

  if (p.category === 'season' && !p.season)
    return new Response('Missing season.', { status: 400 });
  if (p.category === 'custom' && !p.cardDesigns)
    return new Response('Missing cardDesigns.', { status: 400 });
  if (p.category !== 'season' && p.category !== 'custom')
    return new Response('Invalid category: must be "season" or "custom".', { status: 400 });

  const contents = parsePackTypeContents(p);
  if (!contents.success) return new Response(contents.error, { status: 400 });

  const packType = await createPackType({
    packTypeName: p.packTypeName,
    packTypeId: p.packTypeId,
    packTypeDescription: p.description,
    cardCount: p.cardCountPerPack,
    packTypeCategory: p.category,
    seasonId: contents.season?.seasonId,
    seasonName: contents.season?.seasonName,
    designs: contents.designs,
  });

  if (!packType.success) return new Response(packType.error, { status: 500 });

  return new Response('Pack type created!', { status: 200 });
};

export const DELETE: APIRoute = async (ctx) => {
  const formData = await ctx.request.formData();
  const validation = validateSearchParams(new URLSearchParams(formData as unknown as string), {
    packTypeId: 'string',
  });

  if (!validation.success) return new Response(validation.errors.join(' '), { status: 400 });

  const result = await deletePackTypeById({ packTypeId: validation.value.packTypeId });
  if (!result.success) return new Response('Failed to delete pack type', { status: 500 });

  return new Response('Pack type deleted!', { status: 200 });
};
