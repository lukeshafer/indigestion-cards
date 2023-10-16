import type { APIRoute } from 'astro';
import { getAllUsers, getUserByUserName } from '@lil-indigestion-cards/core/lib/user';
import { routes } from '@/constants';

export const GET: APIRoute = async (ctx) => {
	const username = ctx.url.searchParams.get('username');

	if (!username) return ctx.redirect(routes.USERS);

	const user = await getUserByUserName(username);
	if (user) return ctx.redirect(`${routes.USERS}/${user.username}`);

	const users = await getAllUsers();
	const similarUsers = users.filter((user) =>
		user.username.toLowerCase().includes(username.toLowerCase())
	);

	if (similarUsers.length === 1)
		return ctx.redirect(`${routes.USERS}/${similarUsers[0]!.username}`);

	return ctx.redirect(
		`${routes.USERS}?alert=${encodeURIComponent(`User ${username} not found.`)}`
	);
};
