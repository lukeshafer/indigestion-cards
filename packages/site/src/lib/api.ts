//import type { AstroGlobal } from 'astro';
import type { APIContext, APIRoute } from 'astro';
import { z } from 'astro/zod';

export class TypedResponse<T> extends Response {
  data: T;

  constructor(body: T, opts?: ResponseInit) {
    super(JSON.stringify(body), opts);
    this.data = body;
  }
}

export type NoInputLoader<Output> = {
  load: () => Promise<Output>;
  GET: (ctx: APIContext) => Promise<TypedResponse<Output>>;
};
export type InputLoader<Output, Input extends Record<string, string | undefined>> = {
  load: (input: Input) => Promise<Output>;
  GET: (ctx: APIContext) => Promise<TypedResponse<Output>>;
  schema: z.Schema<Input>;
};

type LoadFn<Output, Input = Record<string, string | undefined>> = (input: Input) => Promise<Output>;

export type LoaderOutput<T extends InputLoader<any, any> | NoInputLoader<any>> = Awaited<
  ReturnType<T['load']>
>;

export function createLoader<Output>(loadFn: LoadFn<Output>): NoInputLoader<Output>;
export function createLoader<Output, Input extends Record<string, string | undefined>>(
  schema: z.Schema<Input>,
  loadFn: LoadFn<Output, Input>
): InputLoader<Output, Input>;
export function createLoader<Output, Input extends Record<string, string | undefined> = {}>(
  schema: z.Schema<Input> | LoadFn<Output>,
  loadFn?: LoadFn<Output, Input>
) {
  console.debug('Creating loader', { schema: schema.toString(), loadFn: loadFn?.toString() })

  const load = typeof schema === 'function' ? schema : loadFn!;
  const actualSchema = typeof schema === 'function' ? undefined : schema;

  return {
    load,
    GET: (async evt => {
      const search = Object.fromEntries(evt.url.searchParams.entries())
      console.log("GET FETCHED")

      if (!actualSchema) return load(search).then(res => new TypedResponse(res));
      return load(actualSchema.parse(search)).then(res => new TypedResponse(res));
    }) satisfies APIRoute,
    schema: actualSchema,
  };
}

export function time(opts: { days?: number; hours?: number; minutes?: number; seconds?: number }) {
  return (
    (opts.days ?? 0) * 86400 +
    (opts.hours ?? 0) * 3600 +
    (opts.minutes ?? 0) * 60 +
    (opts.seconds ?? 0)
  );
}

type CacheControlOptions = {
  public?: boolean;
  maxAge?: number;
  staleWhileRevalidate?: number;
};
export function cacheControl(opts: CacheControlOptions) {
  const result = [opts.public ? 'public' : 'private'];

  if (opts.maxAge !== undefined) result.push(`max-age=${opts.maxAge}`);
  if (opts.staleWhileRevalidate !== undefined)
    result.push(`stale-while-revalidate=${opts.staleWhileRevalidate}`);

  return result.join(', ');
}

//export function cachePage(
//ctx: AstroGlobal,
//opts: CacheControlOptions = {
//public: false,
//maxAge: 60,
//staleWhileRevalidate: time({ minutes: 10 }),
//}
//) {
//ctx.response.headers.set('cache-control', cacheControl(opts));
//}
