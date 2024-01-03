import { Show } from 'solid-js';
import ButtonCount from './ButtonCount';
import { createQuery } from '@tanstack/solid-query';
import { trpc } from '@/client/trpc';

export default function TotalPackCount(props: { count: number }) {
	const packCount = createQuery(() => ({
		queryKey: ['packs', 'count'],
		queryFn: async () => trpc.packs.count.query(),
		initialData: () => props.count,
	}));

	return <Show when={packCount.data}>{count => <ButtonCount>{count()}</ButtonCount>}</Show>;
}
