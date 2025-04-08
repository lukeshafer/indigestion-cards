import { createSubjects } from '@openauthjs/openauth/subject';
import * as v from 'valibot';

export const subjects = createSubjects({
	user: v.object({
		userId: v.string(),
		username: v.string(),
		version: v.number(),
	}),
	admin: v.object({
		userId: v.string(),
		username: v.string(),
		version: v.number(),
	}),
	public: v.object({}),
});
