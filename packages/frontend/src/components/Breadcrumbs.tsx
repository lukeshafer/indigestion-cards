import { useLocation } from '@solidjs/router';
import { Breadcrumbs as BreadcrumbsKobalte } from '@kobalte/core';
import { For, Show } from 'solid-js';

export type BreadcrumbProps = {
	label: string;
	href?: string | undefined;
	current?: boolean;
};

export default function Breadcrumbs() {
	const location = useLocation();
	const paths = () =>
		location.pathname
			.split('/')
			.filter(Boolean)
			.map((location, index, arr) => ({
				label: location.charAt(0).toUpperCase() + location.slice(1) || 'Home',
				href: '/' + arr.slice(0, index + 1).join('/'),
				current: index + 1 === arr.length,
			})) satisfies BreadcrumbProps[];

	return (
		<BreadcrumbsKobalte.Root separator="/">
			<ol class="flex gap-2 p-4 text-sm font-medium text-gray-700 underline-offset-4 dark:font-semibold dark:text-gray-50">
				<For each={paths()}>
					{(path) => (
						<li class="flex gap-2">
							<BreadcrumbsKobalte.Link
								href={path.href}
								class="font-heading"
								current={path.current}
								classList={{ underline: !path.current }}>
								{path.label}
							</BreadcrumbsKobalte.Link>
							<Show when={!path.current}>
								<BreadcrumbsKobalte.Separator />
							</Show>
						</li>
					)}
				</For>
			</ol>
		</BreadcrumbsKobalte.Root>
	);
}

export function BreadcrumbsOrig(props: { paths: BreadcrumbProps[] }) {
	const location = useLocation();
	const paths = () =>
		[
			{
				label: 'Home',
				href: '/',
			},
			...props.paths,
		] satisfies BreadcrumbProps[];

	return (
		<section class="flex gap-2 p-4 text-sm font-medium text-gray-700 underline-offset-4 dark:font-semibold dark:text-gray-50">
			<Show when={paths().length > 1}>
				<For each={paths()}>
					{({ label, href }, index) => {
						const isLastItem = () => index() === paths().length - 1;
						const isPathNotHome = () => label !== 'Home';
						const isAtHome = () => location.pathname === '/';
						if (isLastItem() && (isPathNotHome() || isAtHome())) {
							return (
								<p
									class="font-heading text-brand-main block font-bold"
									style={{ 'view-transition-name': `breadcrumb-${index()}` }}>
									{label}
								</p>
							);
						}
						if (href) {
							return (
								<>
									<a
										rel="prefetch"
										class="font-heading underline"
										href={href}
										style={{ 'view-transition-name': `breadcrumb-${index()}` }}>
										{label}
									</a>
									<p class="font-heading block">/</p>
								</>
							);
						} else {
							return (
								<>
									<p
										class="font-heading block"
										style={{ 'view-transition-name': `breadcrumb-${index()}` }}>
										{label}
									</p>
									<p class="font-heading block">/</p>
								</>
							);
						}
					}}
				</For>
			</Show>
		</section>
	);
}
