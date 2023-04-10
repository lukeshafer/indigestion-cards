import { ApiHandler, usePathParam, useQueryParam } from 'sst/node/api'
import { Bucket } from 'sst/node/bucket'
import { deleteUnmatchedDesignImage } from '@lil-indigestion-cards/core/card'
import { S3 } from 'aws-sdk'

export const handler = ApiHandler(async () => {
	const id = usePathParam('id')

	if (!id) {
		return {
			statusCode: 400,
			body: 'Missing id',
		}
	}
	const s3 = new S3()
	try {
		const dbResult = deleteUnmatchedDesignImage(id)
		const s3result = s3
			.deleteObject({
				Bucket: Bucket.CardDesigns.bucketName,
				Key: id,
			})
			.promise()

		await Promise.all([dbResult, s3result])

		const redirect = useQueryParam('redirectUrl')
		console.log('redirect', redirect)

		return {
			statusCode: 307,
			headers: {
				Location: `${redirect}?message=Successfully deleted unused image` || '/',
			},
		}
	} catch (error) {
		return {
			statusCode: 500,
			body: JSON.stringify(error),
		}
	}
})
