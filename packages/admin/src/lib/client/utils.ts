export const useViewTransition = (cb: () => unknown) =>
	// @ts-expect-error - startViewTransition is not on Document yet
	document.startViewTransition ? document.startViewTransition(cb) : cb();

