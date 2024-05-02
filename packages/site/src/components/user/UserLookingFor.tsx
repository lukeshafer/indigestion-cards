import type { User } from '@core/types';
import { Form, TextArea, SubmitButton, DeleteButton } from '../form/Form';
import { createSignal } from 'solid-js';
import { USER_API } from '@site/constants';

export default function UserLookingFor(props: { user: User; isLoggedInUser: boolean }) {
  // eslint-disable-next-line solid/reactivity
  const [lookingFor, setLookingFor] = createSignal(props.user.lookingFor || '');
  const [isEditing, setIsEditing] = createSignal(false);

  return (
    <div class="text-gray-800 dark:text-gray-100">
      {isEditing() ? (
        <Form action={USER_API.USER} method="patch" onsubmit={() => setIsEditing(false)}>
          <input type="hidden" name="userId" value={props.user.userId} />
          <div class="flex gap-2">
            <p class="flex-1 pt-1">Looking for: </p>
            <div>
              <TextArea
                value={lookingFor()}
                maxLength={500}
                name="lookingFor"
                inputOnly
                label={''}
                setValue={setLookingFor}
                height="2rem"
              />
            </div>
          </div>
          <div class="flex items-center gap-2">
            <SubmitButton>Save</SubmitButton>
            <DeleteButton onClick={() => setIsEditing(false)}>Cancel</DeleteButton>
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
              <SubmitButton onClick={() => setIsEditing(true)}>Edit</SubmitButton>
              {
                //<Button onClick={() => setIsEditing(true)}>Edit</Button>
              }
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
                  <DeleteButton>Delete</DeleteButton>
                </Form>
              </div>
            </div>
          ) : null}
        </div>
      ) : props.isLoggedInUser ? (
        <>
          <p class="font-medium">What cards are you looking for?</p>
          <SubmitButton onClick={() => setIsEditing(true)}>Edit</SubmitButton>
        </>
      ) : null}
    </div>
  );
}
