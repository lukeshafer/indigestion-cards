import { A, useLocation } from '@solidjs/router';
import { As, Breadcrumbs as KBreadcrumbs } from '@kobalte/core';
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
		<KBreadcrumbs.Root separator="/">
			<ol class="flex gap-2 p-4 text-sm font-medium text-gray-700 underline-offset-4 dark:font-semibold dark:text-gray-50">
				<For each={paths()}>
					{(path) => (
						<li class="flex gap-2">
							<KBreadcrumbs.Link asChild current={path.current}>
								<As
									component={A}
									href={path.href}
									class="font-heading"
									classList={{ underline: !path.current }}>
									{path.label}
								</As>
							</KBreadcrumbs.Link>
							<Show when={!path.current}>
								<KBreadcrumbs.Separator />
							</Show>
						</li>
					)}
				</For>
			</ol>
		</KBreadcrumbs.Root>
	);
}
