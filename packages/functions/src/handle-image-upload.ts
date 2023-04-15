import { S3Handler } from 'aws-lambda'
import { createUnmatchedDesignImage } from '@lil-indigestion-cards/core/card'

export const handler: S3Handler = async (event) => {
	event.Records.forEach(async (record) => {
		if (record.eventName !== 'ObjectCreated:Post' && record.eventName !== 'ObjectCreated:Put')
			return

		const key = record.s3.object.key
		await createUnmatchedDesignImage({
			url: `https://${record.s3.bucket.name}.s3.amazonaws.com/${key}`,
			imageId: key,
			type: 'cardDesign',
		})
	})
}
