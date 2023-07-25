import { api } from '@/constants';
import { Form, TextInput, IdInput, SubmitButton, NumberInput } from '@/components/form/Form';
import { createSignal } from 'solid-js';

export default function RarityForm(props: { imgUrl: string; key: string; bucket: string }) {
	const [rarityName, setRarityName] = createSignal('');

	return (
		<Form action={api.RARITY.CREATE} method="post">
			<input type="hidden" name="imgUrl" value={props.imgUrl} />
			<input type="hidden" name="imageKey" value={props.key} />
			<input type="hidden" name="bucket" value={props.bucket} />
			<TextInput label="Rarity Name" name="rarityName" required setValue={setRarityName} />
			<IdInput label="Rarity ID" name="rarityId" required from={rarityName()} />
			<TextInput
				label="Rarity Color (HEX code)"
				name="rarityColor"
				required
				placeholder="#EF6EDA"
			/>
			<NumberInput label="Default Number per Card" name="defaultCount" required value={0} />
			<SubmitButton>Save</SubmitButton>
		</Form>
	);
}
