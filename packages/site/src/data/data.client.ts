import { createClient } from './lib/client';
import type { Data } from './data.server';
import type { DataOutput } from './lib/utils';
import { createAsync, type RouteSectionProps } from '@solidjs/router';

export const client = createClient<Data>();
export type Route = ReturnType<(typeof client)['defineRoute']>;
export type RouteData<R extends Route> = {
  [Key in R['data'][number]]: DataOutput<Data, Key>;
};

export function createData<Key extends keyof Data>(
  data: Key,
  props: RouteSectionProps
): () => DataOutput<Data, Key> | undefined {
  return createAsync(() => client.get(data, props.params), { initialValue: props.data?.[data] });
}

// createData('card', props) =>
// createAsync(() => client.get('card', { designId: props.params.designId }), { initialValue: props.data?.card })
