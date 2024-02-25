import { Show, createResource } from 'solid-js';
import ButtonCount from '../ButtonCount';
import { client } from '@/data/data.client';

export default function TotalPackCount() {
	const [count] = createResource(async () => client.get('packCount'));
	return <Show when={count()}>{packCount => <ButtonCount>{packCount()}</ButtonCount>}</Show>;
}
