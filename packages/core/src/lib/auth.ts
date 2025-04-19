import { createSubjects, type SubjectPayload } from '@openauthjs/openauth/subject';
import { createClient } from '@openauthjs/openauth/client';
import { Resource } from 'sst';
import { z } from 'zod';
import { lazy } from './utils';

export const client = lazy(() =>
	createClient({
		clientID: 'main',
		issuer: Resource.SiteAuth.url,
	})
);

export const COOKIE = {
	ACCESS: 'access_token',
	REFRESH: 'refresh_token',
};

export const subjects = createSubjects({
	user: z.object({
		userId: z.string(),
		username: z.string(),
		version: z.number(),
	}),
	admin: z.object({
		userId: z.string(),
		username: z.string(),
		version: z.number(),
	}),
	public: z.object({}),
});

export async function useSession(options: {
	access: string | undefined;
	refresh?: string | undefined;
}): Promise<SubjectPayload<typeof subjects>> {
	if (!options.access) {
		return {
			type: 'public',
			properties: {},
		};
	}

	const verified = await client.verify(subjects, options.access, {
		refresh: options.refresh,
	});

	if (verified.err) {
		return {
			type: 'public',
			properties: {},
		};
	}

	return verified.subject;
}
