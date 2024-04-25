import { SiteHandler } from '@core/lib/api';
import { createNewUser, getUserByUserName } from '@core/lib/user';
import { createPreorder } from '@core/lib/preorder';
import { getUserByLogin } from '@core/lib/twitch';

export const handler = SiteHandler(
	{
		authorizationType: 'admin',
		schema: {
			username: 'string',
		},
	},
	async (_, ctx) => {
		const { username } = ctx.params;
		let user = await getUserByUserName(username);

		if (!user) {
			const twitch_user = await getUserByLogin(username);
			if (!twitch_user) {
				return {
					statusCode: 404,
					body: 'User not found',
				};
			}

			user = await createNewUser({
				userId: twitch_user.id,
				username: twitch_user.display_name,
			});
		}

		const result = await createPreorder({ userId: user.userId, username: user.username });
		if (!result.success) {
			return {
				statusCode: 500,
				body: result.error,
			};
		}

		return {
			statusCode: 200,
			body: 'Preorder created',
		};
	}
);
