import type { SQSEvent } from 'aws-lambda';
import { z } from 'zod';
import { getTrade, setTradeStatusToFailed } from '@core/lib/trades';
import { addMessageToSiteConfig } from '@core/lib/site-config';

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
        await setTradeStatusToFailed(
          trade.tradeId,
          'The trade failed to process for an unknown reason. Please try another trade, or reach out to SnailyLuke if the problem persists.',
        );
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
