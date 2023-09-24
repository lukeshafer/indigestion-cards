import { USER_API } from "@/constants";
import { Form, SubmitButton } from "../form";

export default function PinCardToProfileButton(props: {
	userId: string;
	instanceId: string;
	designId: string;
}) {
	return <Form action={USER_API.USER} method="patch">
		<input type="hidden" name="userId" value={props.userId} />
		<input type="hidden" name="pinnedCardId" value={props.instanceId} />
		<input type="hidden" name="pinnedCardDesignId" value={props.designId} />
		<SubmitButton>Pin to profile</SubmitButton>
	</Form>
}
