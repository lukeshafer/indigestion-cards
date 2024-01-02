import { EventBridge } from '@aws-sdk/client-eventbridge';
import { EventBus } from 'sst/node/event-bus';

const eventBridge = new EventBridge();

export async function sendTradeAcceptedEvent(opts: { tradeId: string }) {
	await eventBridge.putEvents({
		Entries: [
			{
				Source: 'site',
				DetailType: 'trade-accepted',
				Detail: JSON.stringify({
					tradeId: opts.tradeId,
				}),
				EventBusName: EventBus.eventBus.eventBusName,
			},
		],
	});
}
