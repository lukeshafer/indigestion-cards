import { SiteHandler } from '@lil-indigestion-cards/core/api';
import { setUserProfile } from '@lil-indigestion-cards/core/user';

export const handler = SiteHandler(
	{
		authorizationType: 'user',
		schema: {
			userId: 'string',
			lookingFor: ['string', 'optional'],
			pinnedCardId: ['string', 'optional'],
			pinnedCardDesignId: ['string', 'optional'],
		},
	},
	async (_, ctx) => {
		await setUserProfile({
			userId: ctx.params.userId,
			lookingFor: ctx.params.lookingFor,
			pinnedCard:
				ctx.params.pinnedCardId && ctx.params.pinnedCardDesignId
					? {
						designId: ctx.params.pinnedCardDesignId,
						instanceId: ctx.params.pinnedCardId,
					}
					: undefined,
		});
		return {
			statusCode: 200,
			body: `Updated user profile!`,
		};
	}
);
