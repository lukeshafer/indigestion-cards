import { PageContextProvider, initPageContext, usePageContext } from '@site/context';
import { type JSX, Suspense } from 'solid-js';
import { type RouteSectionProps } from '@solidjs/router';
import { logos } from '@site/constants';

export default function PageRoot(props: RouteSectionProps) {
	const context = initPageContext();
	return (
		<PageContextProvider value={context}>
			<header class="max-w-main mx-auto flex items-center gap-8 px-8 py-4">
				<a href="/" title="Home">
					<SiteLogo />
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
		</PageContextProvider>
	);
}

function NavLink(props: Omit<JSX.AnchorHTMLAttributes<HTMLAnchorElement>, 'class'>) {
	return (
		<a
			class="rounded-md px-2 py-1 text-gray-900 hover:bg-gray-200 dark:text-gray-100 hover:dark:bg-gray-800"
			{...props}
		/>
	);
}

function SiteLogo() {
	const ctx = usePageContext();

	return (
		<div class="flex items-center gap-2">
			<img
				src={logos[ctx.logo]}
				class="dark:invert"
				alt="Logo, a stylized outline drawing of Ryan's face."
				width="55"
			/>
			<div class="font-display hidden pt-1 lowercase sm:grid">
				<span class="text-brand-500 dark:text-brand-400 mt-1 text-2xl italic">
					Indigestion
				</span>
				<span class="-mt-2 text-lg text-gray-600 dark:text-gray-200">Cards</span>
			</div>
		</div>
	);
}
