import { API, routes } from '@/constants';
import {
	Form,
	TextInput,
	IdInput,
	NumberInput,
	SubmitButton,
	Select,
	Fieldset,
	Checkbox,
} from '@/components/form/Form';
import { createEffect, createSignal, For, Match, Switch } from 'solid-js';
import type { CardDesignEntity, SeasonEntity } from '@lil-indigestion-cards/core/card';

export default function PackTypeForm(props: {
	seasons: SeasonEntity[];
	cardDesigns: CardDesignEntity[];
}) {
	const [packTypeName, setPackTypeName] = createSignal('');
	const [category, setCategory] = createSignal('season');

	return (
		<Form
			method="post"
			action={API.PACK_TYPE}
			successRedirect={`${routes.PACK_TYPES}?alert=Pack%20type%20created!&type=success`}>
			<TextInput label="Name" name="packTypeName" required setValue={setPackTypeName} />
			<IdInput label="ID" name="packTypeId" required from={packTypeName()} />
			<TextInput label="Description" name="packTypeDescription" />
			<NumberInput
				label="Number of cards per pack"
				name="cardCountPerPack"
				required
				value={5}
			/>
			<Select
				name="category"
				label="Card pool"
				setValue={setCategory}
				required
				options={[
					{ label: 'Season', value: 'season' },
					{ label: 'Custom', value: 'custom' },
				]}
			/>
			<Switch>
				<Match when={category() === 'season'}>
					<Select
						name="season"
						label="Season"
						required
						options={props.seasons.map((season) => ({
							label: season.seasonName,
							value: JSON.stringify({
								seasonId: season.seasonId,
								seasonName: season.seasonName,
							}),
						}))}
					/>
				</Match>
				<Match when={category() === 'custom'}>
					<CustomCardPool cards={props.cardDesigns} />
				</Match>
			</Switch>
			<SubmitButton>Save</SubmitButton>
		</Form>
	);
}

function CustomCardPool(props: { cards: CardDesignEntity[] }) {
	interface DesignDetails {
		designId: string;
		cardName: string;
		imgUrl: string;
	}
	const [cardsSelected, setCardsSelected] = createSignal<Record<string, DesignDetails>>({});
	const designDetails = (): DesignDetails[] => Object.values(cardsSelected());

	return (
		<Fieldset legend="Cards">
			<input name="cardDesigns" type="hidden" value={JSON.stringify(designDetails())} />
			<For each={props.cards}>
				{(card) => (
					<Checkbox
						name={card.designId}
						label={card.cardName}
						setValue={(value) => {
							if (value) {
								setCardsSelected((selected) => ({
									...selected,
									[card.designId]: {
										designId: card.designId,
										cardName: card.cardName,
										imgUrl: card.imgUrl,
									},
								}));
							} else {
								setCardsSelected((selected) => {
									const newSelected = { ...selected };
									delete newSelected[card.designId];
									return newSelected;
								});
							}
						}}
					/>
				)}
			</For>
		</Fieldset>
	);
}
