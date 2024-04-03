import { API, routes } from "@/constants";
import {
	Form,
	IdInput,
	Select,
	SubmitButton,
	TextArea,
	TextInput,
} from "@/components/form/Form";
import Card from "@/components/cards/Card";
import DeleteImageButton from "@/components/image/DeleteImageButton";
import { createSignal } from "solid-js";
import type { Season } from "@lil-indigestion-cards/core/db/season";
import type { Rarity } from "@lil-indigestion-cards/core/db/rarities";

export default function CardDesignForm(props: {
	imgUrl: string;
	key: string;
	seasons: Season[];
	rarities: Rarity[];
	baseRarity: Omit<Rarity, "defaultCount">;
}) {
	const [cardName, setCardName] = createSignal("");
	const [cardDescription, setCardDescription] = createSignal("");

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
				action={API.MOMENT_CARD}
				method="post"
				successRedirect={`${routes.DESIGNS}?alert=Moment%20card%20created!&type=success`}
			>
				<input type="hidden" name="imgUrl" value={props.imgUrl} />
				<input type="hidden" name="imageKey" value={props.key} />
				<Select
					label="Season"
					name="season"
					value={JSON.stringify({
						seasonId: "moments",
						seasonName: "Moments",
					})}
					required
					options={props.seasons
						.slice()
						.reverse()
						.map((season) => ({
							label: season.seasonName,
							value: JSON.stringify({
								seasonId: season.seasonId,
								seasonName: season.seasonName,
							}),
						}))}
				/>
				<TextInput
					label="Card Name"
					name="cardName"
					required
					setValue={setCardName}
				/>
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
					value="moments"
					options={props.rarities.map((rarity) => ({
						value: rarity.rarityId,
						label: rarity.rarityName,
					}))}
				/>
				<SubmitButton />
			</Form>
		</div>
	);
}
