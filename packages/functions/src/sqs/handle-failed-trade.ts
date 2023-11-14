import type { SQSEvent } from 'aws-lambda';
import { z } from 'zod';
import { getTrade, updateTrade } from '@lil-indigestion-cards/core/lib/trades';
import { addMessageToSiteConfig } from '@lib/site-config';

const tradeEvent = z.object({
   detail: z.object({
      tradeId: z.string(),
   }),
});

export async function handler(event: SQSEvent) {
   for (const record of event.Records) {
      try {
         const data = tradeEvent.parse(JSON.parse(record.body));
         const trade = await getTrade(data.detail.tradeId);

         if (trade.status === 'accepted') {
            await updateTrade(trade.tradeId, {
               status: 'failed',
            });
         }
      } catch (error) {
         console.error({ message: 'An error occurred processing the trade', error, record });
         if (error instanceof z.ZodError) {
            throw new Error('Invalid event');
         } else if (error instanceof Error) {
            console.error(error.message);
            throw error;
         }
         throw error;
      } finally {
         addMessageToSiteConfig({
            type: 'error',
            message: `An error occurred processing the following request Twitch: ${JSON.stringify(
               record
            )}`,
         });
      }
   }
}
