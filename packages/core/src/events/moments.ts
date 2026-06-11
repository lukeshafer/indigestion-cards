import { EventBridge } from '@aws-sdk/client-eventbridge';
import { Resource } from 'sst';
const eventBridge = new EventBridge();

export type MomentDetail = {
	userId: string;
	username: string;
};

export async function sendMomentEvent(detail: MomentDetail) {
	await eventBridge.putEvents({
		Entries: [
			{
				Source: 'site',
				DetailType: 'moment-redeemed',
				Detail: JSON.stringify(detail),
				EventBusName: Resource.EventBus.name,
			},
		],
	});
}
