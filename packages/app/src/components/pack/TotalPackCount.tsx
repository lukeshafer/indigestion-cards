import { Show, createResource } from 'solid-js';
import ButtonCount from '../ButtonCount';
import { get } from '@/lib/client/data';

export default function TotalPackCount() {
	const [count] = createResource(async () => get('pack-count').then(d => d.packCount));
	return <Show when={count()}>{packCount => <ButtonCount>{packCount()}</ButtonCount>}</Show>;
}
