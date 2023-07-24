import { api } from '@/constants';
import {
	Form,
	TextInput,
	IdInput,
	NumberInput,
	SubmitButton,
	Select,
	Fieldset,
} from '@/components/form/Form';
import { createSignal, For, Match, Switch } from 'solid-js';
import type { CardDesignEntity, SeasonEntity } from '@lil-indigestion-cards/core/card';
import { createStore } from 'solid-js/store';

export default function SeasonForm(props: { seasons: SeasonEntity[] }) {
	const [packTypeName, setPackTypeName] = createSignal('');
	const [category, setCategory] = createSignal('season');

	return (
		<Form method="post" action={api.PACK_TYPE.CREATE}>
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
				<Match when={category() === 'custom'}></Match>
			</Switch>
		</Form>
	);
}

function CustomCardPool(props: {
	cards: CardDesignEntity[]
}) {
	const [cardsSelected, setCardsSelected] = createStore<string[]>([]);

	return <Fieldset legend="Cards">
		<input name="cardDesigns" type="hidden" value={JSON.stringify(cardsSelected)} />
		<For each={props.cards}>

		</For>
	</Fieldset>;
}
