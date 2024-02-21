import { z } from 'astro/zod';
import { URLPattern } from 'urlpattern-polyfill';
import { getAllCardDesigns, getCardDesignAndInstancesById } from '@lib/design';
import { getAllUsers, getUserByUserName } from '@lib/user';
import { getTrade } from '@lib/trades';
import { getSiteConfig } from '@lib/site-config';
import { getAllPacks } from '@lib/pack';
import { createLoader, type LoaderOutput, type InputLoader, type NoInputLoader } from './api';
import { getPacksRemaining } from './server/packs';
import type { defineRoute } from './client/routes.client';

export const data = {
  users: createLoader(async () => {
    const users = (await getAllUsers()).sort((a, b) => a.username.localeCompare(b.username));
    return users;
  }),
  usernames: createLoader(async () => {
    return (await getAllUsers()).map(user => user.username).sort((a, b) => a.localeCompare(b));
  }),
  user: createLoader(
    z.object({
      username: z.string(),
    }),
    async ({ username }) => {
      console.log('fetching user by username', { username });
      return getUserByUserName(username);
    }
  ),

  designs: createLoader(async () => {
    return getAllCardDesigns();
  }),
  design: createLoader(
    z.object({
      designId: z.string(),
    }),
    async ({ designId }) => {
      const {
        cardDesigns: [design],
        cardInstances,
      } = await getCardDesignAndInstancesById({ designId });

      return { design, instances: cardInstances.filter(instance => instance.openedAt) };
    }
  ),

  'packs-remaining': createLoader(() => getPacksRemaining()),
  'pack-count': createLoader(async () => {
    const packs = await getAllPacks();
    const packCount = packs.length;

    return { packCount };
  }),

  trades: createLoader(
    z.object({
      tradeId: z.string(),
    }),
    async ({ tradeId }) => getTrade(tradeId)
  ),
  'site-config': createLoader(() => {
    return getSiteConfig();
  }),
} satisfies Record<string, InputLoader<any, any> | NoInputLoader<any>>;

// BEGIN LIBRARY

if (!import.meta.env.SSR) {
  throw new Error('This file should only be imported on the server');
}

// FUNCTION EXPORTS USING ABOVE DATA
type RouteDefinition = ReturnType<typeof defineRoute>;
export async function loadServerRoute(opts: { routes: Array<RouteDefinition>; url: URL }) {
  const route = await getBestRouteMatch(opts);

  if (!route) return null;
  else
    return {
      pattern: route.route,
      data: await loadServerDataFromRouteDataKeys(route),
    };
}

async function getBestRouteMatch(opts: { routes: Array<RouteDefinition>; url: URL }) {
  for (const { route, data: dataKeys } of opts.routes) {
    const urlPattern = new URLPattern({ pathname: route });

    const url = new URL(opts.url);
    url.pathname =
      opts.url.pathname.endsWith('/') && opts.url.pathname !== '/'
        ? opts.url.pathname.slice(0, opts.url.pathname.length - 1)
        : opts.url.pathname;

    //console.log({
    //route,
    //dataKeys,
    //url: url.pathname,
    //testresult: urlPattern.test(opts.url),
    //});
    if (urlPattern.test(url.toString())) {
      const params = urlPattern.exec(url.toString())?.pathname.groups ?? {};
      console.log('Url matched', {
        route,
        dataKeys,
        url: url.pathname,
        params,
      });

      return { route, dataKeys, params };
    }
  }
}

type DataOutputRecord<Key extends DataKey> = {
  [K in Key]: DataOutput<K>;
};

async function loadServerDataFromRouteDataKeys<Key extends DataKey>(opts: {
  route: string;
  dataKeys: Array<Key>;
  params: Record<string, string | undefined>;
}): Promise<DataOutputRecord<Key>> {
  console.debug('loading route', opts.route);

  const entries = await Promise.all(
    opts.dataKeys.map(async key => {
      const loader = data[key];
      console.log('loading: ', { key });
      if ('schema' in loader && loader.schema) {
        console.debug('schema in loader', { loader, params: opts.params });
        const parsed = loader.schema.safeParse(opts.params);
        if (!parsed.success) {
          console.log('FAILED TO PARSED');
          return [key, {}];
        }
        // @ts-ignore -- The parsed result will always be correct
        return [key, await loader.load(parsed.data)] as const;
      } else {
        console.log('no schema in loader');
        return [key, await loader.load({})] as const;
      }
    })
  );
  return Object.fromEntries(entries);
}

export type KeyArray = Readonly<Array<InputKey | NoInputKey>>;
export type DataOutput<K extends DataKey> = LoaderOutput<(typeof data)[K]>;

type KeysMatching<T extends object, V> = {
  [K in keyof T]-?: T[K] extends V ? K : never;
}[keyof T];

type InputKey = KeysMatching<typeof data, InputLoader<any, any>>;
type NoInputKey = KeysMatching<typeof data, NoInputLoader<any>>;
export type DataKey = keyof typeof data;
export type Params<K extends InputKey | NoInputKey> = K extends InputKey
  ? z.infer<(typeof data)[K]['schema']>
  : undefined;

// @ts-expect-error -- the implementation will not match
function CLIENT_GETTER_FN<Path extends NoInputKey>(path: Path): Promise<DataOutput<Path>>;
function CLIENT_GETTER_FN<Path extends InputKey>(
  path: Path,
  input: Params<Path>
): Promise<DataOutput<Path>>;
function CLIENT_GETTER_FN<Path extends InputKey | NoInputKey>(
  // @ts-expect-error This function should never run
  path,
  // @ts-expect-error This function should never run
  input
): Promise<DataOutput<Path>> {
  throw new Error('IMPLEMENTATION MISSING');
  // @ts-expect-error This function should never run
  return;
}

export type GetDataFn = typeof CLIENT_GETTER_FN;
