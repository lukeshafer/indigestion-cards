import { SiteHandler } from '@lib/api';
import { updateFaq } from '@lib/site-config';

export const handler = SiteHandler(
	{
		authorizationType: 'admin',
		schema: {
			content: 'string',
		},
	},
	async (_, { params }) => {
		const { content } = params;

		await updateFaq(content)
		return { statusCode: 200, body: 'FAQ Updated' };
	}
);
