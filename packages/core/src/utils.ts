import { S3 } from 'aws-sdk';

export async function deleteS3ObjectByUrl(url: string) {
	const s3 = new S3();
	const { Bucket, Key } = parseS3Url(url);
	const result = await s3.deleteObject({ Bucket, Key }).promise();
	return result;
}

export function parseS3Url(urlString: string) {
	const url = new URL(urlString);
	const bucket = url.hostname.split('.')[0];
	const key = url.pathname.slice(1);
	return { Bucket: bucket, Key: key };
}

export function html(...args: Parameters<typeof String.raw>) {
	const str = String.raw(...args);

	return {
		statusCode: 200,
		headers: {
			'Content-Type': 'text/html',
		},
		body: str,
	};
}
