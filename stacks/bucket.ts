import { StackContext, Bucket, use } from 'sst/constructs'
import { Database } from './database'

export function DesignBucket({ stack }: StackContext) {
	const db = use(Database)

	const cardDesignBucket = new Bucket(stack, 'CardDesigns', {
		notifications: {
			fileUploaded: {
				function: 'packages/functions/src/s3/handle-image-upload.handler',
			},
		},
		defaults: {
			function: {
				bind: [db],
			},
		},
	})

	const frameBucket = new Bucket(stack, 'FrameDesigns', {
		notifications: {
			fileUploaded: {
				function: 'packages/functions/src/s3/handle-frame-upload.handler',
			},
		},
		defaults: {
			function: {
				bind: [db],
			},
		},
	})

	return { cardDesignBucket, frameBucket }
}
