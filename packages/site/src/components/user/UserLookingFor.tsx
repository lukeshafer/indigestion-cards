import type { UserEntity } from "@lil-indigestion-cards/core/user";
import { Form, TextInput } from "../form";
import { createSignal, type JSX } from "solid-js";

export default function UserLookingFor(props: {
	user: UserEntity
	isLoggedInUser: boolean
}) {
	const [isEditing, setIsEditing] = createSignal(false);

	return <div class="text-gray-800">
		{isEditing() ? (
			<Form action="/api/user" method="post" onsubmit={() => setIsEditing(false)}>
				<div class="flex items-center gap-2">
					<p class="font-semibold">Looking for </p>
					<div>
						<TextInput name="lookingFor" inputOnly label={props.user.lookingFor || ""} />
					</div>
					<Button type="submit">Save</Button>
				</div>
			</Form>
		) : (
			<div class="flex gap-2 items-center">
				<p class="font-medium">Looking for {props.user.lookingFor || "???"}</p>
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
