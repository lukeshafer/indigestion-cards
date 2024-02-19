import { Show } from 'solid-js';
import ButtonCount from './ButtonCount';
import { createAsync } from '@solidjs/router';
import { get } from '@/lib/client/data';

export default function TotalPackCount(props: { count: number }) {
  const packCount = createAsync(() => get('pack-count'), { initialValue: { packCount: props.count } })

  return <Show when={packCount().packCount}>{count => <ButtonCount>{count()}</ButtonCount>}</Show>;
}
