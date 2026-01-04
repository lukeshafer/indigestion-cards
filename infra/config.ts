const DOMAIN_NAME = 'indigestioncards.com';
const HOSTED_ZONE = 'indigestioncards.com';
export const API_VERSION = 'v1';

export const domainName = getDomainName($app.stage);
function getDomainName(stage: string) {
	if (stage.startsWith('luke')) return `${stage}.indigestioncards.lksh.dev`;

	if (stage === 'prod' || stage === 'live') return DOMAIN_NAME;

	return `${stage}.env.${DOMAIN_NAME}`;
}

const readyStages = new Set(['luke', 'dev']); // only add to this list if the stage has been deployed once
export const resolveDomain = (domain: string, path?: string) =>
	$dev === true
		? undefined
		: readyStages.has($app.stage)
			? path
				? {
						name: domain,
						dns: sst.aws.dns({ override: true }),
						path,
					}
				: {
						name: domain,
						dns: sst.aws.dns({ override: true }),
					}
			: undefined;

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
	dynamoTableName: string;
	cardsCDNBucketName: string;
	cardDesignsBucketName: string;
	frameDesignsBucketName: string;
};

const importConfig: Record<string | symbol, Partial<DataImportNames>> = {
	luke: {
		dynamoTableName: 'luke-lil-indigestion-cards-data',
		cardsCDNBucketName: 'luke-lil-indigestion-cards-ima-cardsbucketbe9f1931-slxjuzmuvra4',
		cardDesignsBucketName: 'luke-lil-indigestion-card-carddesignsbucketd131504-ywrschnjx14a',
		frameDesignsBucketName: 'luke-lil-indigestion-card-framedesignsbucket5220be-xfppctbwkl9a',
	},
	dev: {
		dynamoTableName: 'dev-lil-indigestion-cards-data',
		cardsCDNBucketName: 'dev-lil-indigestion-cards-imag-cardsbucketbe9f1931-gv0bjocqddci',
		cardDesignsBucketName: 'dev-lil-indigestion-card-carddesignsbucketd131504-1ql88qc8da5q2',
		frameDesignsBucketName: 'dev-lil-indigestion-card-framedesignsbucket5220be-1m9o3fre3hm8j',
	},
} satisfies Record<string, DataImportNames>; // yes both the type declaration AND satisfies are intentional

const bypassedStages = new Set('luke-v3');
if (!($app.stage in importConfig) && !bypassedStages.has($app.stage)) {
	throw new Error(
		`Stage ${$app.stage} is not ready for deployment. Setup imports in infra/config.ts`
	);
}
export const imports = importConfig[$app.stage] ?? {};
