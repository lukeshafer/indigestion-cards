import { cache } from '@solidjs/router';

export const loadAllCardDesigns = cache(async () => {
	'use server';
	const { getAllCardDesigns } = await import('@core/lib/design');

	return getAllCardDesigns();
}, 'carddesigns');

export const loadAllUsers = cache(async () => {
	'use server';
	const { getAllUsers } = await import('@core/lib/user');

	return getAllUsers();
}, 'users');
