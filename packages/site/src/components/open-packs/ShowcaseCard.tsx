import { createSignal, useContext } from 'solid-js';
import { OpenPacksContext, type PackEntityWithStatus } from './OpenPacksContext';
import { API, ASSETS } from '@/constants';
import TiltCardEffect from '../cards/TiltCardEffect';
import CardPreview from '../cards/CardPreview';
import Card from '../cards/Card';

export function ShowcaseCard(props: {
	card: PackEntityWithStatus['cardDetails'][number];
	packId: PackEntityWithStatus['packId'];
}) {
	const state = useContext(OpenPacksContext);

	// eslint-disable-next-line solid/reactivity
	const [flipped, setFlipped] = createSignal(props.card.opened);
	const isPreviewed = () => state.previewedCardId === props.card.instanceId;

	const flipCard = async () => {
		setFlipped(true);
		state.flipCard(props.card.instanceId);

		const body = new URLSearchParams({
			instanceId: props.card.instanceId,
			designId: props.card.designId,
			packId: props.packId,
		}).toString();

		const auth_token = localStorage.getItem('auth_token');
		state.isTesting
			? console.log('Card flipped: ', body)
			: await fetch(API.CARD, {
					method: 'PATCH',
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
						Authorization: auth_token ? `Bearer ${auth_token}` : '',
					},
					body,
			  });
	};

	const previewCard = () => {
		if (!flipped()) return;
		state.setPreviewedCardId(props.card.instanceId);
		state.removeNewStampStamp(props.card.instanceId);
	};

	const closePreview = () => {
		state.setPreviewedCardId('');
	};

	return (
		<li>
			<p class="error-text" />
			<div
				classList={{ flipped: flipped() }}
				style={{ width: state.cardScale * 18 + 'rem' }}
				class="perspective preserve-3d card-aspect-ratio relative block w-72 origin-center transition-transform duration-500">
				<button
					onClick={flipCard}
					class="backface-hidden absolute inset-0 h-full w-full cursor-pointer"
					title="Click to reveal">
					<div style={{ scale: 1 }} class="origin-top-left">
						<TiltCardEffect>
							<img
								src={ASSETS.CARDS.CARD_BACK}
								class="w-72"
								style={{ width: `calc(18rem * ${state.cardScale})` }}
							/>
						</TiltCardEffect>
					</div>
				</button>
				<div class="backface-hidden flipped absolute inset-0 h-full w-full">
					<button class="block origin-top-left" onClick={previewCard}>
						{isPreviewed() ? (
							<CardPreview close={closePreview}>
								<Card {...props.card} scale={state.cardScale * 1.5} />
							</CardPreview>
						) : (
							<Card {...props.card} scale={state.cardScale} />
						)}
					</button>
				</div>
			</div>
		</li>
	);
}
