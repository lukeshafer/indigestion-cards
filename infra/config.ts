const DOMAIN_NAME = 'indigestioncards.com';
const HOSTED_ZONE = 'indigestioncards.com';
export const API_VERSION = 'v1';

export const domainName = getDomainName($app.stage);
function getDomainName(stage: string) {
	if (stage.startsWith('luke')) return `${stage}.indigestioncards.lksh.dev`;

	if (stage === 'prod' || stage === 'live') return DOMAIN_NAME;

	return `${stage}.env.${DOMAIN_NAME}`;
}

export const hostedZone = getHostedZone($app.stage);
function getHostedZone(stage: string) {
	if (stage.startsWith('luke')) return `lksh.dev`;

	return HOSTED_ZONE;
}

export const params = new sst.Linkable('CardsParams', {
	properties: {
		TWITCH_TOKENS_PARAM: `/sst/${$app.name}/${$app.stage}/Secret/TWITCH_TOKENS/value`,
		STREAMER_USER_ID: '227134852',
		DOMAIN_NAME: getDomainName($app.stage),
	},
});

export const twitchClientId = new sst.Secret('TWITCH_CLIENT_ID');
export const twitchClientSecret = new sst.Secret('TWITCH_CLIENT_SECRET');

export const ssmPermissions = {
	actions: ['ssm:GetParameter', 'ssm:PutParameter'],
	resources: ['*'],
};

type DataImportNames = {
	dataSummariesBucketName: string;
	dynamoTableName: string;
	cardsCDNBucketName: string;
	cardDesignsBucketName: string;
	cardDraftsBucketName: string;
	frameDesignsBucketName: string;
	frameDraftsBucketName: string;
};

export const imports = {
	luke: {
		dataSummariesBucketName: 'luke-lil-indigestion-card-datasummariesbucket424a2-fobxq3hfcz8o',
		dynamoTableName: 'luke-lil-indigestion-cards-data',
		cardsCDNBucketName: 'luke-lil-indigestion-cards-ima-cardsbucketbe9f1931-xcet76xih2fc',
		cardDesignsBucketName: 'luke-lil-indigestion-card-carddesignsbucketd131504-gh1nozxtmr8p',
		cardDraftsBucketName: 'luke-lil-indigestion-card-carddraftsbucket9d9632ed-30rodddjco49',
		frameDesignsBucketName: 'luke-lil-indigestion-card-framedesignsbucket5220be-chxcqctcaxlo',
		frameDraftsBucketName: 'luke-lil-indigestion-card-framedraftsbucketc501c32-go2aaqksjmcu',
	},
} satisfies Record<string, DataImportNames>;
