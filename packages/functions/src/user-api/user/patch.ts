import { SiteHandler } from '@lib/api';
import { setUserProfile } from '@lib/user';

export const handler = SiteHandler(
	{
		authorizationType: 'user',
		schema: {
			userId: 'string',
			lookingFor: 'string?',
			pinnedCardId: 'string?',
			pinnedCardDesignId: 'string?',
		},
	},
	async (_, ctx) => {
		console.log('lookingFor', ctx.params.lookingFor);

		const deletePinnedCard =
			ctx.params.pinnedCardId === 'null' || ctx.params.pinnedCardDesignId === 'null';

		await setUserProfile({
			userId: ctx.params.userId,
			lookingFor: ctx.params.lookingFor,
			pinnedCard: deletePinnedCard
				? null
				: ctx.params.pinnedCardId && ctx.params.pinnedCardDesignId
					? {
						designId: ctx.params.pinnedCardDesignId,
						instanceId: ctx.params.pinnedCardId,
					}
					: undefined,
		});
		return {
			statusCode: 200,
			body: `Updated profile!`,
		};
	}
);
