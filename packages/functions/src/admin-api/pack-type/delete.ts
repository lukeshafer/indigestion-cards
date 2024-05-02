import { SiteHandler } from '@core/lib/api';
import { deletePackTypeById } from '@core/lib/pack-type';

export const handler = SiteHandler(
	{
		authorizationType: 'admin',
		schema: {
			packTypeId: 'string',
		},
	},
	async (_, { params }) => {
		const result = await deletePackTypeById({ packTypeId: params.packTypeId });
		if (!result.success) return { statusCode: 500, body: 'Failed to delete pack type' };

		return { statusCode: 200, body: 'Pack type deleted!' };
	}
);
