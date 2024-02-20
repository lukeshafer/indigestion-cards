import { createLoader, type LoaderOutput, type InputLoader, type NoInputLoader } from './api';
import { getAllUsers, getUserByUserName } from '@lib/user';
import { getPacksRemaining } from './server/packs';
import { getAllPacks } from '@lib/pack';
import { z } from 'astro/zod';
import { getTrade } from '@lil-indigestion-cards/core/lib/trades';
import type { APIContext, AstroGlobal } from 'astro';

if (!import.meta.env.SSR) {
	throw new Error('This file should only be imported on the server');
}

export const routes = {
	'/': {
		data: ['user'],
		conversion: ctx => ({
			username: ctx.url.searchParams.get('username') || 'snailyluke',
		}),
	},
	'/users': { data: ['users'] },
} satisfies Record<
	string,
	{
		data: Readonly<Array<InputKey | NoInputKey>>;
		conversion?: (ctx: AstroGlobal | APIContext) => any;
	}
>;
export type RouteName = keyof typeof routes;

type RouteDataKey<R extends RouteName> = (typeof routes)[R]['data'][number];
type RouteDataOutput<R extends RouteName> = LoaderOutput<(typeof data)[RouteDataKey<R>]>;
type LoaderOutputForKey<K extends keyof typeof data> = LoaderOutput<(typeof data)[K]>;
type RouteData<R extends RouteName> = {
	[K in RouteDataKey<R>]: RouteDataOutput<R>;
};

export async function getRouteData<Route extends RouteName>(
	route: Route,
	ctx: AstroGlobal | APIContext
): Promise<RouteData<Route>> {
	console.log('Getting route data', { route });

	const routeData = routes[route];
	console.log({ routeData });
	if (!routeData) {
		console.log('no routedata found');
		return {};
	}

	const params =
		'conversion' in routeData
			? routeData.conversion(ctx)
			: Object.fromEntries(ctx.url.searchParams.entries());

	const entries = await Promise.all(
		routeData.data.map(async key => {
			const loader = data[key];
			console.log('loading: ', { key,  });
			if ('schema' in loader) {
				console.log('schema in loader', { params });
				const parsed = loader.schema.safeParse(params);
        if (!parsed.success) {
          console.log("FAILED TO PARSED")
          return [key, {}]
        }
				// @ts-ignore -- The parsed result will always be correct
				return [key, await loader.load(parsed)] as const;
			} else {
				console.log('no schema in loader');
				return [key, await loader.load()] as const;
			}
		})
	);
	return Object.fromEntries(entries);
}

//type InputLoaderKey<K extends InputKey> = [K, z.infer<typeof data[K]['schema']>]

//type T = InputLoaderKey<'user'>

export const data = {
	users: createLoader(async () => {
		const users = (await getAllUsers()).sort((a, b) => a.username.localeCompare(b.username));
		return users;
	}),
	usernames: createLoader(async () => {
		return (await getAllUsers()).map(user => user.username).sort((a, b) => a.localeCompare(b));
	}),
	'packs-remaining': createLoader(() => getPacksRemaining()),
	'pack-count': createLoader(async () => {
		const packs = await getAllPacks();
		const packCount = packs.length;

		return { packCount };
	}),
	user: createLoader(
		z.object({
			username: z.string(),
		}),
		async ({ username }) => {
			console.log('fetching user by username', {username});
			return getUserByUserName(username);
		}
	),
	trades: createLoader(
		z.object({
			tradeId: z.string(),
		}),
		async ({ tradeId }) => getTrade(tradeId)
	),
} satisfies Record<string, InputLoader<any, any> | NoInputLoader<any>>;

type KeysMatching<T extends object, V> = {
	[K in keyof T]-?: T[K] extends V ? K : never;
}[keyof T];

type InputKey = KeysMatching<typeof data, InputLoader<any, any>>;
type NoInputKey = KeysMatching<typeof data, NoInputLoader<any>>;
export type DataKey = keyof typeof data;
export type Params<K extends InputKey | NoInputKey> = K extends InputKey
	? z.infer<(typeof data)[K]['schema']>
	: undefined;

function CLIENT_GETTER_FN<Path extends NoInputKey>(path: Path): Promise<LoaderOutputForKey<Path>>;
function CLIENT_GETTER_FN<Path extends InputKey>(
	path: Path,
	input: Params<Path>
): Promise<LoaderOutputForKey<Path>>;
function CLIENT_GETTER_FN<Path extends InputKey | NoInputKey>(
	// @ts-expect-error This function should never run
	path,
	// @ts-expect-error This function should never run
	input
): Promise<LoaderOutputForKey<Path>> {
	throw new Error('IMPLEMENTATION MISSING');
	// @ts-expect-error This function should never run
	return;
}

export type GetDataFn = typeof CLIENT_GETTER_FN;
