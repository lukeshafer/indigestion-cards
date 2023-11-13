import { SiteHandler } from '@lib/api';
import { S3 } from '@aws-sdk/client-s3';
import { deleteUnmatchedDesignImage } from '@lib/unmatched-image';
import { Bucket } from 'sst/node/bucket';

export const handler = SiteHandler(
	{
		authorizationType: 'admin',
		schema: {
			key: 'string',
			type: 'string',
		},
	},
	async (_, { params }) => {
		const { key, type } = params;

		if (type !== 'cardDesign' && type !== 'frame') {
			return {
				statusCode: 400,
				body: 'Invalid type: must be either "cardDesign" or "frame"',
			};
		}

		const bucketName = {
			cardDesign: Bucket.CardDrafts.bucketName,
			frame: Bucket.FrameDrafts.bucketName,
		}[type];

		const s3 = new S3();
		try {
			await deleteUnmatchedDesignImage({ imageId: key, type });
			await s3.deleteObject({
				Bucket: bucketName,
				Key: key,
			});

			return {
				statusCode: 200,
				body: 'Successfully deleted unused image',
			};
		} catch (error) {
			console.error(error);
			return {
				statusCode: 500,
				body: JSON.stringify(error),
			};
		}
	}
);
