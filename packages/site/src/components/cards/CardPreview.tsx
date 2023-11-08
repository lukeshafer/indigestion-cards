import type { JSX } from 'solid-js';
import { Portal } from 'solid-js/web';

export default function CardPreview(props: { children?: JSX.Element; close: () => void }) {
	return (
		<Portal mount={document.getElementById('card-preview') ?? undefined}>
			<div
				class="absolute inset-0 z-50 m-auto flex h-full w-full items-center justify-center pt-4"
				onClick={() => props.close()}>
				{props.children}
			</div>
		</Portal>
	);
}
