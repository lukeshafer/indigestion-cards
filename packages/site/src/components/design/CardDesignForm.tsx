import { api } from '@/constants';
import {
	Fieldset,
	Form,
	IdInput,
	NumberInput,
	Select,
	SubmitButton,
	TextArea,
	TextInput,
} from '../form/Form';
import Card from '@/components/cards/Card';
import DeleteImageButton from '@/components/image/DeleteImageButton';
import { For, createSignal } from 'solid-js';
import type { SeasonEntity, RarityEntity } from '@lil-indigestion-cards/core/card';

export default function CardDesignForm(props: {
	imgUrl: string;
	key: string;
	seasons: SeasonEntity[];
	rarities: RarityEntity[];
	baseRarity: Omit<RarityEntity, 'defaultCount'>;
}) {
	const [cardName, setCardName] = createSignal('');
	const [cardDescription, setCardDescription] = createSignal('');

	return (
		<div class="relative grid justify-start gap-4">
			<div class="relative grid justify-start gap-4">
				<Card
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
			<Form action={api.DESIGN.CREATE} method="post">
				<input type="hidden" name="imgUrl" value={props.imgUrl} />
				<input type="hidden" name="imageKey" value={props.key} />
				<Select
					label="Season"
					name="season"
					required
					options={props.seasons.map((season) => ({
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
						{(rarity) => (
							<NumberInput
								label={rarity.rarityName}
								name={`rarity-${rarity.rarityId}-count`}
								value={rarity.defaultCount}
								required
							/>
						)}
					</For>
				</Fieldset>
				<SubmitButton />
			</Form>
		</div>
	);
}