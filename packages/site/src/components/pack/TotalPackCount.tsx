import { Show, createResource } from 'solid-js';
import ButtonCount from '../ButtonCount';
import { trpc } from '@/trpc/client';

export default function TotalPackCount() {
	const [count] = createResource(async () => trpc.packs.count.query());
	return <Show when={count()}>{packCount => <ButtonCount>{packCount()}</ButtonCount>}</Show>;
}
