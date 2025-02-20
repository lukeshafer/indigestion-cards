const DOMAIN_NAME = 'indigestioncards.com';
const HOSTED_ZONE = 'indigestioncards.com';
export const API_VERSION = 'v1';

export function getDomainName(stage: string) {
	if (stage.startsWith('luke')) return `${stage}.indigestioncards.lksh.dev`;

	if (stage === 'prod') return DOMAIN_NAME;

	return `${stage}.env.${DOMAIN_NAME}`;
}

export function getHostedZone(stage: string) {
	if (stage === 'luke' || stage === 'luke-dev') return `lksh.dev`;

	return HOSTED_ZONE;
}

export const params = new sst.Linkable('CardsParams', {
	properties: {
		TWITCH_TOKENS_PARAM: `/sst/${$app.name}/${$app.stage}/Secret/TWITCH_TOKENS/value`,
		STREAMER_USER_ID: '227134852',
		DOMAIN_NAME: getDomainName($app.stage),
	},
});

export const twitchClientId = new sst.Secret("TWITCH_CLIENT_ID");
export const twitchClientSecret = new sst.Secret("TWITCH_CLIENT_SECRET");
