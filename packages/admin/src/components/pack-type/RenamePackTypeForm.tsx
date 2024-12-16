import { createSignal, type Component } from 'solid-js';
import { SubmitButton, TextInput } from '../form/Form';
import { actions } from 'astro:actions';

export const RenamePackTypeForm: Component<{
	packTypeId: string;
	initialPackTypeName: string;
}> = props => {
	const [packTypeName, setPackTypeName] = createSignal(props.initialPackTypeName);

	return (
		<form
			method="post"
			class="my-4"
			onSubmit={async e => {
				e.preventDefault();
				const result = await actions.packTypes.renamePackType({
					packTypeId: props.packTypeId,
					packTypeName: packTypeName(),
				});

				if (result.error) {
					alert('There was an error changing the pack type name!');
					console.error(result.error);
					return;
				}

				location.reload();
			}}>
			<input type="hidden" name="packTypeId" value={props.packTypeId} />
			<div class="my-2 flex w-fit gap-2">
				<TextInput
					label="Update name"
					name="packTypeName"
					value={packTypeName()}
					setValue={setPackTypeName}
				/>
				<div class="self-end">
					<SubmitButton>Rename</SubmitButton>
				</div>
			</div>
		</form>
	);
};
