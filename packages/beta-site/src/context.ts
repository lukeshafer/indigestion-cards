import { createContext, useContext } from 'solid-js';
import { createMutable } from 'solid-js/store';

type PageContext = {
	wide: boolean;
	class: string;
	logo: 'default' | 'tongle';
};

const PageContext = createContext<PageContext>({
	wide: false,
	class: '',
	logo: 'default',
});

export function usePageContext(): PageContext {
	return useContext(PageContext);
}

export function initPageContext(): PageContext {
	return createMutable(PageContext.defaultValue);
}

export const PageContextProvider = PageContext.Provider;
