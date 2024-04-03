import { API, routes } from '@/constants';
import { Form, IdInput, Select, SubmitButton, TextArea, TextInput } from '@/components/form/Form';
import Card from '@/components/cards/Card';
import DeleteImageButton from '@/components/image/DeleteImageButton';
import { createSignal } from 'solid-js';
import type { Season } from '@lil-indigestion-cards/core/db/season';
import type { Rarity } from '@lil-indigestion-cards/core/db/rarities';
import type { MomentRedemption } from '@lil-indigestion-cards/core/db/moments';
import type { MomentCardInput } from '@lil-indigestion-cards/core/lib/moments';

export default function CardDesignForm(props: {
	imgUrl: string;
	key: string;
	seasons: Season[];
	rarities: Rarity[];
	redemptions: MomentRedemption[];
  momentDate: string;
}) {
	const [cardName, setCardName] = createSignal('');
	const [cardDescription, setCardDescription] = createSignal('');

	const momentRarity =
		// eslint-disable-next-line solid/reactivity
		props.rarities.find(rarity => rarity.rarityId === 'moments') || props.rarities[0];

	const [selectedRarity, setSelectedRarity] = createSignal<MomentCardInput.Rarity>(momentRarity);

	return (
		<div class="relative grid justify-start gap-4">
			<div class="relative grid justify-start gap-4">
				<Card
					rarityId={selectedRarity().rarityId}
					rarityName={selectedRarity().rarityName}
					rarityColor={selectedRarity().rarityColor}
					frameUrl={selectedRarity().frameUrl}
					imgUrl={props.imgUrl}
					cardName={cardName()}
					cardDescription={cardDescription()}
					designId=""
					cardNumber={1}
					totalOfType={1}
				/>
				<DeleteImageButton key={props.key} type="cardDesign" />
			</div>
			<Form
				action={API.MOMENT_CARD}
				method="post"
				successRedirect={`${routes.DESIGNS}?alert=Moment%20card%20created!&type=success`}>
				<input type="hidden" name="imgUrl" value={props.imgUrl} />
				<input type="hidden" name="imageKey" value={props.key} />
				<input type="hidden" name="momentDate" value={props.momentDate} />
				<input
					type="hidden"
					name="users"
					value={JSON.stringify(
						props.redemptions.map(r => ({
							userId: r.userId,
							username: r.username,
						})) satisfies MomentCardInput.Users
					)}
				/>
				<Select
					label="Season"
					name="season"
					value={JSON.stringify({
						seasonId: 'moments',
						seasonName: 'Moments',
					})}
					required
					options={props.seasons.map(season => ({
						label: season.seasonName,
						value: JSON.stringify({
							seasonId: season.seasonId,
							seasonName: season.seasonName,
						}),
					}))}
				/>
				<TextInput label="Card Name" name="cardName" required setValue={setCardName} />
				<IdInput label="ID" name="designId" required from={cardName()} />
				<TextArea
					label="Card Description"
					name="cardDescription"
					required
					setValue={setCardDescription}
				/>
				<TextInput label="Artist" name="artist" required />
				<Select
					label="Rarity"
					name="rarity"
					setValue={value => setSelectedRarity(JSON.parse(value))}
					value={JSON.stringify({
						rarityId: momentRarity.rarityId,
						rarityName: momentRarity.rarityName,
						frameUrl: momentRarity.frameUrl,
						rarityColor: momentRarity.rarityColor,
					} satisfies MomentCardInput.Rarity)}
					options={props.rarities.map(rarity => ({
						value: JSON.stringify({
							rarityId: rarity.rarityId,
							rarityName: rarity.rarityName,
							frameUrl: rarity.frameUrl,
							rarityColor: rarity.rarityColor,
						} satisfies MomentCardInput.Rarity),
						label: rarity.rarityName,
					}))}
				/>
				<SubmitButton />
			</Form>
		</div>
	);
}
