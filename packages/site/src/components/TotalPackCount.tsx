import { Show } from 'solid-js';
import ButtonCount from './ButtonCount';
import { fetchPackCount } from '@/client/data';

export default function TotalPackCount(props: { count: number }) {
  const packCount = fetchPackCount({ initialCount: props.count })

  return <Show when={packCount.data}>{count => <ButtonCount>{count()}</ButtonCount>}</Show>;
}
