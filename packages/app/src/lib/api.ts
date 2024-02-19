import { APIHandler, APIEvent } from '@solidjs/start/server/types';
import { parse, type ObjectEntries, type ObjectSchema, type Output as SchemaOutput } from 'valibot';

export class TypedResponse<T> extends Response {
  data: T;

  constructor(body: T, opts?: ResponseInit) {
    super(JSON.stringify(body), opts);
    this.data = body;
  }
}

type Options<T extends ObjectEntries> = {
  input: ObjectSchema<T>;
};

type Loader<Output, Input = Record<string, string>> = {
  load: LoadFn<Output, Input>;
  GET: (evt: APIEvent) => Promise<TypedResponse<Output>>;
};

type LoadFn<Output, Input = Record<string, string>> = (input: Input) => Promise<Output>;

export function createLoader<Output>(loadFn: LoadFn<Output>): Loader<Output>;
export function createLoader<Output, Input extends ObjectEntries>(
  schema: ObjectSchema<Input>,
  loadFn: LoadFn<Output, SchemaOutput<ObjectSchema<Input>>>
): Loader<Output, SchemaOutput<ObjectSchema<Input>>>;
export function createLoader<Output, Input extends ObjectEntries = {}>(
  schema: ObjectSchema<Input> | LoadFn<Output>,
  loadFn?: LoadFn<Output, SchemaOutput<ObjectSchema<Input>>>
) {
  const load = typeof schema === 'function' ? schema : loadFn!
  const actualSchema = typeof schema === 'function' ? undefined : schema

  return {
    load: loadFn,
    GET: (async evt => {
      if (!actualSchema) return loadFn!(evt.params).then(res => new TypedResponse(res));
      return loadFn!(parse(actualSchema, evt.params)).then(res => new TypedResponse(res));
    }) satisfies APIHandler,
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
