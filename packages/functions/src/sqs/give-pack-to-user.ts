import type { SQSEvent } from 'aws-lambda';
import { z } from 'zod';
import { givePackToUser } from '@core/lib/pack';
import { packSchema } from '@core/lib/entity-schemas';
import { setAdminEnvSession } from '@core/lib/session';
import { createPreorder } from '@core/lib/preorder';
import { PackTypeIsOutOfCardsError } from '@core/lib/errors';

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
			await givePackToUser(packDetails).catch((error) => {
				console.log('Error giving pack to user: ', error?.message);
				if (error instanceof PackTypeIsOutOfCardsError) {
					console.log('Pack type is out of cards, creating preorder(s) instead', { error })

					for (let i = 0; i < error.count; i++) {
						createPreorder({
							username: packDetails.username,
							userId: packDetails.userId,
						});
					}
				} else throw error;
			});
		} catch (error) {
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
