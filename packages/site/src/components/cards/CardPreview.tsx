import { JSX, createSignal } from 'solid-js';
import { createEffect } from 'solid-js';
import { Portal } from 'solid-js/web';
import Card from './Card';

type CardProps = Parameters<typeof Card>[0];

export default function CardPreview(props: {
	card?: CardProps;
	isOpen: boolean;
	setIsOpen: (val: boolean) => void;
}) {
	const [dialog, setDialog] = createSignal<HTMLDialogElement | null>(null);

	const closeDialog = (e: Event) => {
		if (e.target === dialog()) {
			dialog()?.close();
			dialog()?.removeEventListener('click', closeDialog);
			props.setIsOpen(false);
		}
	};

	createEffect(() => {
		if (props.card && props.isOpen) {
			dialog()?.showModal();
			dialog()?.addEventListener('click', closeDialog);
		} else {
			dialog()?.close();
			dialog()?.removeEventListener('click', closeDialog);
			props.setIsOpen(false);
		}
	});

	return (
		<Portal mount={document.getElementById('card-preview') ?? undefined}>
			<dialog
				ref={setDialog}
				class="absolute inset-0 z-50 m-auto text-4xl backdrop:bg-black/25">
				{props.card ? <Card {...props.card} /> : null}
			</dialog>
		</Portal>
	);
}
