import { z } from 'astro:schema';
import { publicProcedure } from '../router';
import { getAllUsers, getUserByUserName, searchUsers } from '@core/lib/user';

export const users = {
	allUsernames: publicProcedure.query(async () =>
		(await getAllUsers()).map(user => user.username).sort((a, b) => a.localeCompare(b))
	),
	search: publicProcedure
		.input(z.object({ searchString: z.string().min(1) }))
		.query(async ({ input }) => await searchUsers(input)),
	byUsername: publicProcedure
		.input(z.object({ username: z.string() }))
		.query(async ({ input }) => await getUserByUserName(input.username)),
};
