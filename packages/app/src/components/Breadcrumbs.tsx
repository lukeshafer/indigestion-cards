import { For, Match, Show, Switch } from 'solid-js';
import { useLocation } from '@solidjs/router';

export interface Path {
	label: string;
	href?: string | undefined;
}

export default function Breadcrumbs(props: { path: Path[] }) {
	const fullPath = () => [{ label: 'Home', href: '/' }, ...props.path];
	const location = useLocation();

	return (
		<section class="flex gap-2 p-4 text-sm font-medium text-gray-700 underline-offset-4 dark:font-semibold dark:text-gray-50">
			<Show when={fullPath().length > 1}>
				<For each={fullPath()}>
					{({ label, href }, index) => (
						<Switch>
							<Match
								when={
									index() === fullPath().length - 1 &&
									(label !== 'Home' || location.pathname === '/')
								}>
								<p
									class="font-heading text-brand-main block font-bold"
									style={{ 'view-transition-name': `breadcrumb-${index()}` }}>
									{label}
								</p>
							</Match>
							<Match when={href}>
								<a
									rel="prefetch"
									class="font-heading underline"
									href={href}
									style={{ 'view-transition-name': `breadcrumb-${index()}` }}>
									{label}
								</a>
								<Divider />
							</Match>
							<Match when={true}>
								<p
									class="font-heading block"
									style={{ 'view-transition-name': `breadcrumb-${index()}` }}>
									{label}
								</p>
								<Divider />
							</Match>
						</Switch>
					)}
				</For>
			</Show>
		</section>
	);
}

const Divider = () => (
	<div class="font-heading block" aria-hidden="true">
		/
	</div>
);
