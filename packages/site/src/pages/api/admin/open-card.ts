import type { APIRoute } from 'astro';
import { validateSearchParams } from '@core/lib/api';
import { openCardFromPack } from '@core/lib/open-pack';

// Re-route all API requests to the API server
export const POST: APIRoute = async (ctx) => {
  const validation = validateSearchParams(await ctx.request.text(), {
    instanceId: 'string',
    designId: 'string',
    packId: 'string',
  })

  if (!validation.success) {
    console.error(validation.errors);
    return new Response(JSON.stringify(validation.errors), {
      status: 400,
    })
  }

  const { instanceId, designId, packId } = validation.value;

  console.log('Opening card', { instanceId, designId, packId });
  const result = await openCardFromPack({ instanceId, designId, packId });

  if (!result.success) {
    console.error(result);
    return new Response(result.error || 'There was an error opening the card.', {
      status: 400
    })
  }

  return new Response('Card opened.', { status: 200 })
};
