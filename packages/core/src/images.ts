import S3 from 'aws-sdk/clients/s3';

export async function moveImageBetweenBuckets(props: {
	sourceBucket: string;
	key: string;
	destinationBucket: string;
}) {
	const s3 = new S3();

	await s3
		.copyObject({
			Bucket: props.destinationBucket,
			CopySource: encodeURI(`${props.sourceBucket}/${props.key}`),
			Key: props.key,
			ACL: 'public-read',
		})
		.promise();

	await s3
		.deleteObject({
			Bucket: props.sourceBucket,
			Key: props.key,
		})
		.promise();
}
