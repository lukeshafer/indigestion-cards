import type { PackType } from '@core/types';
import { Form, Select, SubmitButton } from '../form/Form';
import { API } from '@admin/constants';

export default function ConvertPreordersToPacksForm(props: { packTypes: PackType[] }) {
	return (
		<Form action={API.CONVERT_PREORDERS} method="post" successRefresh>
			<div class="flex w-full items-end justify-start gap-4">
				<div class="w-fit">
					<Select
						name="packTypeId"
						label="Pack Type"
						required
						options={[
							{
								value: '',
								label: 'Select a pack type',
							},
						].concat(
							props.packTypes.map((packType) => ({
								label: packType.packTypeName,
								value: packType.packTypeId,
							}))
						)}
					/>
				</div>
				<SubmitButton>Convert All Preorders</SubmitButton>
			</div>
		</Form>
	);
}
