import { QueryClient, createQuery } from '@tanstack/solid-query';
import { trpc } from './trpc';
//import { cache, } from '@solidjs/router';

//export const fetchSiteConfig = cache(() => trpc.siteConfig.query(), 'site-config');
//export const fetchRarityRanking = cache(() => trpc.rarityRanking.query(), 'rarity-ranking');
//export const fetchTwitchUser = cache(
//(login: string) => trpc.twitch.userByLogin.query({ login }),
//'twitch-user'
//);
//export const fetchDesign = cache(
//(designId: string) => trpc.cardDesigns.byId.query({ designId }),
//'design'
//);
//export const fetchAllDesigns = cache(() => trpc.cardDesigns.getAll.query(), 'all-designs');
//export const fetchUserByUsername = cache(
//(username: string) => trpc.users.byUsername.query({ username }),
//'user'
//);
//export const fetchPackCount = cache(() => trpc.packs.count.query(), 'pack-count');

export const fetchSiteConfig = (client?: QueryClient) =>
  createQuery(
    () => ({
      queryKey: ['site-config'],
      queryFn: () => trpc.siteConfig.query(),
    }),
    client && (() => client)
  );

export const fetchRarityRanking = (client?: QueryClient) =>
  createQuery(
    () => ({
      queryKey: ['rarity-ranking'],
      queryFn: () => trpc.rarityRanking.query(),
    }),
    client && (() => client)
  );

export const fetchTwitchUser = (username: string, client?: QueryClient) =>
  createQuery(
    () => ({
      queryKey: ['twitch-user', username],
      queryFn: () => trpc.twitch.userByLogin.query({ login: username }),
    }),
    client && (() => client)
  );

export const fetchDesign = (designId: string, client?: QueryClient) =>
  createQuery(
    () => ({
      queryKey: ['design', designId] as const,
      queryFn: async opts => {
        const [, designId] = opts.queryKey;
        return trpc.cardDesigns.byId.query({ designId });
      },
    }),
    client && (() => client)
  );

export const fetchAllDesigns = (client?: QueryClient) =>
  createQuery(
    () => ({
      queryKey: ['card-designs'],
      queryFn: async () => trpc.cardDesigns.getAll.query(),
    }),
    client && (() => client)
  );

export const fetchPackCount = ({ initialCount, client }: { initialCount?: number, client?: QueryClient }) =>
  createQuery(
    () => ({
      queryKey: ['pack-count'],
      queryFn: async () => trpc.packs.count.query(),
      initialData: initialCount,
    }),
    client && (() => client)
  )

export const fetchUserByUsername = (username: string, client?: QueryClient) =>
  createQuery(
    () => ({
      queryKey: ['user', username] as const,
      queryFn: async opts => trpc.users.byUsername.query({ username: opts.queryKey[1] }),
    }),
    client && (() => client)
  )
