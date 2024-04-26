import { API } from "@admin/constants";
import { Form, SubmitButton, TextInput } from "../form/Form";

export default function CreatePreorderForm() {
	return (
		<Form action={API.PREORDER} method="post" successRefresh>
			<div class="flex w-full justify-start items-end gap-4">
				<div class="w-fit">
					<TextInput name="username" label="Username" required />
				</div>
				<SubmitButton>Add Preorder</SubmitButton>
			</div>
		</Form>
	)
}
