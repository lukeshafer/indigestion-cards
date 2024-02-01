import { Show, createResource, onCleanup, onMount } from 'solid-js';
import ButtonCount from './ButtonCount';
import { get } from '@/lib/client/data';

export default function TradeNotificationCount(props: { username: string }) {
	const [count, { refetch }] = createResource(
		() => props.username,
		async username => {
      console.log('fetching notification count')
			const user = await get('user', [username]);
			return (
				user?.tradeNotifications?.reduce(
					(acc, notif) => acc.add(notif.tradeId),
					new Set<string>()
				).size || 0
			);
		}
	);

	onMount(() => globalThis.addEventListener?.('astro:page-load', refetch));
	onCleanup(() => globalThis.removeEventListener?.('astro:page-load', refetch));

	return (
		<Show when={count()}>
			{count => <ButtonCount>{count() < 100 ? String(count()) : '99+'}</ButtonCount>}
		</Show>
	);
}
