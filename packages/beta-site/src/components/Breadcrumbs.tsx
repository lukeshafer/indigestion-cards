import { useLocation } from '@solidjs/router';
import { For, Match, Show, Switch } from 'solid-js';

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
		<section class="flex gap-2 p-4 text-sm font-medium text-gray-700 underline-offset-4 dark:font-semibold dark:text-gray-50">
			<Show when={paths().length > 1}>
				<For each={paths()}>
					{(path, index) => (
						<Switch
							fallback={
								<>
									<p
										class="font-heading block"
										style={{
											'view-transition-name': `breadcrumb-${index()}`,
										}}>
										{path.label}
									</p>
									<p class="font-heading block">/</p>
								</>
							}>
							<Match when={path.label !== 'Home' || location.pathname === '/'}>
								<p
									class="font-heading text-brand-main block font-bold"
									style={{
										'view-transition-name': `breadcrumb-${index()}`,
									}}>
									{path.label}
								</p>
							</Match>
							<Match when={path.href}>
								{(href) => (
									<>
										<a
											rel="prefetch"
											class="font-heading underline"
											href={href()}
											style={{
												'view-transition-name': `breadcrumb-${index()}`,
											}}>
											{path.label}
										</a>
										<p class="font-heading block">/</p>
									</>
								)}
							</Match>
						</Switch>
					)}
				</For>
			</Show>
		</section>
	);
}
