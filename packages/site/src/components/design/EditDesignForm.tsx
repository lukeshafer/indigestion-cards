import { Form, SubmitButton, TextArea } from '@/components/form';
import { API } from '@/constants';
import { Show, createSignal } from 'solid-js';
import type { CardDesign } from '@lil-indigestion-cards/core/db/cardDesigns';

export default function EditDesignForm(props: CardDesign) {
	const [isEditing, setIsEditing] = createSignal(false);

	return (
		<section class="flex flex-col items-center gap-6">
			<SubmitButton onClick={() => setIsEditing((v) => !v)}>Issue Reprint</SubmitButton>
			<Show when={isEditing()}>
				<Form action={API.DESIGN} method="patch" onsuccess={() => window.location.reload()}>
					<input type="hidden" name="designId" value={props.designId} />
					<TextArea
						label="New Description"
						name="cardDescription"
						value={props.cardDescription}
						required
					/>
					<SubmitButton>Save</SubmitButton>
				</Form>
			</Show>
		</section>
	);
}
