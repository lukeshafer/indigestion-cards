import { API, routes } from '@admin/constants';
import { Form, TextInput, IdInput, SubmitButton, NumberInput } from '@admin/components/form/Form';
import { createSignal } from 'solid-js';
import DeleteImageButton from '../image/DeleteImageButton';
import { css } from '@acab/ecsstatic';

export default function RarityForm(props: { imgUrl: string; key: string; bucket: string }) {
	const [rarityName, setRarityName] = createSignal('');
	const [frameBg, setFrameBg] = createSignal('');
	const frameWithoutPropertyOrSemicolon = () =>
		frameBg().replace('background:', '').replaceAll(';', '');

	const imgCss = css`
		background: var(--frameBg, transparent);
	`;
	return (
		<div class="flex max-w-4xl flex-col gap-8 pt-8">
			<div>
				<img
					src={props.imgUrl}
					style={{ '--frameBg': `${frameWithoutPropertyOrSemicolon()}` }}
					class={`mb-4 h-auto w-60 object-contain ${imgCss}`}
					id="rarity-frame-preview"
				/>
				<DeleteImageButton key={props.key} type="frame" />
			</div>
			<Form
				action={API.RARITY}
				method="post"
				successRedirect={`${routes.RARITIES}?alert=Rarity%20created!&type=success`}>
				<input type="hidden" name="imgUrl" value={props.imgUrl} />
				<input type="hidden" name="imageKey" value={props.key} />
				<input type="hidden" name="bucket" value={props.bucket} />
				<TextInput
					label="Rarity Name"
					name="rarityName"
					required
					setValue={setRarityName}
				/>
				<IdInput label="Rarity ID" name="rarityId" required from={rarityName()} />
				<div class="w-full">
					<TextInput
						label="Rarity Background (HEX code or CSS background, see )"
						name="rarityColor"
						value={frameWithoutPropertyOrSemicolon()}
						setValue={setFrameBg}
						required
						placeholder="#EF6EDA"
					/>
					<a
						class="dark text-blue-800 underline dark:text-blue-200"
						target="_blank"
						href="https://www.learnui.design/tools/gradient-generator.html">
						CSS gradient generator
					</a>
				</div>
				<NumberInput
					label="Default Number per Card"
					name="defaultCount"
					required
					value={0}
				/>
				<SubmitButton>Save</SubmitButton>
			</Form>
		</div>
	);
}
