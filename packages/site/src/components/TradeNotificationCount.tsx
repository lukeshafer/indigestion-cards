import { Show, createResource, onCleanup, onMount } from 'solid-js';
import ButtonCount from './ButtonCount';
import { get } from '@site/lib/client/data';

export default function TradeNotificationCount(props: { username: string }) {
  console.log('trade notification count')
	const [count, { refetch }] = createResource(
		() => props.username,
		async username => {
			const user = await get('user', [username]);
			return (
				user?.tradeNotifications?.reduce(
					(acc, notif) => acc.add(notif.tradeId),
					new Set<string>()
				).size || 0
			);
		}
	);

  //let interval: NodeJS.Timeout;
	onMount(() => {
		globalThis.addEventListener?.('astro:page-load', refetch);
    // queueMicrotask(refetch);
    //interval = setInterval(refetch, 5000);
	});
	onCleanup(() => {
		globalThis.removeEventListener?.('astro:page-load', refetch);
    //clearInterval(interval);
	});

	return (
		<Show when={count()}>
			{count => <ButtonCount>{count() < 100 ? String(count()) : '99+'}</ButtonCount>}
		</Show>
	);
}
