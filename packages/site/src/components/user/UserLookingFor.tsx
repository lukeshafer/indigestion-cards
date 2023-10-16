import type { User } from '@lil-indigestion-cards/core/db/users';
import { Form, TextArea } from '../form';
import { createSignal, type JSX } from 'solid-js';
import { USER_API } from '@/constants';

export default function UserLookingFor(props: { user: User; isLoggedInUser: boolean }) {
	const [lookingFor, setLookingFor] = createSignal(props.user.lookingFor || '');
	const [isEditing, setIsEditing] = createSignal(false);

	return (
		<div class="text-gray-800">
			{isEditing() ? (
				<Form action={USER_API.USER} method="patch" onsubmit={() => setIsEditing(false)}>
					<input type="hidden" name="userId" value={props.user.userId} />
					<div class="flex gap-2">
						<p class="flex-1 pt-1">Looking for: </p>
						<div>
							<TextArea
								value={lookingFor()}
								name="lookingFor"
								inputOnly
								label={''}
								setValue={setLookingFor}
								height="2rem"
							/>
						</div>
					</div>
					<div class="flex items-center gap-2">
						<Button type="submit">Save</Button>
						<Button onclick={() => setIsEditing(false)}>Cancel</Button>
					</div>
				</Form>
			) : lookingFor().trim() ? (
				<div class="flex flex-col gap-2">
					<p class="max-w-sm">
						Looking for:{' '}
						<span class="whitespace-pre-line font-medium">{lookingFor() || '???'}</span>
					</p>
					{props.isLoggedInUser ? (
						<div class="flex items-center gap-2">
							<Button onClick={() => setIsEditing(true)}>Edit</Button>
							<div class="w-min">
								<Form
									action={USER_API.USER}
									method="patch"
									onsuccess={() => {
										setLookingFor('');
										setIsEditing(false);
									}}>
									<input type="hidden" name="userId" value={props.user.userId} />
									<input type="hidden" name="lookingFor" value=" " />
									<Button type="submit">Delete</Button>
								</Form>
							</div>
						</div>
					) : null}
				</div>
			) : props.isLoggedInUser ? (
				<>
					<p class="font-medium">What cards are you looking for?</p>
					<Button onClick={() => setIsEditing(true)}>Edit</Button>
				</>
			) : null}
		</div>
	);
}

function Button(props: JSX.ButtonHTMLAttributes<HTMLButtonElement>) {
	return (
		<button {...props} class="bg-brand-main px-2 py-1 font-semibold text-white">
			{props.children}
		</button>
	);
}
