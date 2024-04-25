import type { Preorder } from '@core/types';
import { SiteHandler } from '@core/lib/api';
import { givePackToUser } from '@core/lib/pack';
import { getPackTypeById } from '@core/lib/pack-type';
import { deletePreorder, getAllPreorders } from '@core/lib/preorder';

export const handler = SiteHandler(
	{
		authorizationType: 'admin',
		schema: {
			packTypeId: 'string',
		},
	},
	async (_, ctx) => {
		const { packTypeId } = ctx.params;
		const preorders = await getAllPreorders();
		const packType = await getPackTypeById({ packTypeId });

		if (!packType) {
			return {
				statusCode: 404,
				body: 'Pack type not found',
				headers: {
					'Content-Type': 'text/plain',
				},
			};
		}

		const errors: { error: unknown; preorder: Preorder }[] = [];
		for (const preorder of preorders) {
			try {
				await givePackToUser({
					userId: preorder.userId,
					username: preorder.username,
					packCount: 1,
					packType,
				});
				await deletePreorder(preorder);
			} catch (error) {
				console.error(error);
				errors.push({ error, preorder });
			}
		}

		if (errors.length > 0) {
			console.error({ errors });
			return {
				statusCode: 500,
				body: `The following conversions failed:\n${errors
					.map(({ preorder }) => preorder.username)
					.join('\n')}`,
				headers: {
					'Content-Type': 'text/plain',
				},
			};
		}
	}
);
