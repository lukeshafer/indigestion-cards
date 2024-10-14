import type { ParentComponent } from 'solid-js';
import { type RouteSectionProps, useBeforeLeave } from '@solidjs/router';

export const ViewTransition: ParentComponent<RouteSectionProps> = props => {
	let isTransitionNavigate = false;

	useBeforeLeave(event => {
		if (document.startViewTransition) {
			// if this is not already the second navigation,
			// which happens after the view-transition was initialized from inside this component
			if (!isTransitionNavigate) {
				const isBackNavigation = Number.isInteger(event.to) && (event.to as number) < 0;

				event.preventDefault();

				isTransitionNavigate = true;

				if (isBackNavigation) {
          // TODO : replace these classes with some other thing
					document.documentElement.classList.add('back-navigation');
					const transition = document.startViewTransition(() => {
						event.retry();
					});

					transition.finished.finally(() => {
						isTransitionNavigate = false;
						document.documentElement.classList.remove('back-navigation');
					});
				}
			}
		}
	});

	return <>{props.children}</>;
};
