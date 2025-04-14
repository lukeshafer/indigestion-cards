import { actions } from 'astro:actions';
import * as Form from '../form/Form';
import * as Solid from 'solid-js';
import type * as DB from '@core/types';
import { setAlerts } from '@admin/lib/client/state';

export const BatchPackForm: Solid.Component<{
	packTypes: Array<DB.PackType>;
}> = props => {
	const [isLoading, setIsLoading] = Solid.createSignal(false);
	const [successfulUsers, setSuccessfulUsers] = Solid.createSignal<Array<string>>([]);
	const [invalidUsers, setInvalidUsers] = Solid.createSignal<Array<string>>([]);
	let users = '';
	let selectedPackTypeId = '';

	return (
		<form
			class="relative"
			onSubmit={async e => {
				e.preventDefault();
				setIsLoading(true);
				try {
					const usernames = users.split('\n').map(s => s.trim());
					const result = await actions.packs.batchGivePacks({
						usernames,
						packTypeId: selectedPackTypeId,
					});

					if (result.error) {
						setAlerts(alerts => [
							{ message: result.error.message, type: 'error' },
							...alerts,
						]);
					} else {
						const { invalidUsers, successful } = result.data;

						setAlerts(alerts => [
							{ message: `Created ${successful.length} packs`, type: 'success' },
							...alerts,
						]);

						setSuccessfulUsers(successful);
						setInvalidUsers(invalidUsers);
					}
				} finally {
					setIsLoading(false);
				}
			}}>
			<Solid.Show when={isLoading()}>
				<Form.Loading loadingText="Submitting request" />
			</Solid.Show>
			<Form.TextArea
				name="usernames"
				label="Usernames (separate by new line)"
				setValue={v => (users = v)}
			/>
			<Form.Select
				name="packType"
				label="Pack Type"
				setValue={v => (selectedPackTypeId = v)}
				required
				options={[
					{ value: '', label: '--' },
					...props.packTypes.map(packType => ({
						value: packType.packTypeId,
						label: packType.packTypeName,
					})),
				]}
			/>
			<Form.SubmitButton disabled={isLoading()}>Save</Form.SubmitButton>
			<Solid.Show when={invalidUsers().length}>
				<h2 class="text-lg">Invalid Usernames</h2>
				<Solid.For each={invalidUsers()}>
					{username => <p class="py-4 text-red-500">{username}</p>}
				</Solid.For>
			</Solid.Show>
			<Solid.Show when={successfulUsers().length}>
				<h2 class="text-lg">Packs created for (1 pack per line)</h2>
				<Solid.For each={successfulUsers()}>
					{username => <p class="py-4">{username}</p>}
				</Solid.For>
			</Solid.Show>
		</form>
	);
};
