import { SQSEvent } from 'aws-lambda';
import { z } from 'zod';
import { givePackToUser, packSchema } from '@lil-indigestion-cards/core/pack';
import { setAdminEnvSession } from '@lil-indigestion-cards/core/user';

export async function handler(event: SQSEvent) {
	console.log('Received event to give pack to user');
	setAdminEnvSession('Event: give-pack-to-user', 'event_give_pack_to_user');
	for (const record of event.Records) {
		try {
			const unparsed = JSON.parse(record.body);
			if (!('detail' in unparsed)) {
				console.error('Invalid event received');
				throw new Error('Invalid event');
			}

			const packDetails = packSchema.parse(unparsed.detail);

			console.log(
				'Pack details: ',
				JSON.stringify(
					{
						username: packDetails.username,
						packCount: packDetails.packCount,
						packType: packDetails.packType.packTypeName,
					},
					null,
					2
				)
			);
			await givePackToUser(packDetails);
		} catch (error) {
			if (error instanceof z.ZodError) {
				throw new Error('Invalid event');
			}
			if (error instanceof Error) {
				console.error(error.message);
				throw error;
			}
			throw error;
		}
	}
}
