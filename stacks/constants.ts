export const DOMAIN_NAME = 'indigestioncards.com';
export const HOSTED_ZONE = 'indigestioncards.com';
export const API_VERSION = 'v1';

export function getDomainName(stage: string) {
	if (stage === 'prod') return DOMAIN_NAME;

	return `${stage}.env.${DOMAIN_NAME}`;
}
