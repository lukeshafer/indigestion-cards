import { SiteHandler } from '@lib/api';
import { packSchema, packSchemaWithoutUser } from '@lib/entity-schemas';
import { createPackForNoUser, givePackToUser } from '@lib/pack';
import { getUserByLogin } from '@lib/twitch';

export const handler = SiteHandler(
	{
		authorizationType: 'admin',
		schema: {
			username: 'string?',
			count: 'number?',
			userId: 'string?',
			packType: 'string',
		},
	},
	async (_, { params }) => {
		const username = params.username;
		const userId = username
			? params.userId ?? (await getUserByLogin(username))?.id ?? null
			: null;
		const packCount = params.count || 1;

		if (username && !userId)
			return { statusCode: 400, body: `User ${username} does not exist` };

		console.log('Creating pack for user: ', {
			username,
			userId,
			packCount,
			packTypeString: params.packType,
		});

		try {
			const packType = JSON.parse(params.packType);

			if (!username || !userId) {
				const parseResult = packSchemaWithoutUser.safeParse({ packCount, packType });
				if (!parseResult.success) {
					return { statusCode: 400, body: parseResult.error.message };
				}
				await createPackForNoUser(parseResult.data);
			} else {
				const parseResult = packSchema.safeParse({ userId, username, packCount, packType });
				if (!parseResult.success) {
					return { statusCode: 400, body: parseResult.error.message };
				}
				await givePackToUser(parseResult.data);
			}
			return {
				statusCode: 200,
				body: username ? `Pack given to ${username}` : `Pack created`,
			};
		} catch (error) {
			console.error(error);
			if (error instanceof Error) return { statusCode: 400, body: error.message };
			else return { statusCode: 400, body: 'Unknown error' };
		}
	}
);
