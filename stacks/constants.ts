export const DOMAIN_NAME = 'lilindcards.lksh.dev';
export const HOSTED_ZONE = 'lksh.dev';
export const API_VERSION = 'v1';

export function getDomainName(stage: string) {
	if (stage === 'demo') return DOMAIN_NAME;
	if (stage === 'prod') return DOMAIN_NAME;

	return `${stage}.${DOMAIN_NAME}`;
}
