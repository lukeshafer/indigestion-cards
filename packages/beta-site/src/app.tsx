import { Router, type RouteSectionProps } from '@solidjs/router';
import { FileRoutes } from '@solidjs/start/router';
import './app.css';
import '@fontsource-variable/montserrat';
import { type Component, createContext, type JSX, onMount, Show, Suspense } from 'solid-js';
import { logos, type Logo } from './constants';
import { createMutable } from 'solid-js/store';

export default function App() {
	return (
		<Router root={PageRoot}>
			<FileRoutes />
		</Router>
	);
}

const PageContext = createContext({
	wide: false,
	class: '',
	logo: 'default' as Logo,
	isPasswordValid: false,
});

const PageRoot: Component<RouteSectionProps> = props => {
	const context = createMutable(PageContext.defaultValue);
	onMount(() => {
		if (window.localStorage.isPasswordValid === 'true') {
			context.isPasswordValid = true;
		}
	});
	return (
		<PageContext.Provider value={context}>
			<Show
				when={context.isPasswordValid}
				fallback={
					<PasswordFallbackPage
						onSuccess={() => {
							context.isPasswordValid = true;
							window.localStorage.isPasswordValid = 'true';
						}}
					/>
				}>
				<header class="max-w-main mx-auto flex items-center gap-8 px-8 py-4">
					<a href="/" title="Home">
						<SiteLogo logo={context.logo} />
					</a>
					<nav class="flex gap-6">
						<NavLink href="/cards">Cards</NavLink>
						<NavLink href="/users">Users</NavLink>
						<NavLink href="/trades">Trade</NavLink>
					</nav>
					<nav class="flex flex-1 justify-end">
						<NavLink href="/me">snailyLuke</NavLink>
					</nav>
				</header>

				<main
					style={{ 'view-transition-name': context.wide ? undefined : 'main' }}
					data-wide={String(context.wide)}
					classList={{
						[context.class]: true,
					}}
					class="@container/main max-w-main mx-auto mb-8 mt-4 w-full flex-1 px-8">
					<Suspense>{props.children}</Suspense>
				</main>
				<div id="card-preview"></div>
			</Show>
		</PageContext.Provider>
	);
};

const NavLink: Component<Omit<JSX.AnchorHTMLAttributes<HTMLAnchorElement>, 'class'>> = props => (
	<a
		class="rounded-md px-2 py-1 text-gray-900 hover:bg-gray-200 dark:text-gray-100 hover:dark:bg-gray-800"
		{...props}
	/>
);

const SiteLogo: Component<{ logo: Logo }> = props => (
	<div class="flex items-center gap-2">
		<img
			src={logos[props.logo]}
			class="dark:invert"
			alt="Logo, a stylized outline drawing of Ryan's face."
			width="55"
		/>
		<div class="font-display hidden pt-1 lowercase sm:grid">
			<span class="text-brand-500 dark:text-brand-400 mt-1 text-2xl italic">Indigestion</span>
			<span class="-mt-2 text-lg text-gray-600 dark:text-gray-200">Cards</span>
		</div>
	</div>
);

const PASSWORD_HASH = 106433500;
const PasswordFallbackPage: Component<{ onSuccess: () => void }> = props => (
	<form
		class="grid h-screen w-full place-content-center"
		onsubmit={e => {
			e.preventDefault();
			let form = e.currentTarget;
			let password = form.password?.value;

			if (stringToHash(password) === PASSWORD_HASH) {
				props.onSuccess();
			}
		}}>
		<label class="flex items-center gap-4 text-xl">
			<span>Password</span>
			<input
				name="password"
				type="password"
				class="border border-gray-950 bg-gray-200 p-2 dark:border-gray-300 dark:bg-gray-800"
			/>
		</label>
	</form>
);

function stringToHash(string: string) {
	let hash = 0;

	if (string.length == 0) return hash;

	for (let i = 0; i < string.length; i++) {
		let char = string.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash;
	}

	return hash;
}
