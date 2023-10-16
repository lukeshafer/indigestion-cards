import { SQSEvent } from 'aws-lambda';
import { addMessageToSiteConfig } from '@lil-indigestion-cards/core/lib/site-config';

export async function handler(event: SQSEvent) {
	await Promise.all(
		event.Records.map((record) =>
			addMessageToSiteConfig({
				type: 'error',
				message: `An error occurred processing the following request Twitch: ${record.body}`,
			})
		)
	);
}
