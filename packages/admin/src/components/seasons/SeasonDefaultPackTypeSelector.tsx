import type { PackType, Season } from '@core/types';
import { Form, Select, SubmitButton } from '../form/Form';
import { createSignal, Show } from 'solid-js';
import { API } from '@admin/constants';

export default function SeasonDefaultPackTypeSelector(props: {
	packTypes: Array<PackType>;
	season: Season;
}) {
	const [modifiedPackType, setModifiedPackType] = createSignal<string | null>(null);
	const packType = () => modifiedPackType() ?? props.season.defaultPackTypeId;

	return (
		<div class="my-4">
			<Form action={API.SEASON} method="patch" successRefresh={true}>
				<input type="hidden" name="seasonId" value={props.season.seasonId} />
				<input type="hidden" name="seasonName" value={props.season.seasonName} />
				<div class="flex items-end gap-4">
					<Select
						name="defaultPackTypeId"
						label="Default Pack Type"
						value={packType() ?? ''}
						setValue={setModifiedPackType}
						options={[
							{ value: '', label: '' },
							...props.packTypes.map(p => ({
								value: p.packTypeId,
								label: p.packTypeName,
							})),
						]}
					/>

					<Show when={packType() !== props.season.defaultPackTypeId}>
						<SubmitButton>Save</SubmitButton>
					</Show>
				</div>
			</Form>
		</div>
	);
}
