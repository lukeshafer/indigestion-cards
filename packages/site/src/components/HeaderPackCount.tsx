import { createResource, onCleanup, onMount, type Component } from 'solid-js';
import ButtonCount from './ButtonCount';
import { createWSClient } from '@site/lib/ws-client';
import { trpc } from '@site/lib/client/trpc';

export const HeaderPackCount: Component<{ initialPackCount: number }> = props => {
	const [packCount, { refetch: refreshPackCount }] = createResource(
		() => trpc.packs.packCount.query(),
		{
			ssrLoadFrom: 'initial',
			initialValue: props.initialPackCount,
		}
	);

	onMount(() => {
		const wsClient = createWSClient({
			onmessage: {
				REFRESH_PACKS: () => {
					console.log('Refreshing pack count...');
					refreshPackCount();
				},
			},
		});
		if (wsClient) onCleanup(() => wsClient.close());
	});

	return <ButtonCount>{packCount.latest}</ButtonCount>;
};
