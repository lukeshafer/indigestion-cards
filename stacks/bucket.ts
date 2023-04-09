import { StackContext, Bucket, use } from 'sst/constructs'
import { Database } from './database'

export function DesignBucket({ stack }: StackContext) {
	const db = use(Database)

	const bucket = new Bucket(stack, 'CardDesigns', {
		notifications: {
			fileUploaded: {
				function: 'packages/functions/src/handle-image-upload.handler',
			},
		},
		defaults: {
			function: {
				bind: [db],
			},
		},
	})

	return bucket
}
