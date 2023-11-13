import { SiteHandler } from '@lil-indigestion-cards/core/lib/api';
import { getTrade, updateTrade } from '@lil-indigestion-cards/core/lib/trades';
import { EventBridge } from '@aws-sdk/client-eventbridge';
import { EventBus } from 'sst/node/event-bus';

const eventBridge = new EventBridge();

export const handler = SiteHandler(
   {
      authorizationType: 'user',
      schema: {
         tradeId: 'string',
         status: 'string?',
      },
   },
   async (_, ctx) => {
      const { params, session } = ctx;

      const trade = await getTrade(params.tradeId);

      if (!trade) {
         return {
            statusCode: 404,
            body: JSON.stringify({
               error: 'Trade not found',
            }),
         };
      }

      if (trade.senderUserId !== session.userId && trade.receiverUserId !== session.userId) {
         return {
            statusCode: 401,
            body: JSON.stringify({
               error: 'Unauthorized',
            }),
         };
      }

      switch (params.status) {
         case 'accepted':
            if (trade.receiverUserId !== session.userId)
               return {
                  statusCode: 400,
                  body: JSON.stringify({
                     error: 'Only the receiver can accept a trade',
                  }),
               };
            else if (trade.status !== 'pending')
               return {
                  statusCode: 400,
                  body: JSON.stringify({
                     error: 'Cannot accept a trade that is not pending',
                  }),
               };

				await updateTrade(trade.tradeId, { status: 'accepted' });
            await eventBridge.putEvents({
               Entries: [
                  {
                     Source: 'site',
                     DetailType: 'trade-accepted',
                     Detail: JSON.stringify({
                        tradeId: trade.tradeId,
                     }),
                     EventBusName: EventBus.eventBus.eventBusName,
                  },
               ],
            });
            return {
               statusCode: 200,
               body: 'Trade accepted',
            };
         case 'rejected':
            if (trade.receiverUserId !== session.userId)
               return {
                  statusCode: 400,
                  body: JSON.stringify({
                     error: 'Only the receiver can reject a trade',
                  }),
               };
            else if (trade.status !== 'pending')
               return {
                  statusCode: 400,
                  body: JSON.stringify({
                     error: 'Cannot reject a trade that is not pending',
                  }),
               };

				await updateTrade(trade.tradeId, { status: 'rejected' });
            return {
               statusCode: 200,
               body: 'Trade rejected',
            };
         case 'canceled':
            if (trade.senderUserId !== session.userId)
               return {
                  statusCode: 400,
                  body: JSON.stringify({
                     error: 'Only the sender can cancel a trade',
                  }),
               };
            else if (trade.status !== 'pending')
               return {
                  statusCode: 400,
                  body: JSON.stringify({
                     error: 'Cannot cancel a trade that is not pending',
                  }),
               };

				await updateTrade(trade.tradeId, { status: 'canceled' });
            return {
               statusCode: 200,
               body: 'Trade canceled',
            };
         default:
            return {
               statusCode: 400,
               body: JSON.stringify({
                  error: 'Invalid status provided',
               }),
            };
      }
   }
);
