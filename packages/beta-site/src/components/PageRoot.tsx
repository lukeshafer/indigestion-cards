import { PageContextProvider, initPageContext, usePageContext } from '@site/context';
import { JSX, Suspense } from 'solid-js';
import { RouteSectionProps } from '@solidjs/router';
import { logos } from '@site/constants';

export default function PageRoot(props: RouteSectionProps) {
	const context = initPageContext();
	return (
		<PageContextProvider value={context}>
			<header class="max-w-main mx-auto flex items-center gap-8 py-4">
				<a href="/" title="Home">
					<SiteLogo />
				</a>
				<nav class="flex gap-6">
					<A href="/cards">Cards</A>
					<A href="/users">Users</A>
					<A href="/trades">Trade</A>
					<A href="/me">My Cards</A>
				</nav>
			</header>

			<main
				style={{ 'view-transition-name': context.wide ? undefined : 'main' }}
        data-wide={String(context.wide)}
				classList={{
					[context.class]: true,
				}}
				class="@container/main max-w-main mx-auto mb-8 mt-4 w-full flex-1">
				<Suspense>{props.children}</Suspense>
			</main>
			<div id="card-preview"></div>
		</PageContextProvider>
	);
}

function A(props: Omit<JSX.AnchorHTMLAttributes<HTMLAnchorElement>, 'class'>) {
	return <a class="text-gray-900 dark:text-gray-100" {...props} />;
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
				<span class="text-brand-500 dark:text-brand-300 mt-1 text-2xl italic">
					Indigestion
				</span>
				<span class="-mt-2 text-lg text-gray-600 dark:text-gray-200">Cards</span>
			</div>
		</div>
	);
}
