import { useLocation } from '@solidjs/router';
import { For, Match, Show, Switch } from 'solid-js';

export interface Crumb {
	label: string;
	href?: string | undefined;
}

export default function Breadcrumbs(props: { crumbs: Crumb[] }) {
	const crumbs = () =>
		[
			{
				label: 'Home',
				href: '/',
			},
			...props.crumbs,
		] as Array<Crumb>;

	const location = useLocation();

	return (
		<section class="flex gap-2 p-4 text-sm font-medium text-gray-700 underline-offset-4 dark:font-semibold dark:text-gray-50">
			<Show when={crumbs().length > 1}>
				<For each={crumbs()}>
					{(crumb, index) => (
						<Switch
							fallback={
								<>
									<p
										class="font-heading block"
										style={{ 'view-transition-name': `breadcrumb-${index()}` }}>
										{crumb.label}
									</p>
									<p class="font-heading block" aria-hidden="true">
										/
									</p>
								</>
							}>
							<Match
								when={
									index() === crumbs().length &&
									(crumb.label !== 'Home' || location.pathname === '/')
								}>
								<p
									class="font-heading text-brand-main block font-bold"
									style={{ 'view-transition-name': `breadcrumb-${index()}` }}>
									{crumb.label}
								</p>
							</Match>
							<Match when={crumb.href}>
								<a
									rel="prefetch"
									class="font-heading underline"
									href={crumb.href}
									style={{ 'view-transition-name': `breadcrumb-${index()}` }}>
									{crumb.label}
								</a>
								<p class="font-heading block" aria-hidden="true">
									/
								</p>
							</Match>
						</Switch>
					)}
				</For>
			</Show>
		</section>
	);
}
