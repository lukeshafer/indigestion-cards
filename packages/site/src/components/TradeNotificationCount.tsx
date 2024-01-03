import { trpc } from '@/client/trpc';
import ButtonCount from './ButtonCount';
import { createQuery } from '@tanstack/solid-query';
import { createMemo } from 'solid-js';

export default function TradeNotificationCount(props: { username: string }) {
	const user = createQuery(() => ({
		queryKey: ['users', 'byUsername', props.username],
		queryFn: () => trpc.users.byUsername.query({ username: props.username }),
	}));

	const notificationCount = createMemo(
		() =>
			user.data?.tradeNotifications?.reduce(
				(acc, notif) => acc.add(notif.tradeId),
				new Set<string>()
			).size
	);

	return (
		<div hidden={!notificationCount()}>
			<ButtonCount>{notificationCount() || 0}</ButtonCount>
		</div>
	);
}
