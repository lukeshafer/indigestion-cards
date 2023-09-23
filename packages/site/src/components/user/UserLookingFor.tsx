import type { UserEntity } from "@lil-indigestion-cards/core/user";
import { Form, TextInput } from "../form";
import { createSignal, type JSX } from "solid-js";
import { USER_API } from "@/constants";

export default function UserLookingFor(props: {
	user: UserEntity
	isLoggedInUser: boolean
}) {
	const [lookingFor, setLookingFor] = createSignal(props.user.lookingFor || "???");
	const [isEditing, setIsEditing] = createSignal(false);

	return <div class="text-gray-800">
		{isEditing() ? (
			<Form action={USER_API.USER} method="patch" onsubmit={() => setIsEditing(false)}>
				<input type="hidden" name="userId" value={props.user.userId} />
				<div class="flex items-center gap-2">
					<p class="font-medium">Looking for </p>
					<div>
						<TextInput name="lookingFor" inputOnly label={lookingFor() || ""} setValue={setLookingFor} />
					</div>
					<Button type="submit">Save</Button>
				</div>
			</Form>
		) : (
			<div class="flex gap-2 items-center">
				<p>Looking for <span class="font-medium">{lookingFor() || "???"}</span></p>
				{
					props.isLoggedInUser ? (
						<Button onClick={() => setIsEditing(true)}>Edit</Button>
					) : null
				}
			</div>
		)}
	</div>
}

function Button(props: JSX.ButtonHTMLAttributes<HTMLButtonElement>) {
	return <button
		{...props}
		class="bg-brand-main px-2 py-1 text-white font-semibold">
		{props.children}
	</button>
}
