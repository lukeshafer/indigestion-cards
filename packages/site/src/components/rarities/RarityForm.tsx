import { api_paths, routes } from '@/constants';
import { Form, TextInput, IdInput, SubmitButton, NumberInput } from '@/components/form/Form';
import { createSignal } from 'solid-js';

export default function RarityForm(props: { imgUrl: string; key: string; bucket: string }) {
	const [rarityName, setRarityName] = createSignal('');
	const apiUrl = localStorage.getItem('api_url') ?? '';

	return (
		<Form
			action={apiUrl + api_paths.RARITY}
			method="post"
			successRedirect={`${routes.RARITIES}?alert=Rarity%20created!&type=success`}>
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
