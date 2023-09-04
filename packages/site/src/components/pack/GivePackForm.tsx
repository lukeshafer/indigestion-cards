import { Form, Select, SubmitButton, TextInput } from '@/components/form/Form';
import { setTotalPackCount } from '@/lib/client/state';
import { API } from '@/constants';
import type { PackTypeEntity } from '@lil-indigestion-cards/core/card';

export default function GivePackForm(props: { packTypes: PackTypeEntity[] }) {
	return (
		<Form action={API.PACK} method="post" onsubmit={() => setTotalPackCount((val) => val - 1)}>
			<TextInput name="username" label="Username">
				<p>Leave blank for no user.</p>
			</TextInput>
			<Select
				name="packType"
				label="Pack Type"
				required
				options={[
					{ value: '', label: '--' },
					...props.packTypes.map((packType) => ({
						value: JSON.stringify(packType),
						label: packType.packTypeName,
					})),
				]}
			/>
			<SubmitButton>Save</SubmitButton>
		</Form>
	);
}
