import type { APIHandler } from '@solidjs/start/server/types';
import { TypedResponse, createLoader } from '@/lib/api';
import { getTrade } from '@lil-indigestion-cards/core/lib/trades';
import { object, string } from 'valibot';

export const { GET, load } = createLoader(
  object({
    tradeId: string(),
  }),
  async ({ tradeId }) => {
    if (!tradeId) throw new Error('No tradeId provided');
    const trade = await getTrade(tradeId);
    return trade;
  }
);
