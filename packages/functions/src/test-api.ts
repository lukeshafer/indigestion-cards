import { ApiHandler, useBody, useHeader } from 'sst/node/api'
import { parse } from 'parse-multipart-data'
import { S3 } from 'aws-sdk'

export const handler = ApiHandler(async (e) => {
	const s3 = new S3()

	const contentType = useHeader('content-type')
	const boundary = contentType?.split('boundary=')[1]

	if (!boundary) {
		return {
			statusCode: 400,
			body: 'Missing boundary',
		}
	}

	const body = useBody()
	if (!body) {
		return {
			statusCode: 400,
			body: 'Missing body',
		}
	}

	const buffer = Buffer.from(body, 'binary')
	const parts = parse(buffer, boundary)
	console.log(parts.map((part) => part.data.toString()))

	return {
		statusCode: 200,
		body: JSON.stringify(parts),
	}
})
