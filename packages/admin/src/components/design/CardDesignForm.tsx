import { API, routes } from '@admin/constants';
import {
	Checkbox,
	Fieldset,
	Form,
	IdInput,
	NumberInput,
	Select,
	SubmitButton,
	TextArea,
	TextInput,
} from '@admin/components/form/Form';
import Card from '@admin/components/cards/Card';
import DeleteImageButton from '@admin/components/image/DeleteImageButton';
import { For, createSignal } from 'solid-js';
import type { Season, Rarity } from '@core/types';

export default function CardDesignForm(props: {
	imgUrl: string;
	key: string;
	seasons: Season[];
	rarities: Rarity[];
	baseRarity: Omit<Rarity, 'defaultCount'>;
}) {
	const [cardName, setCardName] = createSignal('');
	const [cardDescription, setCardDescription] = createSignal('');
	const [isLegacy, setIsLegacy] = createSignal(false);

	return (
		<div class="relative grid justify-start gap-4">
			<div class="relative grid justify-start gap-4">
				<Card
					rarityId={props.baseRarity.rarityId}
					rarityName={props.baseRarity.rarityName}
					rarityColor={props.baseRarity.rarityColor}
					frameUrl={props.baseRarity.frameUrl}
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
				action={API.DESIGN}
				method="post"
				successRedirect={`${routes.DESIGNS}?alert=Design%20created!&type=success`}>
				<input type="hidden" name="imgUrl" value={props.imgUrl} />
				<input type="hidden" name="imageKey" value={props.key} />
				<Select
					label="Season"
					name="season"
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
				<Fieldset legend="Rarity Details">
					<For each={props.rarities}>
						{rarity => (
							<NumberInput
								label={`${rarity.rarityName}, ${rarity.rarityId}`}
								name={`rarity-${rarity.rarityId}-count`}
								value={isLegacy() ? 0 : rarity.defaultCount}
								required
							/>
						)}
					</For>
					<Checkbox
						label="Include full art card?"
						name="fullArt"
						value={isLegacy() ? false : undefined}
					/>
					<Checkbox label="Legacy card?" name="legacy" setValue={setIsLegacy} />
				</Fieldset>
				<SubmitButton />
			</Form>
		</div>
	);
}
