import { api } from '@/constants';
import { Form, DeleteButton } from '@/components/form/Form';
import { createSignal } from 'solid-js';

export default function DeleteRarityButton(props: { rarityId: string; frameUrl: string }) {
	return (
		<div class="mx-auto w-fit">
			<Form
				method="delete"
				action={api.RARITY.DELETE}
				confirm="Are you sure you want to delete this rarity?">
				<input type="hidden" name="rarityId" value={props.rarityId} />
				<input type="hidden" name="frameUrl" value={props.frameUrl} />
				<DeleteButton />
			</Form>
		</div>
	);
}
