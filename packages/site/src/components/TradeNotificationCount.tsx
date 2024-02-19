import ButtonCount from './ButtonCount';
import { createMemo } from 'solid-js';
import { fetchUserByUsername } from '@/client/data';

export default function TradeNotificationCount(props: { username: string }) {
  const user = fetchUserByUsername(props.username)

	const notificationCount = createMemo(
		() =>
			user.data?.tradeNotifications?.reduce(
				(acc, notif) => acc.add(notif.tradeId),
				new Set<string>()
			).size || 0
	);

	return (
		<div hidden={!notificationCount()}>
			<ButtonCount>{notificationCount() || 0}</ButtonCount>
		</div>
	);
}
