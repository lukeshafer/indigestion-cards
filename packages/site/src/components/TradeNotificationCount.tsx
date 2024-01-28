import { Show, createResource } from 'solid-js';
import ButtonCount from './ButtonCount';
import { get } from '@/lib/client/data';

export default function TradeNotificationCount(props: { username: string }) {
	const [count] = createResource(
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

	return (
		<Show when={count()}>
			{count => <ButtonCount>{count() < 100 ? String(count()) : '99+'}</ButtonCount>}
		</Show>
	);
}
