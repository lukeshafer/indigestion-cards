import type { JSX } from 'solid-js';
import type { RouteSectionProps } from '@solidjs/router';
import type { APIContext, APIRoute } from 'astro';
import { z } from 'zod';
import { URLPattern } from 'urlpattern-polyfill';
import type {
  RouteDefinition,
  Params,
  DataGeneric,
  DataOutput,
  InputLoader,
  KeysMatching,
  LoadFn,
  NoInputLoader,
  InputKey,
} from './utils.d.ts';
import { TypedResponse } from './lib.ts';

export function createData<Data extends DataGeneric>(data: Data) {
  return {
    data,
    loadServerRoute: async <Routes extends Array<RouteDefinition<Data, any>>>(opts: {
      routes: Routes;
      url: URL;
    }) => {
      const route = await getBestRouteMatch(opts);

      if (!route) return null;
      else
        return {
          pattern: route.route,
          data: await loadServerDataFromRouteDataKeys(data, route),
        };
    },
  };
}

async function getBestRouteMatch<
  Data extends DataGeneric,
  Routes extends Array<RouteDefinition<Data, any>>,
>(opts: { routes: Routes; url: URL }) {
  for (const { route, data: dataKeys } of opts.routes) {
    const urlPattern = new URLPattern({ pathname: route });

    const url = new URL(opts.url);
    url.pathname =
      opts.url.pathname.endsWith('/') && opts.url.pathname !== '/'
        ? opts.url.pathname.slice(0, opts.url.pathname.length - 1)
        : opts.url.pathname;

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

async function loadServerDataFromRouteDataKeys<Data extends DataGeneric, Key extends keyof Data>(
  data: Data,
  opts: {
    route: string;
    dataKeys: Array<Key>;
    params: Record<string, string | undefined>;
  }
): Promise<{
  [K in Key]: DataOutput<Data, K>;
}> {
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

export function createLoader<Output>(loadFn: LoadFn<Output>): NoInputLoader<Output>;
export function createLoader<Output, Input extends Record<string, string | undefined>>(
  schema: z.Schema<Input>,
  loadFn: LoadFn<Output, Input>
): InputLoader<Output, Input>;
export function createLoader<Output, Input extends Record<string, string | undefined> = {}>(
  schema: z.Schema<Input> | LoadFn<Output>,
  loadFn?: LoadFn<Output, Input>
) {
  console.debug('Creating loader', { schema: schema.toString(), loadFn: loadFn?.toString() });

  const load = typeof schema === 'function' ? schema : loadFn!;
  const actualSchema = typeof schema === 'function' ? undefined : schema;

  return {
    load,
    GET: (async evt => {
      const search = Object.fromEntries(evt.url.searchParams.entries());
      console.log('GET FETCHED');

      if (!actualSchema) return load(search).then(res => new TypedResponse(res));
      return load(actualSchema.parse(search)).then(res => new TypedResponse(res));
    }) satisfies APIRoute,
    schema: actualSchema,
  };
}
