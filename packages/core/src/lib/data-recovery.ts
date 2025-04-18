import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
// import { Resource } from 'sst';

const s3 = new S3Client();

export async function getDataRecoveryInfo(name: string): Promise<string | undefined> {
	const result = await s3.send(
		new GetObjectCommand({
			Key: name,
			Bucket: "", // FIXME: pls
		})
	);

	return result.Body?.transformToString('utf8');
}

export async function putDataRecoveryInfo(name: string, data: object): Promise<void> {
	await s3.send(
		new PutObjectCommand({
			Key: name,
			Bucket: "", // FIXME: pls
			Body: JSON.stringify(data),
		})
	);
}
