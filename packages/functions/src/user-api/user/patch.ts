import { SiteHandler } from "@lil-indigestion-cards/core/api";
import { setUserProfile } from "@lil-indigestion-cards/core/user";

export const handler = SiteHandler({
	authorizationType: 'user',
	schema: {
		userId: 'string',
		lookingFor: ['string', 'optional'],
	},
}, async (_, ctx) => {
	await setUserProfile(ctx.params);
	return {
		statusCode: 200,
		body: `Updated user profile!`,
	};
})
