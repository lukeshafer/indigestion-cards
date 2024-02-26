import type { Path } from '@/components/Breadcrumbs';
import type { LOGOS } from '@/constants';
import type { Session } from '@lil-indigestion-cards/core/types';

import { createContext, useContext } from 'solid-js';

type PageProps = {
	hideBreadcrumbs?: boolean;
	noHeader?: boolean;
	wide?: boolean;
	logo?: keyof typeof LOGOS;
	breadcrumbs?: Array<Path>;
	class?: string;
};

export type PageContextData = {
	session: Session | null;
	disableAnimations: boolean;
	setDisableAnimations: (value: boolean) => void;
	pageProps: PageProps;
  setPageProps: (value: PageProps) => void;
  title: string;
  setTitle: (value: string) => void;
};

export const PageContext = createContext<PageContextData>({
	session: null,
	disableAnimations: false,
	setDisableAnimations: () => {},
	pageProps: {},
	setPageProps: () => {},
  title: '',
  setTitle: () => {},
});

export const useConfig = () => useContext(PageContext);
