import type { JSX } from 'solid-js';
import type {
  RouteDefinition,
  DataGeneric,
  Params,
  InputKey,
  NoInputKey,
  DataOutput,
} from './utils.d.ts';
import type { RouteSectionProps } from '@solidjs/router';

export function createClient<Data extends DataGeneric>() {
  const defineRoute = <Key extends keyof Data>(
    route: string,
    data: Array<Key>,
    component: (
      props: RouteSectionProps<{ [K in Key]: Awaited<ReturnType<Data[K]['load']>> }>
    ) => JSX.Element
  ): RouteDefinition<Data, Key> => ({ route, data, component });

  async function get<Path extends NoInputKey<Data>>(path: Path): Promise<DataOutput<Data, Path>>;
  async function get<Path extends InputKey<Data>>(
    path: Path,
    input: Params<Data, Path>
  ): Promise<DataOutput<Data, Path>>;
  async function get<Path extends keyof Data>(
    path: Path,
    input?: Params<Data, Path>
  ): Promise<DataOutput<Data, Path>> {
    const url = input ? `/data/${String(path)}?${new URLSearchParams(input).toString()}` : `/data/${String(path)}`;

    const res = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
    if (!res.ok) {
      console.error(res);
      throw new Error('Res not okay');
    }

    return res.json();
  }

  return { defineRoute, get };
}
