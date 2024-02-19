import ButtonCount from './ButtonCount';
import { createMemo } from 'solid-js';
import { get } from '@/lib/client/data';
import { createAsync } from '@solidjs/router';

export default function TradeNotificationCount(props: { username: string }) {
  const user = createAsync(async (username) => {
    const user = await get('user', [props.username]);
    return (
      user?.tradeNotifications?.reduce(
        (acc, notif) => acc.add(notif.tradeId),
        new Set<string>()
      ).size || 0
    );
  }
  )


  const notificationCount = createMemo(
    () =>
      user().tradeNotifications?.reduce(
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
