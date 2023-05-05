export const DOMAIN_NAME = 'lilindcards.lksh.dev';
export const HOSTED_ZONE = 'lksh.dev';
export const API_VERSION = 'v1';

export function getDomainName(stage: string) {
	return stage === 'demo' ? DOMAIN_NAME : `${stage}.${DOMAIN_NAME}`;
}
