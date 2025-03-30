import { S3, type DeleteObjectCommandOutput } from '@aws-sdk/client-s3';

export async function moveImageBetweenBuckets(args: {
	sourceBucket: string;
	key: string;
	destinationBucket: string;
}): Promise<void> {
	const s3 = new S3();

	await s3.copyObject({
		Bucket: args.destinationBucket,
		CopySource: encodeURI(`${args.sourceBucket}/${args.key}`),
		Key: args.key,
		ACL: 'public-read',
	});

	await s3.deleteObject({
		Bucket: args.sourceBucket,
		Key: args.key,
	});
}

export async function deleteS3ObjectByUrl(url: string): Promise<DeleteObjectCommandOutput> {
	const s3 = new S3();
	const { Bucket, Key } = parseS3Url(url);
	const result = await s3.deleteObject({ Bucket, Key });
	return result;
}

export function parseS3Url(urlString: string): { Bucket: string; Key: string } {
	const url = new URL(urlString);
	const bucket = url.hostname.split('.')[0];
	const key = url.pathname.slice(1);
	return { Bucket: bucket, Key: key };
}

export function createS3Url(args: { bucket: string; key: string }): string {
	return encodeURI(`https://${args.bucket}.s3.amazonaws.com/${args.key}`);
}
