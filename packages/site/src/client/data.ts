import { createQuery } from '@tanstack/solid-query';
import { trpc } from './trpc';

export const getSiteConfig = () =>
	createQuery(() => ({
		queryKey: ['site-config'],
		queryFn: () => trpc.siteConfig.query(),
	}));

export const getTwitchUser = (username: string) =>
	createQuery(() => ({
		queryKey: ['twitch-user', username],
		queryFn: () => trpc.twitch.userByLogin.query({ login: username }),
	}));
