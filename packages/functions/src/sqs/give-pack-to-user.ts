import {
	addUnopenedPacks,
	checkIfUserExists,
	createNewUser,
} from '@lil-indigestion-cards/core/user'
import { SQSEvent } from 'aws-lambda'
import { z } from 'zod'

export async function handler(event: SQSEvent) {
	const schema = z.object({
		detail: z.object({
			userId: z.string(),
			username: z.string(),
			packCount: z.number(),
		}),
	})

	try {
		for (const record of event.Records) {
			const unparsed = JSON.parse(record.body)
			const { detail } = schema.parse(unparsed)

			if (!(await checkIfUserExists(detail.userId))) {
				console.log('User does not exist, creating user')
				await createNewUser({
					userId: detail.userId,
					username: detail.username,
				})
			}

			await addUnopenedPacks({
				userId: detail.userId,
				packCount: detail.packCount,
				username: detail.username,
			})
		}
	} catch (error) {
		if (error instanceof z.ZodError) {
			throw new Error('Invalid event')
		}
		if (error instanceof Error) {
			console.error(error.message)
			throw error
		}
	}
}
