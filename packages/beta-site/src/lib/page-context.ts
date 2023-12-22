import { createContextProvider } from '@solid-primitives/context';
import { createStore } from 'solid-js/store';
import type { ParentProps } from 'solid-js';
import type { BreadcrumbProps } from '~/components/Breadcrumbs';

type PageContextState = {
	breadcrumbs: BreadcrumbProps[];
};

type PageContext = {
	breadcrumbs: () => BreadcrumbProps[];
	setBreadcrumbs(breadcrumbs: BreadcrumbProps[]): void;
};

export const [PageContextProvider, usePageContext] = createContextProvider<
	PageContext,
	ParentProps
>(
	() => {
		const [state, setState] = createStore<PageContextState>({
			breadcrumbs: [],
		});

		return {
			breadcrumbs: () => state.breadcrumbs,
			setBreadcrumbs(breadcrumbs: BreadcrumbProps[]) {
				console.log({ breadcrumbs });
				setState('breadcrumbs', breadcrumbs);
			},
		};
	},
	{
		breadcrumbs: (): BreadcrumbProps[] => [],
		setBreadcrumbs() { },
	}
);
