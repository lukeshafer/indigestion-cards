import { trpc } from '../lib/trpc';

export default function Index() {
	const users = trpc.cards.byUserId.query({ username: 'snailyLuke' }).then(console.log);
	return <></>;
}
