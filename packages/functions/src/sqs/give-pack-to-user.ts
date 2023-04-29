import { SQSEvent } from 'aws-lambda';
import { z } from 'zod';
import { givePackToUser, packSchema } from '@lil-indigestion-cards/core/pack';

export async function handler(event: SQSEvent) {
	for (const record of event.Records) {
		try {
			const unparsed = JSON.parse(record.body);
			if (!('detail' in unparsed)) {
				throw new Error('Invalid event');
			}

			const packDetails = packSchema.parse(unparsed.detail);
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
