import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { Bucket } from 'sst/node/bucket';

const s3 = new S3Client();

export async function getDataRecoveryInfo(name: string) {
	const result = await s3.send(
		new GetObjectCommand({
			Key: name,
			Bucket: Bucket.DataRecoveryBucket.bucketName,
		})
	);

	return result.Body?.transformToString('utf8');
}

export async function putDataRecoveryInfo(name: string, data: object) {
	await s3.send(
		new PutObjectCommand({
			Key: name,
			Bucket: Bucket.DataRecoveryBucket.bucketName,
			Body: JSON.stringify(data),
		})
	);
}
