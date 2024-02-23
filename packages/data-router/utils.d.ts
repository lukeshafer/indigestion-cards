import type { z } from 'zod';
import { TypedResponse } from './lib';
import type { APIContext, APIRoute } from 'astro';
import { RouteSectionProps } from '@solidjs/router';
import { JSX } from 'solid-js';

export type NoInputLoader<Output> = {
  load: () => Promise<Output>;
  GET: (ctx: APIContext) => Promise<TypedResponse<Output>>;
};
export type InputLoader<Output, Input extends Record<string, string | undefined>> = {
  load: (input: Input) => Promise<Output>;
  GET: (ctx: APIContext) => Promise<TypedResponse<Output>>;
  schema: z.Schema<Input>;
};

export type LoadFn<Output, Input = Record<string, string | undefined>> = (
  input: Input
) => Promise<Output>;

export type LoaderOutput<T extends InputLoader<any, any> | NoInputLoader<any>> = Awaited<
  ReturnType<T['load']>
>;

export type DataGeneric = Record<string, InputLoader<any, any> | NoInputLoader<any>>;
export type DataOutput<Data extends DataGeneric, Key extends keyof Data> = LoaderOutput<Data[Key]>;
export type RouteDefinition<Data extends DataGeneric, Key extends keyof Data> = {
  route: string;
  data: Array<Key>;
  component: (
    props: RouteSectionProps<{
      [K in Key]: DataOutput<Data, K>;
    }>
  ) => JSX.Element;
};

export type KeysMatching<T extends object, V> = {
  [K in keyof T]-?: T[K] extends V ? K : never;
}[keyof T];

export type InputKey<Data extends DataGeneric> = KeysMatching<Data, InputLoader<any, any>>;
export type NoInputKey<Data extends DataGeneric> = KeysMatching<Data, NoInputLoader<any>>;
export type Params<Data extends DataGeneric, K extends keyof Data> = Data[K] extends InputLoader<
  any,
  any
>
  ? z.infer<Data[K]['schema']>
  : undefined;
