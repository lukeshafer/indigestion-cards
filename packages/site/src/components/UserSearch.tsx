import { publicApi } from '@/constants';
import { Form, TextInput } from '@/components/form/Form';
import SearchIcon from './icons/SearchIcon';
import { createSignal } from 'solid-js';
import CloseIcon from './icons/CloseIcon';

export default function UserSearch() {
  const [isVisible, setIsVisible] = createSignal(false);
  return (
    <div
      class="relative w-fit max-w-40 md:w-auto md:max-w-full"
      style={{
        'view-transition-name': 'user-search-bar',
      }}>
      <button
        title="Search"
        name="open-search"
        onClick={() => setIsVisible(v => !v)}
        class="bottom-0 left-1 top-0 z-10 fill-gray-900 dark:fill-gray-50 sm:hidden"
        style={{
          position: isVisible() ? 'absolute' : 'static',
        }}>
        {isVisible() ? <CloseIcon size="1.4rem" /> : <SearchIcon size="1.4rem" />}
      </button>
      <div style={{ "--display": isVisible() ? 'block' : 'none' }} class="[display:--display] sm:block">
        <Form action={publicApi.SEARCH} method="get">
          <TextInput
            class="pl-8 sm:pl-1"
            list="usernames"
            name="username"
            label="Search Users"
            inputOnly
            autocomplete="off"
          />
          <button
            type="submit"
            class="absolute right-0 top-0 h-full bg-white fill-gray-800 px-1 text-gray-500 dark:bg-black dark:fill-gray-300">
            <span class="sr-only">Search</span>
            <SearchIcon size="1.4rem" />
          </button>
        </Form>
      </div>
    </div>
  );
}
