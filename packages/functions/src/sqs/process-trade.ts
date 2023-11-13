import type { SQSEvent } from 'aws-lambda';
import { z } from 'zod';
import { getTrade, processTrade } from '@lil-indigestion-cards/core/lib/trades';

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

         if (!trade) {
            console.log('Trade not found, should not process.', { data });
            throw new Error('Trade not found, should not process.');
         } else if (trade?.status !== 'accepted') {
            console.log('Trade not accepted, should not process.', { trade });
            throw new Error('Trade not accepted, should not process.');
         }

         await processTrade(trade);
      } catch (error) {
         console.error({ message: 'An error occurred processing the trade', error, record });
         if (error instanceof z.ZodError) {
            throw new Error('Invalid event');
         } else if (error instanceof Error) {
            console.error(error.message);
            throw error;
         }
         throw error;
      }
   }
}
