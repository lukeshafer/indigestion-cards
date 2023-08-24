const DOMAIN_NAME = 'indigestioncards.com';
const HOSTED_ZONE = 'indigestioncards.com';
export const API_VERSION = 'v1';

export function getDomainName(stage: string) {
	if (stage === 'luke' || stage === 'luke-dev') return `${stage}.lksh.dev`;

	if (stage === 'prod') return DOMAIN_NAME;

	return `${stage}.env.${DOMAIN_NAME}`;
}

export function getHostedZone(stage: string) {
	if (stage === 'luke' || stage === 'luke-dev') return `lksh.dev`;

	return HOSTED_ZONE;
}
