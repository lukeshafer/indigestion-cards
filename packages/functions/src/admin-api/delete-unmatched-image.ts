import { ApiHandler, usePathParam, useQueryParam, useFormValue } from 'sst/node/api'
import { Bucket } from 'sst/node/bucket'
import { deleteUnmatchedDesignImage } from '@lil-indigestion-cards/core/card'
import { S3 } from 'aws-sdk'
import { useSession } from 'sst/node/future/auth'

export const handler = ApiHandler(async () => {
	const session = useSession()
	if (session.type !== 'user')
		return {
			statusCode: 401,
			body: 'Unauthorized',
		}

	const id = usePathParam('id')

	if (!id) {
		return {
			statusCode: 400,
			body: 'Missing id',
		}
	}
	const type = useFormValue('type') || 'n/a'
	const bucketName = {
		cardDesign: Bucket.CardDesigns.bucketName,
		frame: Bucket.FrameDesigns.bucketName,
	}[type]

	if (!bucketName) {
		return {
			statusCode: 400,
			body: 'Missing type',
		}
	}

	const s3 = new S3()
	try {
		const dbResult = deleteUnmatchedDesignImage(id)
		const s3result = s3
			.deleteObject({
				Bucket: bucketName,
				Key: id,
			})
			.promise()

		await Promise.all([dbResult, s3result])

		const redirect = useQueryParam('redirectUrl')

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
