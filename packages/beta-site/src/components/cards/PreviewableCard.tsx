import { Show, createSignal } from 'solid-js';
import CardPreview from './CardPreview';
import Card from './Card';

export default function PreviewableCard(props: { card: Parameters<typeof Card>[0] }) {
	const [isPreviewed, setIsPreviewed] = createSignal(false);

	return (
		<button
			class="block origin-top-left"
			onClick={() => setIsPreviewed(true)}
			title="Click to enlarge">
			<Show when={isPreviewed()} fallback={<Card {...props.card} />}>
				<CardPreview close={() => setIsPreviewed(false)}>
					<Card
						{...props.card}
						scale={typeof props.card.scale === 'number' ? props.card.scale * 1.5 : 1.5}
					/>
				</CardPreview>
				<div class="card-aspect-ratio w-[18em]" />
			</Show>
		</button>
	);
}
